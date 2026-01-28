import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CalendarComponent from '../../components/CalendarComponent';
import ParentTripHistoryModal from './ParentTripHistoryModal';
import { parentApi } from '../../api/parentApi';
import moment from 'moment';

const ParentCalendarScreen = ({ route }) => {
    const { studentId } = route.params;
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await parentApi.getAttendanceHistory(studentId);
            setHistory(res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDatePress = (date, data) => {
        if (data) {
            setSelectedTrip(data);
            setModalVisible(true);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Attendance History</Text>
                <Text style={styles.subtitle}>Select a marked date to see journey details</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4c51bf" />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <CalendarComponent
                        history={history}
                        onDatePress={handleDatePress}
                    />

                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Monthly Summary</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Text style={[styles.statValue, { color: '#48bb78' }]}>
                                    {history.filter(h => h.status === 'PICKED').length}
                                </Text>
                                <Text style={styles.statLabel}>Pickups</Text>
                            </View>
                            <View style={styles.stat}>
                                <Text style={[styles.statValue, { color: '#4299e1' }]}>
                                    {history.filter(h => h.status === 'DROPPED').length}
                                </Text>
                                <Text style={styles.statLabel}>Drops</Text>
                            </View>
                            <View style={styles.stat}>
                                <Text style={[styles.statValue, { color: '#f56565' }]}>
                                    {history.filter(h => h.status === 'ABSENT').length}
                                </Text>
                                <Text style={styles.statLabel}>Absent</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            <ParentTripHistoryModal
                visible={modalVisible}
                tripData={selectedTrip}
                onClose={() => setModalVisible(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    header: { padding: 20, backgroundColor: 'white' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1a365d' },
    subtitle: { fontSize: 13, color: '#718096', marginTop: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    summaryCard: { backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 24, elevation: 4 },
    summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#2d3748', marginBottom: 15 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    stat: { alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: 'bold' },
    statLabel: { fontSize: 10, color: '#a0aec0', marginTop: 4, fontWeight: 'bold', textTransform: 'uppercase' }
});

export default ParentCalendarScreen;
