import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Switch, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../api/adminApi';
import FormInput from '../../components/FormInput';
import Dropdown from '../../components/Dropdown';

const AdminBuses = () => {
    const [buses, setBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Form state
    const [busNumber, setBusNumber] = useState('');
    const [vin, setVin] = useState('');
    const [capacity, setCapacity] = useState('');
    const [defaultRouteId, setDefaultRouteId] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [busesRes, routesRes] = await Promise.all([
                adminApi.getBuses(),
                adminApi.getRoutes(),
            ]);
            setBuses(busesRes.data?.data || []);
            setRoutes(routesRes.data?.data || []);
        } catch (error) {
            console.error("Fetch Data Error:", error);
            Alert.alert('Error', 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchInitialData();
        setRefreshing(false);
    }, []);

    const handleResetBus = (busId) => {
        Alert.alert(
            "Reset Bus?",
            "This will clear the active trip and driver for this bus. Use this only if a session is stuck.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await adminApi.resetBus(busId);
                            Alert.alert("Success", "Bus reset successfully");
                            fetchInitialData();
                        } catch (error) {
                            Alert.alert("Error", "Failed to reset bus");
                        }
                    }
                }
            ]
        );
    };

    const handleCreateBus = async () => {
        if (!busNumber) {
            Alert.alert('Error', 'Bus number is required');
            return;
        }
        try {
            await adminApi.createBus({
                busNumber,
                vin,
                capacity: parseInt(capacity),
                defaultRoute: defaultRouteId || null,
                isActive: true
            });
            Alert.alert('Success', 'Bus created successfully');
            setModalVisible(false);
            resetForm();
            fetchInitialData();
        } catch (error) {
            Alert.alert('Error', 'Failed to create bus');
        }
    };

    const toggleBusStatus = async (busId, currentStatus) => {
        try {
            await adminApi.updateBusStatus(busId, !currentStatus);
            fetchInitialData();
        } catch (error) {
            Alert.alert('Error', 'Failed to update bus status');
        }
    };

    const resetForm = () => {
        setBusNumber('');
        setVin('');
        setCapacity('');
        setDefaultRouteId('');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Buses</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {buses.map(bus => (
                    <View key={bus._id} style={styles.busCard}>
                        <View style={styles.busHeader}>
                            <Ionicons name="bus" size={24} color="#4c51bf" />
                            <Text style={styles.busNumberText}>{bus.busNumber}</Text>
                            <Switch
                                value={bus.isActive}
                                onValueChange={() => toggleBusStatus(bus._id, bus.isActive)}
                                trackColor={{ false: "#cbd5e0", true: "#4c51bf" }}
                            />
                        </View>

                        <View style={styles.statusRow}>
                            <View style={[styles.statusBadge, { backgroundColor: bus.status === 'ONLINE' ? '#c6f6d5' : '#edf2f7' }]}>
                                <Text style={[styles.statusText, { color: bus.status === 'ONLINE' ? '#22543d' : '#4a5568' }]}>
                                    {bus.status || 'OFFLINE'}
                                </Text>
                            </View>
                            <View style={[styles.activeIndicator, { backgroundColor: bus.isActive ? '#ebf8ff' : '#fff5f5' }]}>
                                <Text style={[styles.activeLabel, { color: bus.isActive ? '#2b6cb0' : '#c53030' }]}>
                                    {bus.isActive ? 'Fleet Enabled' : 'Fleet Disabled'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <Ionicons name="map" size={16} color="#718096" />
                            <Text style={styles.detailText}>Default Route: {bus.defaultRoute?.routeName || bus.defaultRoute?.name || 'Not Configured'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>VIN: <Text style={styles.infoValue}>{bus.vin || 'N/A'}</Text></Text>
                            <Text style={styles.infoLabel}>Cap: <Text style={styles.infoValue}>{bus.capacity || 'N/A'}</Text></Text>
                        </View>

                        {bus.activeTrip && (
                            <View style={styles.sessionCard}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <View style={styles.tripBadge}>
                                            <Ionicons name="play-circle" size={16} color="#48bb78" />
                                            <Text style={styles.tripText}>In Active Journey</Text>
                                        </View>
                                        <Text style={styles.sessionDriver}>By: {bus.activeDriverId?.name || "Driver"}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.resetBtn}
                                        onPress={() => handleResetBus(bus._id)}
                                    >
                                        <Ionicons name="close-circle" size={20} color="#f56565" />
                                        <Text style={styles.resetBtnText}>Stop Ride</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create New Bus</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#4a5568" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <FormInput label="Bus Number" value={busNumber} onChangeText={setBusNumber} placeholder="e.g. S-BUS-012" />
                            <FormInput label="VIN" value={vin} onChangeText={setVin} placeholder="Vehicle Identification Number" />
                            <FormInput label="Capacity" value={capacity} onChangeText={setCapacity} placeholder="e.g. 40" keyboardType="numeric" />

                            <Dropdown
                                label="Default Route (Optional)"
                                selectedValue={defaultRouteId}
                                onValueChange={setDefaultRouteId}
                                placeholder="Select a fallback route"
                                items={routes.map(r => ({ id: r._id, label: r.routeName || r.name }))}
                            />

                            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateBus}>
                                <Text style={styles.submitBtnText}>Register Bus</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', elevation: 2 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#2d3748' },
    addBtn: { backgroundColor: '#4c51bf', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    content: { padding: 16 },
    busCard: { backgroundColor: 'white', padding: 20, borderRadius: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    busHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    busNumberText: { fontSize: 20, fontWeight: 'bold', color: '#2d3748', marginLeft: 12, flex: 1 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    activeIndicator: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    activeLabel: { fontSize: 12, fontWeight: '700' },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    detailText: { fontSize: 14, color: '#4a5568', marginLeft: 10 },
    sessionCard: { marginTop: 15, padding: 15, backgroundColor: '#f0fff4', borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#48bb78' },
    tripBadge: { flexDirection: 'row', alignItems: 'center' },
    tripText: { fontSize: 14, color: '#2f855a', fontWeight: 'bold', marginLeft: 8 },
    sessionDriver: { fontSize: 12, color: '#718096', marginTop: 4, marginLeft: 24 },
    resetBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff5f5', borderRadius: 12, borderWidth: 1, borderColor: '#feb2b2' },
    resetBtnText: { fontSize: 13, color: '#e53e3e', fontWeight: 'bold', marginLeft: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#2d3748' },
    submitBtn: { backgroundColor: '#4c51bf', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 20, marginBottom: 30, elevation: 4 },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});

export default AdminBuses;
