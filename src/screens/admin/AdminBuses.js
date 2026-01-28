import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Switch } from 'react-native';
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

    // Form state
    const [busNumber, setBusNumber] = useState('');
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
            setBuses(busesRes.data || []);
            setRoutes(routesRes.data || []);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBus = async () => {
        if (!busNumber) {
            Alert.alert('Error', 'Bus number is required');
            return;
        }
        try {
            await adminApi.createBus({
                busNumber,
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

            <ScrollView style={styles.content}>
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
                            <View style={[styles.statusBadge, { backgroundColor: bus.status === 'ONLINE' ? '#f0fff4' : '#f7fafc' }]}>
                                <Text style={[styles.statusText, { color: bus.status === 'ONLINE' ? '#2f855a' : '#718096' }]}>
                                    {bus.status || 'OFFLINE'}
                                </Text>
                            </View>
                            <Text style={styles.activeLabel}>{bus.isActive ? 'Service Active' : 'Service Inactive'}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Ionicons name="map" size={16} color="#718096" />
                            <Text style={styles.detailText}>Default Route: {bus.defaultRoute?.name || 'Not Configured'}</Text>
                        </View>

                        {bus.activeTrip && (
                            <View style={styles.tripBadge}>
                                <Ionicons name="play-circle" size={16} color="#48bb78" />
                                <Text style={styles.tripText}>In Trip Session</Text>
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

                            <Dropdown
                                label="Default Route (Optional)"
                                selectedValue={defaultRouteId}
                                onValueChange={setDefaultRouteId}
                                placeholder="Select a fallback route"
                                items={routes.map(r => ({ id: r._id, label: r.name }))}
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
    activeLabel: { fontSize: 14, color: '#a0aec0', fontWeight: '500' },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    detailText: { fontSize: 14, color: '#4a5568', marginLeft: 10 },
    tripBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 15, padding: 10, backgroundColor: '#f0fff4', borderRadius: 12 },
    tripText: { fontSize: 14, color: '#2f855a', fontWeight: 'bold', marginLeft: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#2d3748' },
    submitBtn: { backgroundColor: '#4c51bf', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 20, marginBottom: 30, elevation: 4 },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});

export default AdminBuses;
