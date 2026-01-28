import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../api/adminApi';
import { AuthContext } from '../../context/AuthContext';

const StaffDashboardScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({ activeTrips: 0, totalStudents: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [tripsRes, studentsRes] = await Promise.all([
                adminApi.getLiveTrips(),
                adminApi.getStudents()
            ]);
            setStats({
                activeTrips: tripsRes.data?.length || 0,
                totalStudents: studentsRes.data?.length || 0
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const QuickAction = ({ icon, label, color, onPress }) => (
        <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} />}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.welcomeSection}>
                    <View>
                        <Text style={styles.welcomeText}>Hello, {user?.name}</Text>
                        <Text style={styles.roleText}>Staff Member • {user?.assignedRoute?.name || "Global"}</Text>
                    </View>
                    <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate("Profile")}>
                        <Ionicons name="person-circle" size={40} color="#4c51bf" />
                    </TouchableOpacity>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.activeTrips}</Text>
                        <Text style={styles.statLabel}>Active Trips</Text>
                        <View style={styles.indicator} />
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.totalStudents}</Text>
                        <Text style={styles.statLabel}>Students</Text>
                        <View style={[styles.indicator, { backgroundColor: '#3182ce' }]} />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Main Navigation</Text>
                <View style={styles.actionsGrid}>
                    <QuickAction
                        icon="map"
                        label="Live Tracking"
                        color="#4c51bf"
                        onPress={() => navigation.navigate("StaffLiveTracking")}
                    />
                    <QuickAction
                        icon="calendar"
                        label="Attendance History"
                        color="#38a169"
                        onPress={() => navigation.navigate("StaffCalendarView")}
                    />
                    <QuickAction
                        icon="people"
                        label="Student List"
                        color="#d69e2e"
                        onPress={() => navigation.navigate("AdminStudents")} // Reusing admin screen for read-only via role check
                    />
                    <QuickAction
                        icon="notifications"
                        label="Broadcasts"
                        color="#e53e3e"
                        onPress={() => Alert.alert("Coming Soon", "Notification broadcast feature is under development")}
                    />
                </View>

                {user?.assignedRoute && (
                    <View style={styles.routeCard}>
                        <View style={styles.routeHeader}>
                            <Ionicons name="trail-sign" size={24} color="white" />
                            <Text style={styles.routeTitle}>Assigned Priority</Text>
                        </View>
                        <Text style={styles.routeName}>{user.assignedRoute.name}</Text>
                        <Text style={styles.routeStops}>
                            {user.assignedBus?.busNumber ? `Bus: ${user.assignedBus.busNumber} • ` : ''}
                            {user.assignedRoute.stops?.length || 0} Scheduled Stops
                        </Text>
                        <TouchableOpacity
                            style={styles.viewMapBtn}
                            onPress={() => navigation.navigate("Bus", { screen: "StaffLiveTracking", params: { focusRoute: user.assignedRoute } })}
                        >
                            <Text style={styles.viewMapText}>View Priority Map</Text>
                            <Ionicons name="chevron-forward" size={16} color="#4c51bf" />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    scrollContent: { padding: 20 },
    welcomeSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#1a365d' },
    roleText: { fontSize: 14, color: '#718096' },
    statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    statCard: { flex: 1, backgroundColor: 'white', padding: 20, borderRadius: 20, elevation: 3, position: 'relative', overflow: 'hidden' },
    statValue: { fontSize: 28, fontWeight: 'bold', color: '#2d3748' },
    statLabel: { fontSize: 12, color: '#a0aec0', fontWeight: 'bold' },
    indicator: { position: 'absolute', right: -10, top: 0, bottom: 0, width: 20, backgroundColor: '#48bb78' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2d3748', marginBottom: 15 },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
    actionBtn: { width: '47%', backgroundColor: 'white', padding: 20, borderRadius: 20, alignItems: 'center', elevation: 2 },
    iconBox: { padding: 12, borderRadius: 15, marginBottom: 10 },
    actionLabel: { fontSize: 14, fontWeight: 'bold', color: '#4a5568' },
    routeCard: { backgroundColor: '#4c51bf', borderRadius: 24, padding: 20, marginTop: 25, elevation: 5 },
    routeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    routeTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', textTransform: 'uppercase' },
    routeName: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 5 },
    routeStops: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 20 },
    viewMapBtn: { backgroundColor: 'white', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    viewMapText: { color: '#4c51bf', fontWeight: 'bold' }
});

export default StaffDashboardScreen;
