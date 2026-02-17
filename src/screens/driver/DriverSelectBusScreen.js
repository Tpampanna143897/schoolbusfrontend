import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { driverApi } from '../../api/driverApi';
import client from '../../api/client';
import Dropdown from '../../components/Dropdown';
import { storage } from '../../utils/storage';

const DriverSelectBusScreen = ({ navigation }) => {
    const [buses, setBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [selectedBusId, setSelectedBusId] = useState('');
    const [selectedRouteId, setSelectedRouteId] = useState('');
    const [selectedMode, setSelectedMode] = useState('MORNING');
    const [selectedBus, setSelectedBus] = useState(null);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startingTrip, setStartingTrip] = useState(false);
    const [hasActiveTrip, setHasActiveTrip] = useState(null);
    const [locationPermission, setLocationPermission] = useState('undetermined');

    useEffect(() => {
        fetchInitialData();
        checkLocationPermission();
    }, []);

    const checkLocationPermission = async () => {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            setLocationPermission(status);
        } catch (err) {
            console.log("Error checking permission:", err);
        }
    };

    const requestPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(status);
            if (status !== 'granted') {
                Alert.alert("Permission Required", "This app needs location access to track the bus journey accurately. Please grant permission in settings if not prompted.");
            }
        } catch (err) {
            Alert.alert("Error", "Failed to request permission.");
        }
    };

    const fetchInitialData = async () => {
        try {
            console.log("Fetching Initial Data for Driver Selection...");
            const [busRes, routeRes, activeRes] = await Promise.all([
                driverApi.getBuses(),
                driverApi.getRoutes(),
                driverApi.getActiveTrip()
            ]);

            const busData = busRes.data || {};
            const routeData = routeRes.data || {};
            const activeData = activeRes.data || {};

            const busList = Array.isArray(busData.data) ? busData.data : [];
            const routeList = Array.isArray(routeData.data) ? routeData.data : [];

            if (activeData.success && activeData.data && activeData.data._id) {
                console.log("Active trip detected in selection screen:", activeData.data._id);
                setHasActiveTrip(activeData.data);
            }

            setBuses(busList);
            setRoutes(routeList);

            // Auto-select bus if only one and no active trip
            if (busList.length === 1 && busList[0]?._id && (!activeData.data || !activeData.data._id)) {
                handleBusSelect(busList[0]._id, busList, routeList);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            Alert.alert("Error", "Unable to fetch assigned data.");
        } finally {
            setLoading(false);
        }
    };

    const handleBusSelect = (busId, currentBuses = buses, currentRoutes = routes) => {
        console.log("Bus Selected:", busId);
        setSelectedBusId(busId);

        if (!busId) {
            setSelectedBus(null);
            setSelectedRouteId('');
            setSelectedRoute(null);
            return;
        }

        if (!Array.isArray(currentBuses)) return;
        const bus = currentBuses.find(b => b && b._id === busId);
        if (!bus) {
            console.warn("Selected bus NOT found in list");
            setSelectedBus(null);
            return;
        }

        setSelectedBus(bus);

        // Auto-select bus's default route if available
        const targetRouteId = bus.defaultRoute?._id || bus.defaultRoute || bus.route?._id;
        console.log("Default route for bus:", targetRouteId);

        if (targetRouteId) {
            handleRouteSelect(targetRouteId, currentRoutes);
        } else {
            setSelectedRouteId('');
            setSelectedRoute(null);
        }
    };

    const handleRouteSelect = (routeId, currentRoutes = routes) => {
        console.log("Route Selected:", routeId);
        setSelectedRouteId(routeId);
        if (!routeId) {
            setSelectedRoute(null);
            return;
        }

        if (!Array.isArray(currentRoutes)) return;
        const route = currentRoutes.find(r => r && r._id === routeId);
        if (route) {
            setSelectedRoute(route);
        } else {
            console.warn("Selected route NOT found in list");
            setSelectedRoute(null);
        }
    };

    const handleForceEnd = async () => {
        Alert.alert("End Previous Journey?", "You have a journey already in progress. End it to start a new one?", [
            { text: "No, Resume", onPress: () => navigation.navigate("DriverMap", { bus: hasActiveTrip.busId, tripId: hasActiveTrip._id }) },
            {
                text: "Yes, End It",
                style: "destructive",
                onPress: async () => {
                    try {
                        await client.post('/driver/end-trip', { tripId: hasActiveTrip._id });
                        setHasActiveTrip(null);
                        Alert.alert("Success", "Previous session cleared.");
                        fetchInitialData();
                    } catch (err) {
                        Alert.alert("Error", "Failed to clear session.");
                    }
                }
            }
        ]);
    };

    const handleStartTrip = async () => {
        if (hasActiveTrip) return handleForceEnd();

        if (locationPermission !== 'granted') {
            return requestPermission();
        }

        if (!selectedBusId || !selectedRouteId) {
            Alert.alert("Required", "Please select both a bus and a route.");
            return;
        }

        try {
            setStartingTrip(true);

            // 3) Lock bus so only one driver can activate it
            await driverApi.selectBus({
                busId: selectedBusId,
                shift: selectedMode
            });
            console.log("Bus selected with mode:", selectedMode);

            const res = await driverApi.startTrip({
                busId: selectedBusId,
                routeId: selectedRouteId,
                type: selectedMode
            });

            const tripSessionId = res.data.data.tripId;
            const busDataToStore = { ...selectedBus, route: selectedRoute };

            // Persist for Background Task
            await storage.setItemAsync("active_trip_id", tripSessionId);
            await storage.setItemAsync("active_bus_id", selectedBusId);
            const drId = res.data.data.driverId || '';
            if (drId) await storage.setItemAsync("active_driver_id", drId);

            navigation.navigate("DriverMap", {
                bus: busDataToStore,
                tripId: tripSessionId,
                mode: selectedMode
            });
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to start trip.";
            if (error.response?.status === 409) {
                // Specialized handling for conflict
                Alert.alert(
                    "Bus Already Active",
                    "This bus is already being tracked by another session. You can take over if you are authorized.",
                    [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Force Take-Over",
                            style: "destructive",
                            onPress: async () => {
                                try {
                                    await driverApi.resetBus(selectedBusId);
                                    Alert.alert("Success", "Bus released. You can now start your journey.");
                                    fetchInitialData();
                                } catch (e) {
                                    Alert.alert("Error", e.response?.data?.message || "Failed to reset bus.");
                                }
                            }
                        }
                    ]
                );
            } else if (msg.includes("already")) {
                fetchInitialData();
                Alert.alert("Error", msg);
            } else {
                Alert.alert("Error", msg);
            }
        } finally {
            setStartingTrip(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#48bb78" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Ready for Trip?</Text>
                    <Text style={styles.subtitle}>Select vehicle and confirm route</Text>
                </View>

                <View style={styles.formCard}>
                    <Dropdown
                        label="1. Select Bus Number"
                        selectedValue={selectedBusId}
                        onValueChange={handleBusSelect}
                        placeholder="Choose a bus..."
                        items={buses.map(b => ({ id: b._id, label: b.busNumber }))}
                    />

                    <Dropdown
                        label="2. Select Service Route"
                        selectedValue={selectedRouteId}
                        onValueChange={handleRouteSelect}
                        placeholder="Choose a route..."
                        items={routes.map(r => ({ id: r._id, label: r.name }))}
                    />

                    <Dropdown
                        label="3. Trip Mode"
                        selectedValue={selectedMode}
                        onValueChange={(val) => setSelectedMode(val)}
                        items={[
                            { id: 'MORNING', label: 'Morning (Home to School)' },
                            { id: 'EVENING', label: 'Evening (School to Home)' }
                        ]}
                    />
                </View>

                {locationPermission !== 'granted' && (
                    <View style={[styles.activeWarning, { borderColor: '#ed8936', backgroundColor: '#fffaf0' }]}>
                        <Ionicons name="location-outline" size={24} color="#dd6b20" />
                        <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text style={[styles.warningTitle, { color: '#c05621' }]}>Location Access Required</Text>
                            <Text style={[styles.warningText, { color: '#c05621' }]}>
                                GPS tracking is disabled. Tap 'FIX' to grant permission.
                            </Text>
                        </View>
                        <TouchableOpacity style={[styles.resolveBtn, { backgroundColor: '#dd6b20' }]} onPress={requestPermission}>
                            <Text style={styles.resolveBtnTxt}>FIX</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {hasActiveTrip && (
                    <View style={styles.activeWarning}>
                        <View style={styles.warningHeader}>
                            <Ionicons name="alert-circle" size={24} color="#c53030" />
                            <Text style={styles.warningTitle}>Bus Busy / Stuck Session</Text>
                        </View>
                        <Text style={styles.warningText}>
                            Bus {hasActiveTrip.busId?.busNumber} is already marked as ACTIVE. You must release it to start a new ride.
                        </Text>
                        <TouchableOpacity style={styles.resolveBtnLarge} onPress={handleForceEnd}>
                            <Ionicons name="flash" size={18} color="white" />
                            <Text style={styles.resolveBtnTxtLarge}>Clear Stuck Session & Take Over</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {selectedRoute && (
                    <View style={styles.previewCard}>
                        <View style={styles.previewHeader}>
                            <Ionicons name="trail-sign" size={24} color="#48bb78" />
                            <Text style={styles.routeName}>{selectedRoute.name}</Text>
                        </View>

                        <View style={styles.stopsContainer}>
                            {selectedRoute.stops?.map((stop, index) => (
                                <View key={index} style={styles.stopRow}>
                                    <View style={styles.stopIndicator}>
                                        <View style={[styles.dot, index === 0 && styles.firstDot]} />
                                        {index < selectedRoute.stops.length - 1 && <View style={styles.line} />}
                                    </View>
                                    <Text style={styles.stopLabel}>{stop}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.startBtn,
                        (!selectedBusId || !selectedRouteId || startingTrip || locationPermission !== 'granted') && styles.disabledBtn
                    ]}
                    onPress={handleStartTrip}
                    disabled={!selectedBusId || !selectedRouteId || startingTrip || locationPermission !== 'granted'}
                >
                    {startingTrip ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="play" size={24} color="white" />
                            <Text style={styles.startBtnText}>Start Tracking Now</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0faf5' },
    content: { padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { marginBottom: 30 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1a202c' },
    subtitle: { fontSize: 16, color: '#718096', marginTop: 5 },
    formCard: { backgroundColor: 'white', padding: 20, borderRadius: 24, elevation: 4, marginBottom: 20 },
    previewCard: { backgroundColor: 'white', padding: 20, borderRadius: 24, elevation: 2, marginBottom: 30 },
    previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    routeName: { fontSize: 20, fontWeight: 'bold', color: '#2d3748', marginLeft: 12 },
    stopsContainer: { paddingLeft: 10 },
    stopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    stopIndicator: { alignItems: 'center', width: 20, marginRight: 15 },
    dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#cbd5e0' },
    firstDot: { backgroundColor: '#48bb78' },
    line: { width: 2, height: 25, backgroundColor: '#edf2f7', position: 'absolute', top: 12 },
    stopLabel: { fontSize: 16, color: '#4a5568' },
    startBtn: { backgroundColor: '#48bb78', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 20, borderRadius: 16, elevation: 8 },
    disabledBtn: { backgroundColor: '#a0aec0' },
    startBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18, marginLeft: 10 },
    activeWarning: { backgroundColor: '#fff5f5', padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: '#feb2b2', elevation: 2 },
    warningHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    warningTitle: { fontWeight: 'bold', color: '#c53030', fontSize: 18, marginLeft: 10 },
    warningText: { color: '#e53e3e', fontSize: 14, lineHeight: 20, marginBottom: 15 },
    resolveBtnLarge: { backgroundColor: '#c53030', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, borderRadius: 12 },
    resolveBtnTxtLarge: { color: 'white', fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
    resolveBtn: { backgroundColor: '#dd6b20', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    resolveBtnTxt: { color: 'white', fontWeight: 'bold', fontSize: 12 },
});

export default DriverSelectBusScreen;
