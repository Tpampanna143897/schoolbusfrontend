import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, ActivityIndicator } from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { parentApi } from "../../api/parentApi";
import { studentApi } from "../../api/studentApi";
import { Ionicons } from "@expo/vector-icons";

const ParentDashboard = ({ navigation }) => {
    const { logout, user } = useContext(AuthContext);
    const [children, setChildren] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedChild, setSelectedChild] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async () => {
        setLoading(true);
        try {
            const res = await parentApi.getChildren();
            setChildren(res.data || []);
        } catch (err) {
            console.log("Error fetching children:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async (child) => {
        setSelectedChild(child);
        setModalVisible(true);
        try {
            const res = await parentApi.getAttendance(child._id);
            setAttendance(res.data);
        } catch (error) {
            console.log("Error fetching attendance:", error);
            setAttendance([]);
        }
    };

    const renderChild = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.childName}>{item.name}</Text>
                    <Text style={styles.classText}>{item.class}</Text>
                </View>
                <TouchableOpacity style={styles.attHistoryBtn} onPress={() => fetchAttendance(item)}>
                    <Ionicons name="calendar-outline" size={20} color="#4299e1" />
                    <Text style={styles.attHistoryText}>History</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <Text style={styles.busText}>Bus: {item.assignedBus?.busNumber || "Tracking Unavailable"}</Text>

            <TouchableOpacity
                style={styles.trackBtn}
                onPress={() => navigation.navigate("ParentStudentDetails", { student: item })}
            >
                <Text style={styles.trackBtnText}>View Live Details</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Children</Text>
                <TouchableOpacity onPress={logout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4299e1" />
                </View>
            ) : (
                <FlatList
                    data={children}
                    renderItem={renderChild}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No children found linked to your account.</Text>
                            <TouchableOpacity onPress={fetchChildren} style={{ marginTop: 10 }}>
                                <Text style={{ color: "#4299e1", fontWeight: "bold" }}>Tap to Retry</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedChild?.name}'s Attendance</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#4a5568" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={attendance}
                            keyExtractor={item => item._id}
                            renderItem={({ item }) => (
                                <View style={styles.attItem}>
                                    <View>
                                        <Text style={styles.attDate}>{new Date(item.date).toLocaleDateString()}</Text>
                                        <Text style={styles.attTime}>{new Date(item.date).toLocaleTimeString()}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'PICKED_UP' ? '#f0fff4' : '#fff5f5' }]}>
                                        <Text style={[styles.statusText, { color: item.status === 'PICKED_UP' ? '#2f855a' : '#c53030' }]}>
                                            {item.status ? item.status.replace('_', ' ') : 'UNKNOWN'}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={<Text style={styles.emptyText}>No attendance records found</Text>}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f0f4f8" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "#fff" },
    title: { fontSize: 24, fontWeight: "bold", color: "#2d3748" },
    logoutText: { color: "#e53e3e", fontWeight: "600" },
    list: { padding: 20 },
    card: { backgroundColor: "#fff", borderRadius: 12, padding: 20, marginBottom: 16, elevation: 2 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    childName: { fontSize: 20, fontWeight: "bold", color: "#2d3748" },
    classText: { fontSize: 14, color: "#718096" },
    attHistoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8, backgroundColor: '#ebf8ff', borderRadius: 8 },
    attHistoryText: { fontSize: 12, color: '#4299e1', fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: "#e2e8f0", marginBottom: 16 },
    busText: { fontSize: 16, color: "#4a5568", marginBottom: 16 },
    trackBtn: { backgroundColor: "#4299e1", padding: 12, borderRadius: 8, alignItems: "center" },
    disabledBtn: { backgroundColor: '#a0aec0' },
    trackBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2d3748' },
    attItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#edf2f7' },
    attDate: { fontSize: 16, color: '#2d3748', fontWeight: '500' },
    attTime: { fontSize: 12, color: '#718096' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', color: '#a0aec0', marginTop: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
});

export default ParentDashboard;
