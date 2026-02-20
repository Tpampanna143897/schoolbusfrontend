import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../api/adminApi';
import FormInput from '../../components/FormInput';
import Dropdown from '../../components/Dropdown';

const AdminStudents = () => {
    const [students, setStudents] = useState([]);
    const [parents, setParents] = useState([]);
    const [schools, setSchools] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [reassignModalVisible, setReassignModalVisible] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [schoolId, setSchoolId] = useState('');
    const [parentId, setParentId] = useState('');
    const [assignedRouteId, setAssignedRouteId] = useState('');
    const [assignedBusId, setAssignedBusId] = useState('');

    // Reassign state
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [newRouteId, setNewRouteId] = useState('');
    const [newBusId, setNewBusId] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [studentsRes, parentsRes, schoolsRes, routesRes, busesRes] = await Promise.all([
                adminApi.getStudents(),
                adminApi.getUsers('PARENT'),
                adminApi.getSchools(),
                adminApi.getRoutes(),
                adminApi.getBuses()
            ]);
            setStudents(studentsRes.data?.data || []);
            setParents(parentsRes.data?.data || []);
            setSchools(schoolsRes.data?.data || []);
            setRoutes(routesRes.data?.data || []);
            setBuses(busesRes.data?.data || []);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStudent = async () => {
        if (!name || !studentClass || !parentId || !assignedRouteId) {
            Alert.alert('Error', 'Missing required fields');
            return;
        }
        try {
            await adminApi.createStudent({
                name,
                class: studentClass,
                schoolId: schoolId || null,
                parent: parentId,
                assignedRoute: assignedRouteId || null,
                assignedBus: assignedBusId || null
            });
            Alert.alert('Success', 'Student enrolled successfully');
            setModalVisible(false);
            resetForm();
            fetchInitialData();
        } catch (error) {
            Alert.alert('Error', 'Enrollment failed');
        }
    };

    const openReassignModal = (student) => {
        setSelectedStudent(student);
        setNewRouteId(student.assignedRoute?._id || '');
        setNewBusId(student.assignedBus?._id || '');
        setReassignModalVisible(true);
    };

    const handleReassign = async () => {
        try {
            await adminApi.updateStudent(selectedStudent._id, {
                assignedRoute: newRouteId || null,
                assignedBus: newBusId || null
            });
            Alert.alert('Success', 'Student assignments updated');
            setReassignModalVisible(false);
            fetchInitialData();
        } catch (error) {
            Alert.alert('Error', 'Update failed');
        }
    };

    const resetForm = () => {
        setName('');
        setStudentClass('');
        setSchoolId('');
        setParentId('');
        setAssignedRouteId('');
        setAssignedBusId('');
    };

    if (loading) return (
        <View style={styles.center}><ActivityIndicator size="large" color="#4c51bf" /></View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Student List</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="person-add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {students.map(student => (
                    <View key={student._id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarTxt}>{student.name.charAt(0)}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 15 }}>
                                <Text style={styles.studentName}>{student.name}</Text>
                                <Text style={styles.studentClass}>{student.class}</Text>
                            </View>
                            <TouchableOpacity onPress={() => openReassignModal(student)} style={styles.editBtn}>
                                <Ionicons name="options-outline" size={20} color="#4c51bf" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.detailsRow}>
                            <View style={styles.detail}>
                                <Text style={styles.label}>Route</Text>
                                <Text style={styles.value}>{student.assignedRoute?.routeName || student.assignedRoute?.name || 'Unassigned'}</Text>
                            </View>
                            <View style={styles.detail}>
                                <Text style={styles.label}>Bus</Text>
                                <Text style={styles.value}>{student.assignedBus?.busNumber || 'Unassigned'}</Text>
                            </View>
                        </View>

                        {student.activeTripId && (
                            <View style={styles.liveBadge}>
                                <View style={styles.dot} />
                                <Text style={styles.liveTxt}>Currently in Transit</Text>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>

            {/* Create Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Enroll Student</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#a0aec0" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <FormInput label="Full Name" value={name} onChangeText={setName} />
                            <FormInput label="Grade/Class" value={studentClass} onChangeText={setStudentClass} />
                            <Dropdown
                                label="School"
                                selectedValue={schoolId}
                                onValueChange={setSchoolId}
                                items={schools.map(s => ({ id: s._id, label: s.name }))}
                                placeholder="Select School"
                            />
                            <Dropdown
                                label="Parent"
                                selectedValue={parentId}
                                onValueChange={setParentId}
                                items={parents.map(p => ({ id: p._id, label: p.name }))}
                                placeholder="Assign to Parent"
                            />
                            <Dropdown
                                label="Primary Route"
                                selectedValue={assignedRouteId}
                                onValueChange={setAssignedRouteId}
                                items={routes.map(r => ({ id: r._id, label: r.routeName || r.name }))}
                                placeholder="Select Route"
                            />
                            <Dropdown
                                label="Primary Bus (Optional)"
                                selectedValue={assignedBusId}
                                onValueChange={setAssignedBusId}
                                items={buses.map(b => ({ id: b._id, label: b.busNumber }))}
                                placeholder="Select Bus"
                            />
                            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateStudent}>
                                <Text style={styles.submitBtnTxt}>Register Student</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Reassign Modal */}
            <Modal visible={reassignModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Assignments</Text>
                        <Text style={styles.studentNameSubtitle}>{selectedStudent?.name}</Text>

                        <Dropdown
                            label="Change Route"
                            selectedValue={newRouteId}
                            onValueChange={setNewRouteId}
                            items={routes.map(r => ({ id: r._id, label: r.routeName || r.name }))}
                        />
                        <Dropdown
                            label="Change Bus"
                            selectedValue={newBusId}
                            onValueChange={setNewBusId}
                            items={buses.map(b => ({ id: b._id, label: b.busNumber }))}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setReassignModalVisible(false)}>
                                <Text style={styles.cancelBtnTxt}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyBtn} onPress={handleReassign}>
                                <Text style={styles.applyBtnTxt}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f8' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, backgroundColor: 'white', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1a365d' },
    addBtn: { backgroundColor: '#4c51bf', padding: 10, borderRadius: 15 },
    content: { padding: 20 },
    card: { backgroundColor: 'white', borderRadius: 25, padding: 20, marginBottom: 15, elevation: 4 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
    avatarTxt: { fontSize: 20, fontWeight: 'bold', color: '#4c51bf' },
    studentName: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
    studentClass: { color: '#718096', fontSize: 14 },
    editBtn: { padding: 10, backgroundColor: '#f7fafc', borderRadius: 12 },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#edf2f7', paddingTop: 15 },
    detail: { flex: 1 },
    label: { fontSize: 10, color: '#a0aec0', textTransform: 'uppercase', marginBottom: 4, fontWeight: 'bold' },
    value: { fontSize: 14, color: '#4a5568', fontWeight: '600' },
    liveBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 15, backgroundColor: '#fff5f5', padding: 10, borderRadius: 12 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f56565', marginRight: 8 },
    liveTxt: { fontSize: 12, color: '#c53030', fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 30, padding: 25, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#2d3748' },
    studentNameSubtitle: { fontSize: 16, color: '#4c51bf', marginBottom: 20, fontWeight: '600' },
    submitBtn: { backgroundColor: '#4c51bf', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 15, marginBottom: 20 },
    submitBtnTxt: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    modalActions: { flexDirection: 'row', gap: 15, marginTop: 10 },
    cancelBtn: { flex: 1, padding: 15, borderRadius: 15, backgroundColor: '#f7fafc', alignItems: 'center' },
    cancelBtnTxt: { color: '#718096', fontWeight: 'bold' },
    applyBtn: { flex: 1, padding: 15, borderRadius: 15, backgroundColor: '#4c51bf', alignItems: 'center' },
    applyBtnTxt: { color: 'white', fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default AdminStudents;
