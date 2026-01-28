import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { parentApi } from '../../api/parentApi';

const ParentStudentDetails = ({ route, navigation }) => {
    const { student } = route.params;
    const [attendanceSummary, setAttendanceSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const res = await parentApi.getAttendance(student._id);
            const data = Array.isArray(res.data) ? res.data : [];
            // Simple summary logic: count pickup/drops
            const pickup = data.filter(a => a.status === 'PICKED_UP').length;
            const drop = data.filter(a => a.status === 'DROPPED_OFF').length;
            setAttendanceSummary({ pickup, drop, total: data.length });
        } catch (error) {
            console.log("Error fetching attendance summary:", error);
        } finally {
            setLoading(false);
        }
    };

    const InfoRow = ({ icon, label, value }) => (
        <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={20} color="#4c51bf" />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value || 'Not Assigned'}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerCard}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarTextLarge}>{student.name.charAt(0)}</Text>
                    </View>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentClass}>{student.class}</Text>
                </View>

                <View style={styles.detailsCard}>
                    <Text style={styles.cardTitle}>Student Information</Text>
                    <InfoRow icon="bus" label="Bus Number" value={student.assignedBus?.busNumber} />
                    <InfoRow icon="trail-sign" label="Route Name" value={student.assignedRoute?.name} />
                    <InfoRow icon="person" label="Parent" value={student.parent?.name} />
                </View>

                {student.assignedRoute?.stops && (
                    <View style={styles.detailsCard}>
                        <Text style={styles.cardTitle}>Route Stops</Text>
                        <Text style={styles.stopsText}>
                            {student.assignedRoute.stops.join(' → ')}
                        </Text>
                    </View>
                )}

                <View style={styles.detailsCard}>
                    <Text style={styles.cardTitle}>Attendance Summary</Text>
                    {loading ? (
                        <ActivityIndicator color="#4c51bf" />
                    ) : (
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{attendanceSummary?.pickup || 0}</Text>
                                <Text style={styles.statLabel}>Pickups</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{attendanceSummary?.drop || 0}</Text>
                                <Text style={styles.statLabel}>Drops</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{attendanceSummary?.total || 0}</Text>
                                <Text style={styles.statLabel}>Total Logs</Text>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            <TouchableOpacity
                style={[styles.trackBtn, !student.assignedBus && styles.disabledBtn]}
                onPress={() => navigation.navigate("ParentMap", {
                    tripId: student.activeTripId?._id || student.activeTripId,
                    bus: student.assignedBus
                })}
                disabled={!student.assignedBus}
            >
                <Ionicons name="location" size={24} color="white" />
                <Text style={styles.trackBtnText}>
                    {student.activeTripId ? "Track Live Journey" : (student.assignedBus ? "Locate Bus" : "No Bus Assigned")}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f8' },
    scrollContent: { padding: 20, paddingBottom: 100 },
    headerCard: { alignItems: 'center', backgroundColor: 'white', padding: 30, borderRadius: 24, marginBottom: 20, elevation: 4 },
    avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ebf8ff', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    avatarTextLarge: { fontSize: 32, fontWeight: 'bold', color: '#3182ce' },
    studentName: { fontSize: 24, fontWeight: 'bold', color: '#2d3748' },
    studentClass: { fontSize: 16, color: '#718096', marginTop: 4 },
    detailsCard: { backgroundColor: 'white', padding: 20, borderRadius: 20, marginBottom: 16, elevation: 2 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2d3748', marginBottom: 15 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f7fafc', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    textContainer: { flex: 1 },
    infoLabel: { fontSize: 12, color: '#a0aec0', textTransform: 'uppercase', fontWeight: 'bold' },
    infoValue: { fontSize: 16, color: '#4a5568', fontWeight: '500' },
    stopsText: { color: '#718096', lineHeight: 22 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 22, fontWeight: 'bold', color: '#4c51bf' },
    statLabel: { fontSize: 12, color: '#a0aec0', marginTop: 4 },
    trackBtn: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#4c51bf', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18, borderRadius: 16, elevation: 8 },
    disabledBtn: { backgroundColor: '#a0aec0' },
    trackBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18, marginLeft: 10 },
});

export default ParentStudentDetails;
