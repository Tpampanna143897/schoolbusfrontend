import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../api/adminApi';

const AdminLiveTripsScreen = ({ navigation }) => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchTrips();
        const interval = setInterval(fetchTrips, 15000); // Polling every 15s
        return () => clearInterval(interval);
    }, []);

    const fetchTrips = async () => {
        try {
            const res = await adminApi.getLiveTrips();
            setTrips(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.log("Error fetching live trips:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const renderTripItem = ({ item }) => (
        <TouchableOpacity
            style={styles.tripCard}
            onPress={() => navigation.navigate("AdminMap", { trip: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.busInfo}>
                    <View style={styles.iconBox}>
                        <Ionicons name="bus" size={24} color="#4c51bf" />
                    </View>
                    <View>
                        <Text style={styles.busNumber}>{item.busId?.busNumber || "Unknown Bus"}</Text>
                        <Text style={styles.routeName}>{item.routeId?.name || "Unassigned Route"}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'STOPPED' ? '#feebc8' : '#c6f6d5' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'STOPPED' ? '#c05621' : '#2f855a' }]}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardDetail}>
                <Ionicons name="person-outline" size={16} color="#718096" />
                <Text style={styles.detailText}>{item.driverId?.name || "No Driver"}</Text>

                {item.location?.speed !== undefined && (
                    <>
                        <Ionicons name="speedometer-outline" size={16} color="#48bb78" style={{ marginLeft: 15 }} />
                        <Text style={[styles.detailText, { color: '#48bb78', fontWeight: 'bold' }]}>{item.location.speed} km/h</Text>
                    </>
                )}

                <Ionicons name="time-outline" size={16} color="#718096" style={{ marginLeft: 15 }} />
                <Text style={styles.detailText}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4c51bf" />
                <Text style={styles.loadingText}>Fetching live journeys...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Text style={styles.title}>Live Journeys</Text>
                        <Text style={styles.subtitle}>{trips.length} active buses online</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.mapActionBtn}
                        onPress={() => navigation.navigate("AdminAllBusesMap")}
                    >
                        <Ionicons name="map" size={20} color="white" />
                        <Text style={styles.mapActionText}>View Map</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={trips}
                keyExtractor={item => item._id}
                renderItem={renderTripItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTrips(); }} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="map-outline" size={60} color="#cbd5e0" />
                        <Text style={styles.emptyText}>No live journeys found.</Text>
                        <Text style={styles.emptySubtext}>Active trips will appear here automatically.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    header: { padding: 24, backgroundColor: 'white', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 4 },
    title: { fontSize: 26, fontWeight: 'bold', color: '#1a365d' },
    subtitle: { fontSize: 14, color: '#718096', marginTop: 4 },
    listContent: { padding: 20 },
    tripCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    busInfo: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#ebf8ff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    busNumber: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
    routeName: { fontSize: 14, color: '#718096', marginTop: 2 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: '800' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 15 },
    cardDetail: { flexDirection: 'row', alignItems: 'center' },
    detailText: { fontSize: 14, color: '#4a5568', marginLeft: 6 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, color: '#718096', fontSize: 16 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 18, fontWeight: 'bold', color: '#a0aec0', marginTop: 20 },
    emptySubtext: { color: '#cbd5e0', marginTop: 8 },
    mapActionBtn: {
        backgroundColor: '#4c51bf',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#4c51bf',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 3 }
    },
    mapActionText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14
    }
});

export default AdminLiveTripsScreen;
