import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../api/adminApi';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

const AdminTripHistoryScreen = ({ navigation }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Last 7 days
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const params = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            };
            const res = await adminApi.getTripHistory(params);
            setHistory(res.data || []);
        } catch (error) {
            Alert.alert("Error", "Failed to fetch trip history");
        } finally {
            setLoading(false);
        }
    };

    const renderTripItem = ({ item }) => (
        <TouchableOpacity
            style={styles.tripCard}
            onPress={() => navigation.navigate("AdminMap", { trip: item, isHistory: true })}
        >
            <View style={styles.tripHeader}>
                <View style={styles.busInfo}>
                    <Ionicons name="bus" size={20} color="#4c51bf" />
                    <Text style={styles.busNumber}>{item.busId?.busNumber || "N/A"}</Text>
                </View>
                <Text style={styles.tripDate}>{moment(item.startedAt).format("MMM DD, YYYY")}</Text>
            </View>

            <View style={styles.tripDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="person" size={14} color="#718096" />
                    <Text style={styles.detailText}>Driver: {item.driverId?.name || "N/A"}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="trail-sign" size={14} color="#718096" />
                    <Text style={styles.detailText}>Route: {item.routeId?.name || "N/A"}</Text>
                </View>
                <View style={styles.timeContainer}>
                    <View style={styles.timeBox}>
                        <Text style={styles.timeLabel}>START</Text>
                        <Text style={styles.timeValue}>{moment(item.startedAt).format("hh:mm A")}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color="#cbd5e0" />
                    <View style={styles.timeBox}>
                        <Text style={styles.timeLabel}>END</Text>
                        <Text style={styles.timeValue}>{item.endedAt ? moment(item.endedAt).format("hh:mm A") : "Ongoing"}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Trip History</Text>
                <TouchableOpacity onPress={fetchHistory} style={styles.refreshBtn}>
                    <Ionicons name="refresh" size={24} color="#4c51bf" />
                </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
                <View style={styles.dateRow}>
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
                        <Text style={styles.dateLabel}>From</Text>
                        <Text style={styles.dateValue}>{moment(startDate).format("DD/MM/YYYY")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
                        <Text style={styles.dateLabel}>To</Text>
                        <Text style={styles.dateValue}>{moment(endDate).format("DD/MM/YYYY")}</Text>
                    </TouchableOpacity>
                </View>

                {showStartPicker && (
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                            setShowStartPicker(false);
                            if (date) setStartDate(date);
                        }}
                    />
                )}
                {showEndPicker && (
                    <DateTimePicker
                        value={endDate}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                            setShowEndPicker(false);
                            if (date) setEndDate(date);
                        }}
                    />
                )}
            </View>

            {loading ? <ActivityIndicator size="large" color="#4c51bf" style={styles.loader} /> : (
                <FlatList
                    data={history}
                    keyExtractor={item => item._id}
                    renderItem={renderTripItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No trip history found for selected dates</Text>}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', elevation: 2 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#2d3748' },
    refreshBtn: { padding: 5 },
    filterSection: { padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    dateRow: { flexDirection: 'row', gap: 10 },
    dateBtn: { flex: 1, backgroundColor: '#f7fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    dateLabel: { fontSize: 10, color: '#a0aec0', fontWeight: 'bold', marginBottom: 2 },
    dateValue: { fontSize: 14, color: '#2d3748', fontWeight: '500' },
    list: { padding: 15 },
    tripCard: { backgroundColor: 'white', borderRadius: 20, padding: 15, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    busInfo: { flexDirection: 'row', alignItems: 'center' },
    busNumber: { fontSize: 16, fontWeight: 'bold', color: '#2d3748', marginLeft: 8 },
    tripDate: { fontSize: 12, color: '#718096' },
    tripDetails: { gap: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailText: { fontSize: 13, color: '#4a5568' },
    timeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#f8fafc', padding: 10, borderRadius: 12, marginTop: 5 },
    timeBox: { alignItems: 'center' },
    timeLabel: { fontSize: 8, color: '#cbd5e0', fontWeight: 'bold' },
    timeValue: { fontSize: 14, fontWeight: 'bold', color: '#2d3748' },
    loader: { marginTop: 50 },
    empty: { textAlign: 'center', color: '#718096', marginTop: 50 },
});

export default AdminTripHistoryScreen;
