import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import io from "socket.io-client";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import client from "../../api/client";
import { adminApi } from "../../api/adminApi";
import { useTrackingSocket } from "../../hooks/useTrackingSocket";
import MapComponent from "../../components/MapComponent";

const AdminMapScreen = ({ route, navigation }) => {
    const { trip } = route.params || {};

    if (!trip) {
        return (
            <View style={styles.center}>
                <Text style={styles.loadingText}>Loading trip details...</Text>
            </View>
        );
    }
    const [busLocation, setBusLocation] = useState(null);
    const [speed, setSpeed] = useState(0);
    const [heading, setHeading] = useState(0);
    const [lastUpdated, setLastUpdated] = useState("");
    const [loading, setLoading] = useState(true);

    const { connectionStatus, onLocationUpdate, joinBus, isConnected } = useTrackingSocket("ADMIN");

    useEffect(() => {
        fetchInitialLocation();
    }, []);

    // JOIN BUS ROOM
    useEffect(() => {
        if (trip.busId?._id) {
            joinBus(trip.busId._id);
        }
    }, [trip.busId?._id, connectionStatus, joinBus]);

    // HANDLE INCOMING UPDATES
    useEffect(() => {
        const cleanup = onLocationUpdate((data) => {
            if (data && data.tripId == trip._id && typeof data.lat === 'number') {
                setBusLocation({ latitude: data.lat, longitude: data.lng });
                setSpeed(data.speed || 0);
                setHeading(data.heading || 0);
                setLastUpdated(new Date(data.time || Date.now()).toLocaleTimeString());
            }
        });
        return cleanup;
    }, [trip._id, onLocationUpdate, isConnected]);

    const fetchInitialLocation = async () => {
        try {
            const res = await adminApi.getTripLocation(trip._id);
            if (res.data && typeof res.data.lat === 'number') {
                setBusLocation({ latitude: res.data.lat, longitude: res.data.lng });
                setSpeed(res.data.speed || 0);
                setLastUpdated(new Date(res.data.timestamp || Date.now()).toLocaleTimeString());
            }
        } catch (err) {
            console.log("No initial location found for trip");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#4c51bf" />
            <Text style={styles.loadingText}>Initializing live tracking...</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <MapComponent
                busLocation={busLocation}
                busDetails={trip.busId}
                polyline={trip.routeId?.polyline || ""}
                speed={speed}
                heading={heading}
                isDriver={false}
                connectionStatus={connectionStatus}
                lastUpdated={lastUpdated}
            />

            <SafeAreaView style={styles.backBtnContainer} edges={['top']}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
            </SafeAreaView>

            <View style={styles.bottomSheet}>
                <View style={styles.dragHandle} />
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.busTitle}>{trip.busId?.busNumber || "Bus"}</Text>
                        <Text style={styles.routeName}>{trip.routeId?.name || "Route"}</Text>
                    </View>
                    <View style={styles.statusBox}>
                        <Text style={styles.statusText}>{trip.status}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.driverRow}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={24} color="#4a5568" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={styles.driverName}>{trip.driverId?.name || "Driver"}</Text>
                        <Text style={styles.driverPhone}>{trip.driverId?.email}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' },
    loadingText: { marginTop: 12, color: '#718096' },
    backBtnContainer: { position: "absolute", top: 10, left: 16, zIndex: 10 },
    backBtn: { backgroundColor: "white", padding: 12, borderRadius: 30, elevation: 8, shadowColor: "#000", shadowOpacity: 0.2 },
    bottomSheet: { position: "absolute", bottom: 0, width: "100%", backgroundColor: "white", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 45, elevation: 20, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 15, shadowOffset: { width: 0, height: -5 } },
    dragHandle: { width: 40, height: 6, backgroundColor: "#edf2f7", borderRadius: 3, alignSelf: "center", marginBottom: 20 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    busTitle: { fontSize: 24, fontWeight: "bold", color: "#2d3748" },
    routeName: { fontSize: 14, color: "#718096", marginTop: 2 },
    statusBox: { backgroundColor: "#ebf8ff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusText: { color: "#3182ce", fontWeight: "bold", fontSize: 14 },
    divider: { height: 1, backgroundColor: "#f7fafc", marginVertical: 20 },
    driverRow: { flexDirection: "row", alignItems: "center" },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#f7fafc", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#edf2f7" },
    driverName: { fontSize: 18, fontWeight: "bold", color: "#2d3748" },
    driverPhone: { fontSize: 14, color: "#a0aec0", marginTop: 2 },
});

export default AdminMapScreen;
