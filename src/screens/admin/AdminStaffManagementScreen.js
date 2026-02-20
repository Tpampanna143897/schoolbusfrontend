import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../api/adminApi';
import { Picker } from '@react-native-picker/picker';

const AdminStaffManagementScreen = () => {
    const [staff, setStaff] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRoute, setSelectedRoute] = useState('');
    const [selectedBus, setSelectedBus] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [staffRes, routeRes, busRes] = await Promise.all([
                adminApi.getUsers("STAFF"),
                adminApi.getRoutes(),
                adminApi.getBuses()
            ]);
            setStaff(staffRes.data?.data || []);
            setRoutes(routeRes.data?.data || []);
            setBuses(busRes.data?.data || []);
        } catch (error) {
            console.error("Fetch Error:", error);
            Alert.alert("Error", "Failed to fetch staff data");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name || !email || (!editingStaff && !password)) {
            Alert.alert("Error", "Please fill required fields");
            return;
        }

        const payload = {
            name,
            email,
            password,
            role: "STAFF",
            assignedRoute: selectedRoute || null,
            assignedBus: selectedBus || null
        };

        try {
            if (editingStaff) {
                await adminApi.updateUser(editingStaff._id, payload);
                Alert.alert("Success", "Staff updated successfuly");
            } else {
                await adminApi.createUser(payload);
                Alert.alert("Success", "Staff created successfully");
            }
            setModalVisible(false);
            resetForm();
            fetchData();
        } catch (error) {
            Alert.alert("Error", "Failed to save staff");
        }
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setSelectedRoute('');
        setSelectedBus('');
        setEditingStaff(null);
    };

    const openEdit = (item) => {
        setEditingStaff(item);
        setName(item.name);
        setEmail(item.email);
        setSelectedRoute(item.assignedRoute?._id || '');
        setSelectedBus(item.assignedBus?._id || '');
        setModalVisible(true);
    };

    const deleteStaff = (id) => {
        Alert.alert("Confirm", "Are you sure you want to delete this staff?", [
            { text: "Cancel" },
            {
                text: "Delete", style: 'destructive', onPress: async () => {
                    await adminApi.deleteUser(id);
                    fetchData();
                }
            }
        ]);
    };

    const renderStaffItem = ({ item }) => (
        <View style={styles.staffCard}>
            <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{item.name}</Text>
                <Text style={styles.staffEmail}>{item.email}</Text>
                <View style={styles.badgeRow}>
                    <View style={styles.routeBadge}>
                        <Text style={styles.badgeText}>{item.assignedRoute?.name || "No Route"}</Text>
                    </View>
                    {item.assignedBus && (
                        <View style={styles.busBadge}>
                            <Text style={styles.badgeText}>{item.assignedBus.busNumber}</Text>
                        </View>
                    )}
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(item)}>
                    <Ionicons name="pencil" size={20} color="#4c51bf" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteStaff(item._id)} style={{ marginLeft: 15 }}>
                    <Ionicons name="trash" size={20} color="#f56565" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Staff Management</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {loading ? <ActivityIndicator size="large" color="#4c51bf" style={styles.loader} /> : (
                <FlatList
                    data={staff}
                    keyExtractor={item => item._id}
                    renderItem={renderStaffItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No staff members found</Text>}
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingStaff ? "Edit Staff" : "Add New Staff"}</Text>

                        <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
                        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                        {!editingStaff && <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />}

                        <Text style={styles.label}>Assign Route</Text>
                        <View style={styles.pickerContainer}>
                            <Picker selectedValue={selectedRoute} onValueChange={setSelectedRoute}>
                                <Picker.Item label="Select Route" value="" />
                                {routes.map(r => <Picker.Item key={r._id} label={r.name} value={r._id} />)}
                            </Picker>
                        </View>

                        <Text style={styles.label}>Assign Bus (Optional)</Text>
                        <View style={styles.pickerContainer}>
                            <Picker selectedValue={selectedBus} onValueChange={setSelectedBus}>
                                <Picker.Item label="Select Bus" value="" />
                                {buses.map(b => <Picker.Item key={b._id} label={b.busNumber} value={b._id} />)}
                            </Picker>
                        </View>

                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Text style={styles.saveText}>Save Staff</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', elevation: 2 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#2d3748' },
    addBtn: { backgroundColor: '#4c51bf', padding: 8, borderRadius: 12 },
    list: { padding: 20 },
    staffCard: { backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    staffInfo: { flex: 1 },
    staffName: { fontSize: 16, fontWeight: 'bold', color: '#2d3748' },
    staffEmail: { fontSize: 14, color: '#718096', marginBottom: 8 },
    badgeRow: { flexDirection: 'row', gap: 8 },
    routeBadge: { backgroundColor: '#ebf8ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    busBadge: { backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: 'bold', color: '#3182ce' },
    actions: { flexDirection: 'row', alignItems: 'center' },
    loader: { marginTop: 50 },
    empty: { textAlign: 'center', color: '#718096', marginTop: 50 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, maxHeight: '80%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2d3748', marginBottom: 20 },
    input: { backgroundColor: '#f7fafc', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
    label: { fontSize: 14, fontWeight: 'bold', color: '#4a5568', marginBottom: 8 },
    pickerContainer: { backgroundColor: '#f7fafc', borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
    modalBtns: { flexDirection: 'row', gap: 15, marginTop: 10 },
    cancelBtn: { flex: 1, padding: 16, alignItems: 'center' },
    cancelText: { fontWeight: 'bold', color: '#718096' },
    saveBtn: { flex: 2, backgroundColor: '#4c51bf', padding: 16, borderRadius: 16, alignItems: 'center' },
    saveText: { color: 'white', fontWeight: 'bold' }
});

export default AdminStaffManagementScreen;
