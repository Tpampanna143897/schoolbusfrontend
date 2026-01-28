import React, { useContext, useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, AppState } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../context/AuthContext";
import client from "../../api/client";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import MapComponent from "../../components/MapComponent";
import { useTrackingSocket } from "../../hooks/useTrackingSocket";

const DriverMapScreen = ({ route, navigation }) => {
    const { bus, tripId } = route.params;
    const [isTripActive, setIsTripActive] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [speed, setSpeed] = useState(0);
    const [heading, setHeading] = useState(0);
    const { user } = useContext(AuthContext);
    const { connectionStatus, emitLocation } = useTrackingSocket("DRIVER");
    const [lastUpdated, setLastUpdated] = useState("");
    const lastEmitRef = useRef(0);

    const locationSubscription = useRef(null);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        if (!tripId) {
            Alert.alert("Error", "Missing Trip Session. Please restart trip.");
            navigation.goBack();
            return;
        }

        startLocationTracking();

        const subscription = AppState.addEventListener("change", handleAppStateChange);

        return () => {
            stopTracking();
            subscription.remove();
        };
    }, []);

    const handleAppStateChange = (nextAppState) => {
        if (appState.current.match(/inactive|background/) && nextAppState === "active") {
            console.log("App has come to the foreground, restarting tracker...");
            startLocationTracking();
        }
        appState.current = nextAppState;
    };

    const stopTracking = () => {
        if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }
    };

    const startLocationTracking = async () => {
        try {
            const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
            if (fgStatus !== 'granted') {
                Alert.alert("Permission Required", "GPS permission is needed for live tracking.");
                return;
            }

            // Immediately get current position to center map
            const initialPos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            if (initialPos && initialPos.coords) {
                const { latitude, longitude, speed: speedMs, heading: course } = initialPos.coords;
                const newLoc = { latitude, longitude };
                setCurrentLocation(newLoc);
                const speedKmh = Math.max(0, Math.round((speedMs || 0) * 3.6));
                setSpeed(speedKmh);
                setHeading(course || 0);

                // Send initial update so parents see location immediately
                sendLocationUpdate(newLoc, speedKmh, course);
            }

            stopTracking();
            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 4000,
                    distanceInterval: 10,
                },
                (loc) => {
                    if (loc && loc.coords) {
                        const { latitude, longitude, speed: speedMs, heading: course } = loc.coords;
                        const newLoc = { latitude, longitude };
                        setCurrentLocation(newLoc);

                        const speedKmh = Math.max(0, Math.round((speedMs || 0) * 3.6));
                        setSpeed(speedKmh);
                        setHeading(course || 0);
                        setLastUpdated(new Date().toLocaleTimeString());

                        sendLocationUpdate(newLoc, speedKmh, course);
                    }
                }
            );
        } catch (err) {
            console.log("Tracking error", err);
            Alert.alert("GPS Error", "Failed to start live tracking.");
        }
    };

    const sendLocationUpdate = async (coords, speedKmh, course, retryCount = 0) => {
        if (!tripId || !coords.latitude || !coords.longitude || isPaused) return;

        // Defensive checks for bus and user
        const busId = bus?._id || bus?.id;
        const driverId = user?._id || user?.id;

        if (!busId || !driverId) {
            console.warn("[TRACKING] Missing Bus ID or Driver ID. Update skipped.", { busId, driverId });
            return;
        }

        const now = Date.now();
        if (now - lastEmitRef.current < 5000 && retryCount === 0) {
            return;
        }
        lastEmitRef.current = now;

        const payload = {
            tripId,
            busId,
            driverId,
            lat: coords.latitude,
            lng: coords.longitude,
            speed: speedKmh,
            heading: course || 0
        };

        try {
            // 1. WebSocket Emit
            emitLocation(payload);

            // 2. REST API Sync
            await client.post('/tracking/update', payload);

        } catch (err) {
            console.log(`Failed to sync location (Attempt ${retryCount + 1}):`, err.message);
            if (retryCount < 2) {
                setTimeout(() => {
                    sendLocationUpdate(coords, speedKmh, course, retryCount + 1);
                }, 2000);
            }
        }
    };

    const handlePause = async () => {
        try {
            setConnectionStatus("Pausing...");
            await client.post('/driver/stop-trip', { tripId });
            setIsPaused(true);
            setConnectionStatus("Paused ⏸");
        } catch (err) {
            Alert.alert("Error", "Failed to pause trip.");
        }
    };

    const handleResume = async () => {
        try {
            setConnectionStatus("Resuming...");
            await client.post('/driver/resume-trip', { tripId });
            setIsPaused(false);
            setConnectionStatus("Live ✔");
        } catch (err) {
            Alert.alert("Error", "Failed to resume trip.");
        }
    };

    const stopTrip = () => {
        Alert.alert("End Trip?", "This will stop sharing your location.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "End Trip", style: "destructive", onPress: async () => {
                    try {
                        await client.post('/driver/end-trip', { tripId });
                        stopTracking();
                        navigation.navigate("Main");
                    } catch (err) {
                        Alert.alert("Error", "Failed to end trip properly.");
                    }
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            <MapComponent
                busLocation={currentLocation}
                busDetails={bus}
                polyline={bus?.route?.polyline || ''}
                speed={speed}
                heading={heading}
                isDriver={true}
                connectionStatus={isPaused ? "Paused ⏸" : connectionStatus}
                lastUpdated={lastUpdated}
            />

            <SafeAreaView style={styles.topOverlay} edges={['top']}>
                <View style={[styles.routeCard, isPaused && styles.pausedCard]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.statusDot, { backgroundColor: isPaused ? '#cbd5e0' : '#48bb78' }]} />
                            <Text style={styles.routeText}>{bus?.busNumber || "Route #---"}</Text>
                        </View>
                        <View style={[styles.liveBadge, isPaused && styles.pausedBadge]}>
                            <Text style={styles.liveText}>{isPaused ? "PAUSED" : "LIVE"}</Text>
                        </View>
                    </View>
                    <Text style={styles.stopText}>{bus?.route?.name || "Tracking Active"}</Text>
                </View>
            </SafeAreaView>

            <View style={styles.bottomControls}>
                <View style={styles.actionRow}>
                    {!isPaused ? (
                        <TouchableOpacity style={[styles.controlBtn, styles.pauseBtn]} onPress={handlePause}>
                            <Ionicons name="pause" size={20} color="white" />
                            <Text style={styles.btnText}>Pause</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={[styles.controlBtn, styles.resumeBtn]} onPress={handleResume}>
                            <Ionicons name="play" size={20} color="white" />
                            <Text style={styles.btnText}>Resume</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={[styles.controlBtn, styles.endBtn]} onPress={stopTrip}>
                        <Ionicons name="stop" size={20} color="white" />
                        <Text style={styles.btnText}>End Trip</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.nextStopCard}>
                    <View style={styles.stopCircle}>
                        <Ionicons name="bus" size={20} color="white" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.stopAddress}>{bus?.busNumber} En Route</Text>
                        <View style={styles.badge}><Text style={styles.badgeText}>{isPaused ? "Journey Paused" : "Active"}</Text></View>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#1a202c" },
    topOverlay: { position: 'absolute', top: 0, width: '100%', alignItems: 'center', padding: 10 },
    routeCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, width: '95%', elevation: 4 },
    statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
    routeText: { fontSize: 16, fontWeight: 'bold', color: '#2d3748' },
    stopText: { marginTop: 4, color: '#718096' },
    bottomControls: { position: 'absolute', bottom: 0, width: '100%', padding: 20, paddingBottom: 40, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 15, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: -5 } },
    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    controlBtn: { flex: 1, flexDirection: 'row', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2 },
    pauseBtn: { backgroundColor: '#f6ad55' },
    resumeBtn: { backgroundColor: '#48bb78' },
    endBtn: { backgroundColor: '#f56565' },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    pausedCard: { borderColor: '#e2e8f0', borderWidth: 1 },
    pausedBadge: { backgroundColor: '#cbd5e0' },
    nextStopCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7fafc', padding: 15, borderRadius: 18, borderWidth: 1, borderColor: '#edf2f7' },
    stopCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4299e1', justifyContent: 'center', alignItems: 'center' },
    stopAddress: { fontSize: 17, fontWeight: 'bold', color: '#2d3748' },
    badge: { backgroundColor: '#ebf8ff', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
    badgeText: { fontSize: 12, color: '#3182ce', fontWeight: 'bold' },
    liveBadge: { backgroundColor: '#fed7d7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    liveText: { color: '#e53e3e', fontSize: 12, fontWeight: '800' },
});

export default DriverMapScreen;
