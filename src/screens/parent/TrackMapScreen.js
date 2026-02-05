import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Text, ActivityIndicator, Dimensions, TouchableOpacity, Image } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import io from "socket.io-client";
import { Ionicons } from "@expo/vector-icons";
import client from "../../api/client";
import { SafeAreaView } from "react-native-safe-area-context";

// Derive Socket URL from Client Base URL for flexibility
// Removes '/api' from the end of the baseURL to get the root server URL

const mapStyle = [
    {
        "elementType": "geometry",
        "stylers": [{ "color": "#f5f5f5" }]
    },
    {
        "elementType": "labels.icon",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#616161" }]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#f5f5f5" }]
    },
    {
        "featureType": "administrative.land_parcel",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#bdbdbd" }]
    },
    {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [{ "color": "#eeeeee" }]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#e5e5e5" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9e9e9e" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#ffffff" }]
    },
    {
        "featureType": "road.arterial",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{ "color": "#dadada" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#616161" }]
    },
    {
        "featureType": "road.local",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9e9e9e" }]
    },
    {
        "featureType": "transit.line",
        "elementType": "geometry",
        "stylers": [{ "color": "#e5e5e5" }]
    },
    {
        "featureType": "transit.station",
        "elementType": "geometry",
        "stylers": [{ "color": "#eeeeee" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#c9c9c9" }]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9e9e9e" }]
    }
];

import { useTrackingSocket } from "../../hooks/useTrackingSocket";
import MapComponent from "../../components/MapComponent";

const TrackMapScreen = ({ route, navigation }) => {
    const [busId, setBusId] = useState(route.params?.busId || null);
    const [busDetails, setBusDetails] = useState(null);
    const [busLocation, setBusLocation] = useState(null);
    const [speed, setSpeed] = useState(0);
    const [lastUpdated, setLastUpdated] = useState("");
    const [loading, setLoading] = useState(true);

    if (!busId && !route.params?.busId) {
        // We will try to fetchMyBus if no ID is passed
    }

    const { connectionStatus, onLocationUpdate, joinBus } = useTrackingSocket("PARENT");

    useEffect(() => {
        if (!busId) {
            fetchMyBus();
        } else {
            setLoading(false);
            fetchInitialLocation(busId);
        }
    }, [busId]);

    // JOIN BUS ROOM
    useEffect(() => {
        if (busId) {
            joinBus(busId);
        }
    }, [busId, connectionStatus]);

    // HANDLE INCOMING UPDATES
    useEffect(() => {
        const cleanup = onLocationUpdate((data) => {
            if (data && data.busId === busId && typeof data.lat === 'number' && typeof data.lng === 'number') {
                const newLoc = { latitude: data.lat, longitude: data.lng };
                setBusLocation(newLoc);
                setSpeed(data.speed || 0);
                setLastUpdated(new Date(data.time || Date.now()).toLocaleTimeString());
            }
        });
        return cleanup;
    }, [busId, onLocationUpdate]);

    const fetchMyBus = async () => {
        try {
            const res = await client.get("/parent/my-bus");
            if (res.data) {
                setBusId(res.data._id);
                setBusDetails(res.data);
                fetchInitialLocation(res.data._id);
            }
        } catch (err) {
            console.log("Error fetching my bus", err);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4c51bf" />
                <Text style={{ marginTop: 10, color: "#718096" }}>Locating school bus...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapComponent
                busLocation={busLocation}
                busDetails={busDetails}
                polyline={busDetails?.route?.polyline || ''}
                speed={speed}
                connectionStatus={connectionStatus}
                lastUpdated={lastUpdated}
            />

            {/* Floating Back Button */}
            <SafeAreaView style={styles.backBtnContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
            </SafeAreaView>

            {/* Bottom Info Card */}
            <View style={styles.bottomSheet}>
                <View style={styles.dragHandle} />
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.busTitle}>{busDetails ? busDetails.busNumber : "School Bus"}</Text>
                        <Text style={styles.statusText}>
                            {busLocation ? "● Tracking Live" : "● Searching for location..."}
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
                        <Text style={styles.driverName}>{busDetails?.driver?.name || "Driver"}</Text>
                        <Text style={styles.driverPhone}>{busDetails?.driver?.phone || "No phone available"}</Text>
                    </View>
                    <TouchableOpacity style={styles.callBtn}>
                        <Ionicons name="call" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
    markerContainer: {
        backgroundColor: "white",
        padding: 5,
        borderRadius: 20,
        elevation: 5,
        shadowColor: "black",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 }
    },
    busIcon: { width: 40, height: 40, resizeMode: "contain" },

    backBtnContainer: { position: "absolute", top: 10, left: 16 },
    backBtn: {
        backgroundColor: "white",
        padding: 10,
        borderRadius: 25,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },

    bottomSheet: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        backgroundColor: "white",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40, // Safe area
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: "#e2e8f0",
        borderRadius: 2.5,
        alignSelf: "center",
        marginBottom: 16,
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    busTitle: { fontSize: 20, fontWeight: "bold", color: "#2d3748" },
    statusText: { color: "#48bb78", fontWeight: "600", marginTop: 4 },
    ratingBox: { backgroundColor: "#48bb78", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    ratingText: { color: "white", fontWeight: "bold", fontSize: 12 },
    divider: { height: 1, backgroundColor: "#edf2f7", marginVertical: 16 },

    driverRow: { flexDirection: "row", alignItems: "center" },
    driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#cbd5e0", justifyContent: "center", alignItems: "center" },
    driverName: { fontSize: 16, fontWeight: "bold", color: "#2d3748" },
    driverPhone: { fontSize: 14, color: "#718096" },
    callBtn: {
        backgroundColor: "#4c51bf",
        padding: 12,
        borderRadius: 25,
        elevation: 2,
    },
});

export default TrackMapScreen;
