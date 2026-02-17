import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import client from "../../api/client";
import { SafeAreaView } from "react-native-safe-area-context";
import MapComponent from "../../components/MapComponent";
import { useTrackingSocket } from "../../hooks/useTrackingSocket";

const ParentMapScreen = ({ route, navigation }) => {
    const { tripId, bus } = route.params || {};

    if (!tripId && !bus) {
        return (
            <View style={styles.center}>
                <Text style={{ color: "#718096" }}>No active trip found.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Text style={{ color: "#4c51bf", fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }
    const [busDetails] = useState(bus || null);
    const [busLocation, setBusLocation] = useState(null);
    const [speed, setSpeed] = useState(0);
    const [heading, setHeading] = useState(0);
    const { connectionStatus, onLocationUpdate, onOfflineUpdate, joinBus, joinTrip, isConnected } = useTrackingSocket("PARENT");
    const [lastUpdated, setLastUpdated] = useState("");
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('MORNING');

    useEffect(() => {
        fetchInitialLocation();

        const cleanupLoc = onLocationUpdate((data) => {
            const incomingTripId = data.tripId?.toString();
            const incomingBusId = data.busId?.toString();
            const currentTripId = tripId?.toString();
            const currentBusId = bus?._id?.toString();

            const isMatch = (currentTripId && incomingTripId === currentTripId) ||
                (currentBusId && incomingBusId === currentBusId);

            if (isMatch && typeof data.lat === 'number' && typeof data.lng === 'number') {
                const newLoc = { latitude: data.lat, longitude: data.lng };
                setBusLocation(newLoc);
                setSpeed(data.speed || 0);
                setHeading(data.heading || 0);
                setLastUpdated(new Date(data.time || Date.now()).toLocaleTimeString());
                if (data.mode) setMode(data.mode);
            }
        });

        const cleanupOffline = onOfflineUpdate((data) => {
            const incomingTripId = data.tripId?.toString();
            const currentTripId = tripId?.toString();

            if (incomingTripId === currentTripId) {
                setBusLocation(prev => prev ? { ...prev, status: 'offline' } : null);
            }
        });

        return () => {
            cleanupLoc();
            cleanupOffline();
        };
    }, [tripId, bus?._id, onLocationUpdate, onOfflineUpdate, isConnected]);

    // JOIN BUS & TRIP ROOMS FOR REAL-TIME UPDATES
    useEffect(() => {
        if (bus?._id) joinBus(bus._id);
        if (tripId) joinTrip(tripId);
    }, [bus?._id, tripId, connectionStatus, joinBus, joinTrip]);

    const fetchInitialLocation = async () => {
        try {
            const id = tripId || bus?._id;
            if (!id) {
                setLoading(false);
                return;
            }

            const res = await client.get(`/tracking/live/${id}`);
            const { success, data, message } = res.data || {};

            if (success && data && typeof data.lat === 'number') {
                const loc = { latitude: data.lat, longitude: data.lng };
                setBusLocation(loc);
                setSpeed(data.speed || 0);
                setLastUpdated(new Date(data.timestamp || data.time || Date.now()).toLocaleTimeString());
                if (data.type) setMode(data.type);
            } else {
                console.log("[PARENT] No live location:", message || "Bus idle");
                setBusLocation(null);
            }
        } catch (err) {
            const errMsg = err.response?.data?.message || err.message;
            console.log("[PARENT] Error fetching location:", errMsg);
            // Handle 404/500 gracefully
            setBusLocation(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#4c51bf" />
            <Text style={{ marginTop: 10, color: "#718096" }}>Locating school bus...</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <MapComponent
                busLocation={busLocation}
                busDetails={busDetails}
                polyline={busDetails?.route?.polyline || ""}
                speed={speed}
                heading={heading}
                isDriver={false}
                connectionStatus={connectionStatus}
                lastUpdated={lastUpdated}
                mode={mode}
                routeStops={busDetails?.route?.stops || []}
            />

            <SafeAreaView style={styles.backBtnContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
            </SafeAreaView>

            <View style={styles.bottomSheet}>
                <View style={styles.dragHandle} />
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.busTitle}>{busDetails ? busDetails.busNumber : "School Bus"}</Text>
                        <Text style={styles.statusText}>
                            {busLocation ? "● Tracking Live" : (busDetails?.status === "OFFLINE" ? "● Bus is Offline" : "● Waiting for GPS signal...")}
                        </Text>
                    </View>
                    <View style={styles.ratingBox}>
                        <Text style={styles.ratingText}>Active</Text>
                    </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.driverRow}>
                    <View style={styles.driverAvatar}>
                        <Ionicons name="person" size={24} color="#4a5568" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.driverName}>Live Tracking</Text>
                        <Text style={styles.driverPhone}>Real-time updates via Sockets</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
    backBtnContainer: { position: "absolute", top: 40, left: 16, zIndex: 10 },
    backBtn: { backgroundColor: "white", padding: 12, borderRadius: 30, elevation: 5, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    bottomSheet: { position: "absolute", bottom: 0, width: "100%", backgroundColor: "white", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 45, elevation: 15, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: -5 } },
    dragHandle: { width: 40, height: 6, backgroundColor: "#edf2f7", borderRadius: 3, alignSelf: "center", marginBottom: 20 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    busTitle: { fontSize: 22, fontWeight: "bold", color: "#2d3748" },
    statusText: { color: "#48bb78", fontSize: 14, fontWeight: "600", marginTop: 4 },
    ratingBox: { backgroundColor: "#ebf8ff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    ratingText: { color: "#3182ce", fontWeight: "bold", fontSize: 14 },
    divider: { height: 1, backgroundColor: "#f7fafc", marginVertical: 20 },
    driverRow: { flexDirection: "row", alignItems: "center" },
    driverAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#f7fafc", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#edf2f7" },
    driverName: { fontSize: 18, fontWeight: "bold", color: "#2d3748" },
    driverPhone: { fontSize: 14, color: "#a0aec0", marginTop: 2 },
});

export default ParentMapScreen;
