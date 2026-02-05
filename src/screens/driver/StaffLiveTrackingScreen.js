import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { adminApi } from '../../api/adminApi';
import MapComponent from '../../components/MapComponent';
import { useTrackingSocket } from '../../hooks/useTrackingSocket';

const StaffLiveTrackingScreen = ({ route }) => {
    const { focusRoute } = route.params || {};
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    const { onLocationUpdate, joinAdmin, isConnected } = useTrackingSocket("STAFF_FLEET");

    useEffect(() => {
        fetchTrips();
        joinAdmin();
    }, [joinAdmin]);

    useEffect(() => {
        const cleanup = onLocationUpdate((data) => {
            setTrips(prev => prev.map(trip => {
                if (trip._id == data.tripId) {
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

    const fetchTrips = async () => {
        try {
            const res = await adminApi.getLiveTrips();
            setTrips(res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#4c51bf" />
            <Text style={styles.loaderText}>Loading Fleet Map...</Text>
        </View>
    );

    // Map all active trips to the "buses" format for the smooth multi-marker support
    const displayBuses = trips
        .filter(t => t.location && typeof t.location.lat === 'number')
        .map(t => ({
            id: t._id,
            location: { latitude: t.location.lat, longitude: t.location.lng },
            heading: t.location.heading || 0,
            busNumber: t.busId?.busNumber || "Bus"
        }));

    // If a focusRoute is provided, we prefer showing that trip primarily
    const activeTrip = focusRoute
        ? trips.find(t => (t.routeId?._id || t.routeId) === (focusRoute._id || focusRoute))
        : trips[0];

    return (
        <View style={styles.container}>
            <MapComponent
                buses={displayBuses}
                busLocation={activeTrip?.location ? { latitude: activeTrip.location.lat, longitude: activeTrip.location.lng } : null}
                busDetails={activeTrip?.busId}
                speed={activeTrip?.location?.speed || 0}
                routeStops={activeTrip?.routeId?.stops || []}
                connectionStatus={trips.length > 0 ? `Monitoring ${trips.length} Live Buses` : "Scanning for active trips..."}
            />
            {!activeTrip && trips.length > 0 && (
                <View style={styles.overlay}>
                    <Text style={styles.overlayText}>{trips.length} other buses are online</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7fafc' },
    loaderText: { marginTop: 15, color: '#4a5568', fontWeight: '500' },
    overlay: { position: 'absolute', bottom: 120, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.9)', padding: 12, borderRadius: 15, elevation: 4 },
    overlayText: { fontSize: 12, color: '#4c51bf', fontWeight: 'bold' }
});

export default StaffLiveTrackingScreen;
