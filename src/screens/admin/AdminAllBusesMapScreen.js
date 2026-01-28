import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from "react-native-maps";
import io from "socket.io-client";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import client from "../../api/client";
import { adminApi } from "../../api/adminApi";

import { useTrackingSocket } from "../../hooks/useTrackingSocket";

const AdminAllBusesMapScreen = ({ navigation }) => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef(null);

    const { connectionStatus, onLocationUpdate, joinAdmin } = useTrackingSocket("ADMIN_FLEET");

    useEffect(() => {
        fetchTrips();
    }, []);

    // JOIN ADMIN GLOBAL ROOM
    useEffect(() => {
        joinAdmin();
    }, [connectionStatus]);

    // HANDLE INCOMING UPDATES
    useEffect(() => {
        const cleanup = onLocationUpdate((data) => {
            setTrips(prev => prev.map(trip => {
                if (trip._id === data.tripId) {
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
    }, [onLocationUpdate]);

    const fitMap = (currentTrips) => {
        const coords = currentTrips
            .filter(t => t.location)
            .map(t => ({ latitude: t.location.lat, longitude: t.location.lng }));

        if (coords.length > 0) {
            mapRef.current?.fitToCoordinates(coords, {
                edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
                animated: true,
            });
        }
    };

    const fetchTrips = async () => {
        try {
            const res = await adminApi.getLiveTrips();
            setTrips(res.data || []);

            // Adjust map to fit all buses if available
            if (res.data && res.data.length > 0) {
                setTimeout(() => fitMap(res.data), 1000);
            }
        } catch (err) {
            console.log("Error fetching trips:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#4c51bf" />
            <Text style={{ marginTop: 10 }}>Loading Live Map...</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: 12.9716,
                    longitude: 77.5946,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                }}
            >
                {trips.filter(t => t.location).map(trip => (
                    <Marker
                        key={trip._id}
                        coordinate={{ latitude: trip.location.lat, longitude: trip.location.lng }}
                        title={trip.busId?.busNumber || "School Bus"}
                    >
                        <View style={styles.markerContainer}>
                            <Image
                                source={{ uri: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png" }}
                                style={styles.busIcon}
                            />
                            <View style={styles.labelContainer}>
                                <Text style={styles.labelText}>{trip.busId?.busNumber}</Text>
                            </View>
                        </View>
                        <Callout tooltip onPress={() => navigation.navigate("AdminMap", { trip })}>
                            <View style={styles.callout}>
                                <Text style={styles.calloutTitle}>{trip.busId?.busNumber}</Text>
                                <Text style={styles.calloutText}>Driver: {trip.driverId?.name}</Text>
                                <Text style={styles.calloutText}>Route: {trip.routeId?.name}</Text>
                                <Text style={styles.calloutText}>Speed: {trip.location.speed} km/h</Text>
                                <View style={styles.detailBtn}>
                                    <Text style={styles.detailText}>TAP TO TRACK LIVE</Text>
                                </View>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>

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
