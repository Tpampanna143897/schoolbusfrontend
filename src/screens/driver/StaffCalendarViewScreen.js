import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminApi } from '../../api/adminApi';
import moment from 'moment';

const StaffCalendarViewScreen = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecentAttendance();
    }, []);

    const fetchRecentAttendance = async () => {
        try {
            const res = await adminApi.getStudents();
            setAttendance(res.data?.map(s => ({
                id: s._id,
                student: s.name,
                class: s.class,
                status: s.activeTripId ? "EN ROUTE" : "COMMUTED",
                time: moment().format("hh:mm A")
            })) || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.logCard}>
            <View style={styles.logInfo}>
                <Text style={styles.studentName}>{item.student}</Text>
                <Text style={styles.classInfo}>Class: {item.class}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'EN ROUTE' ? '#ebf8ff' : '#f0fff4' }]}>
                <Text style={[styles.statusText, { color: item.status === 'EN ROUTE' ? '#3182ce' : '#38a169' }]}>
                    {item.status}
                </Text>
            </View>
            <Text style={styles.timeText}>{item.time}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Attendance Feed</Text>
                <Text style={styles.subtitle}>{moment().format("dddd, MMM DD")}</Text>
            </View>

            {loading ? <ActivityIndicator color="#4c51bf" size="large" style={{ marginTop: 50 }} /> : (
                <FlatList
                    data={attendance}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={<Text style={styles.empty}>No attendance logs found</Text>}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#2d3748' },
    subtitle: { fontSize: 14, color: '#718096', marginTop: 4 },
    logCard: { backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    logInfo: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: 'bold', color: '#2d3748' },
    classInfo: { fontSize: 12, color: '#718096', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 15 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    timeText: { fontSize: 12, color: '#a0aec0', fontWeight: 'bold' },
    empty: { textAlign: 'center', marginTop: 50, color: '#a0aec0' }
});

export default StaffCalendarViewScreen;
