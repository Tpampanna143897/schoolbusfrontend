import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../api/adminApi';
import FormInput from '../../components/FormInput';

const AdminRoutes = () => {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form state
    const [routeName, setRouteName] = useState('');
    const [routeCode, setRouteCode] = useState('');
    const [stops, setStops] = useState('');
    const [polyline, setPolyline] = useState('');

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getRoutes();
            setRoutes(res.data?.data || []);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch routes');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoute = async () => {
        if (!routeName || !routeCode || !stops) {
            Alert.alert('Error', 'Please fill required fields (Name, Code, Stops)');
            return;
        }
        try {
            const stopsArray = stops.split(',').map((s, index) => ({
                name: s.trim(),
                lat: 0, // Placeholder, requires map picking in future
                lng: 0,
                order: index + 1
            }));
            await adminApi.createRoute({ routeName, routeCode, stops: stopsArray, polyline });
            Alert.alert('Success', 'Route created successfully');
            setModalVisible(false);
            resetForm();
            fetchRoutes();
        } catch (error) {
            Alert.alert('Error', 'Failed to create route: ' + error.message);
        }
    };

    const resetForm = () => {
        setRouteName('');
        setRouteCode('');
        setStops('');
        setPolyline('');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Routes</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {routes.map(route => (
                    <View key={route._id} style={styles.routeCard}>
                        <View style={styles.routeHeader}>
                            <Ionicons name="trail-sign" size={24} color="#4c51bf" />
                            <View style={{ marginLeft: 10 }}>
                                <Text style={styles.routeName}>{route.routeName || route.name}</Text>
                                <Text style={styles.routeCodeText}>Code: {route.routeCode || 'N/A'}</Text>
                            </View>
                        </View>
                        <Text style={styles.stopsLabel}>Stops:</Text>
                        <Text style={styles.stopsText}>
                            {route.stops?.map(s => typeof s === 'string' ? s : s.name).join(' → ')}
                        </Text>
                        {route.polyline ? (
                            <View style={styles.badge}>
                                <Ionicons name="map" size={12} color="#48bb78" />
                                <Text style={styles.badgeText}>Map Path Linked</Text>
                            </View>
                        ) : null}
                    </View>
                ))}
            </ScrollView>

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create Route</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#4a5568" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <FormInput label="Route Name" value={routeName} onChangeText={setRouteName} placeholder="e.g. Downtown Express" />
                            <FormInput label="Route Code" value={routeCode} onChangeText={setRouteCode} placeholder="e.g. RT-101" />
                            <FormInput
                                label="Stops (Comma separated)"
                                value={stops}
                                onChangeText={setStops}
                                placeholder="e.g. Stop 1, Stop 2, Stop 3"
                            />
                            <FormInput
                                label="Encoded Polyline (Optional)"
                                value={polyline}
                                onChangeText={setPolyline}
                                placeholder="Paste Google Map polyline string"
                            />

                            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateRoute}>
                                <Text style={styles.submitBtnText}>Create Route</Text>
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#2d3748' },
    addBtn: { backgroundColor: '#4c51bf', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16 },
    routeCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
    routeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    routeName: { fontSize: 18, fontWeight: 'bold', color: '#2d3748', marginLeft: 10 },
    stopsLabel: { fontSize: 12, fontWeight: '600', color: '#718096', marginTop: 4 },
    stopsText: { fontSize: 14, color: '#4a5568', marginTop: 2 },
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fff4', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 10 },
    badgeText: { fontSize: 10, color: '#2f855a', fontWeight: '700', marginLeft: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2d3748' },
    submitBtn: { backgroundColor: '#4c51bf', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 20 },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default AdminRoutes;
