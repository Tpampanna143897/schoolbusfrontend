import React, { useEffect, useState, useRef, useMemo } from "react";
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Image } from "react-native";
// Map imports handled by MapComponent
import io from "socket.io-client";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import client from "../../api/client";
import { adminApi } from "../../api/adminApi";
import MapComponent from "../../components/MapComponent";

import { useTrackingSocket } from "../../hooks/useTrackingSocket";

const AdminAllBusesMapScreen = ({ navigation }) => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef(null);

    const { connectionStatus, onLocationUpdate, joinAdmin, isConnected } = useTrackingSocket("ADMIN_FLEET");

    useEffect(() => {
        fetchTrips();
    }, []);

    // JOIN ADMIN GLOBAL ROOM
    useEffect(() => {
        joinAdmin();
    }, [connectionStatus, joinAdmin]);

    // HANDLE INCOMING UPDATES
    useEffect(() => {
        const cleanup = onLocationUpdate((data) => {
            const incomingTripId = data.tripId?.toString();
            setTrips(prev => prev.map(trip => {
                if (trip._id?.toString() === incomingTripId) {
                    return {
                        ...trip,
                        location: {
                            lat: data.lat,
                            lng: data.lng,
                            speed: data.speed,
                            timestamp: data.time
                        }
                    };
                }
                return trip;
            }));
        });
        return cleanup;
    }, [onLocationUpdate, isConnected]);

    const fitMap = (currentTrips) => {
        const busCoords = currentTrips
            .filter(t => t.location && typeof t.location.lat === 'number' && !isNaN(t.location.lat) && t.location.lat !== 0)
            .map(t => ({ latitude: t.location.lat, longitude: t.location.lng }));

        const routeCoords = [];
        currentTrips.forEach(t => {
            if (t.routeId?.stops?.length > 0) {
                const stops = t.routeId.stops;
                routeCoords.push({ latitude: stops[0].lat, longitude: stops[0].lng });
                routeCoords.push({ latitude: stops[stops.length - 1].lat, longitude: stops[stops.length - 1].lng });
            }
            if (t.routeId?.schoolLocation?.lat) {
                routeCoords.push({
                    latitude: t.routeId.schoolLocation.lat,
                    longitude: t.routeId.schoolLocation.lng
                });
            }
        });

        const allCoords = [...busCoords, ...routeCoords];

        if (allCoords.length > 0) {
            mapRef.current?.fitToCoordinates(allCoords, {
                edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
                animated: true,
            });
        } else {
            // Default center if no data (Bangalore)
            mapRef.current?.animateToRegion({
                latitude: 12.9716,
                longitude: 77.5946,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1
            });
        }
    };

    const fetchTrips = async () => {
        try {
            const res = await adminApi.getLiveTrips();
            console.log("[FLEET ADMIN] Fetch result:", res.data);

            const { success, data } = res.data || {};
            if (success && Array.isArray(data)) {
                setTrips(data);
                // Adjust map to fit all buses if available
                if (data.length > 0) {
                    setTimeout(() => fitMap(data), 500);
                }
            } else {
                console.warn("[FLEET ADMIN] API Success false or data not array:", res.data?.message);
                setTrips([]);
            }
        } catch (err) {
            console.error("[FLEET ADMIN] Fetch Error:", err.message);
            setTrips([]);
        } finally {
            setLoading(false);
        }
    };

    // Map all active trips to the "buses" format for the smooth multi-marker support
    const displayBuses = trips
        .filter(t => t && t.location && typeof t.location.lat === 'number' && !isNaN(t.location.lat) && t.location.lat !== 0)
        .map(t => ({
            id: t._id,
            location: { latitude: t.location.lat, longitude: t.location.lng },
            heading: t.location.heading || 0,
            busNumber: t.busId?.busNumber || "Bus"
        }));

    // Generate unique landmarks for all active routes
    const fleetLandmarks = useMemo(() => {
        const marks = [];
        const added = new Set();

        trips.forEach(t => {
            if (t.routeId?.stops?.length > 0) {
                const stops = t.routeId.stops;
                const start = stops[0];
                const end = stops[stops.length - 1];

                if (start && typeof start.lat === 'number' && typeof start.lng === 'number') {
                    const startKey = `START-${start.lat}-${start.lng}`;
                    if (!added.has(startKey)) {
                        marks.push({ latitude: start.lat, longitude: start.lng, title: 'Route Start', type: 'START' });
                        added.add(startKey);
                    }
                }

                if (end && typeof end.lat === 'number' && typeof end.lng === 'number') {
                    const endKey = `END-${end.lat}-${end.lng}`;
                    if (!added.has(endKey)) {
                        marks.push({ latitude: end.lat, longitude: end.lng, title: 'Route End', type: 'END' });
                        added.add(endKey);
                    }
                }
            }
            if (t.routeId?.schoolLocation?.lat && typeof t.routeId.schoolLocation.lat === 'number') {
                const sch = t.routeId.schoolLocation;
                const schKey = `SCHOOL-${sch.lat}-${sch.lng}`;
                if (!added.has(schKey)) {
                    marks.push({
                        latitude: sch.lat,
                        longitude: sch.lng,
                        title: 'School',
                        type: 'SCHOOL'
                    });
                    added.add(schKey);
                }
            }
        });
        return marks;
    }, [trips]);

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#4c51bf" />
            <Text style={{ marginTop: 10 }}>Loading Live Map...</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <MapComponent
                ref={mapRef}
                buses={displayBuses}
                landmarks={fleetLandmarks}
                connectionStatus={trips.length > 0 ? `Fleet: ${trips.length} Active` : "Scanning Fleet..."}
                onBusPress={(bus) => {
                    const trip = trips.find(t => t._id === bus.id);
                    if (trip) navigation.navigate("AdminMap", { trip });
                }}
            />

            <SafeAreaView style={styles.headerOverlay} edges={['top']}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <View style={styles.headerTitle}>
                    <Text style={styles.titleText}>Fleet Overview</Text>
                    <Text style={styles.subtitleText}>{trips.length} Active Trips Online</Text>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    headerOverlay: { position: 'absolute', top: 10, left: 16, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
    backBtn: { backgroundColor: "white", padding: 12, borderRadius: 30, elevation: 8, marginRight: 15 },
    headerTitle: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, elevation: 4 },
    titleText: { fontSize: 16, fontWeight: 'bold', color: '#1a365d' },
    subtitleText: { fontSize: 10, color: '#718096' },
    markerContainer: { alignItems: 'center', justifyContent: 'center' },
    busIcon: { width: 44, height: 44, resizeMode: 'contain' },
    labelContainer: { backgroundColor: 'white', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: -5, borderWidth: 1, borderColor: '#cbd5e0', elevation: 2 },
    labelText: { fontSize: 9, fontWeight: 'bold', color: '#2d3748' },
    callout: { width: 180, padding: 12, backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    calloutTitle: { fontWeight: 'bold', fontSize: 16, color: '#2d3748', marginBottom: 5 },
    calloutText: { fontSize: 12, color: '#4a5568', marginBottom: 2 },
    detailBtn: { marginTop: 10, backgroundColor: '#4c51bf', paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
    detailText: { color: 'white', fontSize: 10, fontWeight: 'bold' }
});

export default AdminAllBusesMapScreen;
