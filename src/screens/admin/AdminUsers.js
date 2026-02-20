import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../api/adminApi';
import FormInput from '../../components/FormInput';
import Dropdown from '../../components/Dropdown';

const AdminUsers = () => {
    const [drivers, setDrivers] = useState([]);
    const [parents, setParents] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('DRIVER');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const [driversRes, parentsRes, staffRes] = await Promise.all([
                adminApi.getUsers('DRIVER'),
                adminApi.getUsers('PARENT'),
                adminApi.getUsers('STAFF')
            ]);
            setDrivers(driversRes.data?.data || []);
            setParents(parentsRes.data?.data || []);
            setStaff(staffRes.data?.data || []);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        try {
            await adminApi.createUser({ name, email, password, role });
            Alert.alert('Success', 'User created successfully');
            setModalVisible(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create user');
        }
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setRole('DRIVER');
    };

    const renderUser = ({ item }) => (
        <View style={styles.userCard}>
            <View style={styles.userIcon}>
                <Ionicons name="person" size={24} color="#4a5568" />
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            <View style={[
                styles.roleBadge,
                { backgroundColor: item.role === 'DRIVER' ? '#ebf8ff' : (item.role === 'STAFF' ? '#f0fff4' : '#faf5ff') }
            ]}>
                <Text style={[
                    styles.roleText,
                    { color: item.role === 'DRIVER' ? '#3182ce' : (item.role === 'STAFF' ? '#38a169' : '#805ad5') }
                ]}>
                    {item.role}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Users</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.sectionTitle}>Drivers ({drivers.length})</Text>
                {drivers.map(user => (
                    <View key={user._id}>{renderUser({ item: user })}</View>
                ))}

                <Text style={styles.sectionTitle}>Parents ({parents.length})</Text>
                {parents.map(user => (
                    <View key={user._id}>{renderUser({ item: user })}</View>
                ))}

                <Text style={styles.sectionTitle}>Staff ({staff.length})</Text>
                {staff.map(user => (
                    <View key={user._id}>{renderUser({ item: user })}</View>
                ))}
            </ScrollView>

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create User</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#4a5568" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <FormInput label="Name" value={name} onChangeText={setName} placeholder="Enter name" />
                            <FormInput label="Email" value={email} onChangeText={setEmail} placeholder="Enter email" keyboardType="email-address" />
                            <FormInput label="Password" value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry />
                            <Dropdown
                                label="Role"
                                selectedValue={role}
                                onValueChange={setRole}
                                items={[
                                    { id: 'DRIVER', label: 'Driver' },
                                    { id: 'PARENT', label: 'Parent' },
                                    { id: 'STAFF', label: 'Staff' }
                                ]}
                            />

                            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateUser}>
                                <Text style={styles.submitBtnText}>Create User</Text>
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
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4a5568', marginTop: 20, marginBottom: 12 },
    userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 10, elevation: 2 },
    userIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#edf2f7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: 'bold', color: '#2d3748' },
    userEmail: { fontSize: 14, color: '#718096' },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    roleText: { fontSize: 12, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2d3748' },
    submitBtn: { backgroundColor: '#4c51bf', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 20 },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default AdminUsers;
