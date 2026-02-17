import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Dimensions, Modal, FlatList } from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { driverApi } from "../../api/driverApi";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 2 - 40;

const DriverDashboard = ({ navigation }) => {
    const { logout, user } = useContext(AuthContext);
    const [bus, setBus] = useState(null);
    const [activeTrip, setActiveTrip] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchMyBus(), fetchActiveTrip()]);
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveTrip = async () => {
        try {
            const res = await driverApi.getActiveTrip();
            const { success, data } = res.data || {};
            if (success && data && data._id) {
                console.log("Active Trip Found:", data._id);
                setActiveTrip(data);
                const busId = data.busId?._id || data.busId;
                if (busId) fetchStudents(busId);
            } else {
                setActiveTrip(null);
            }
        } catch (err) {
            console.log("No active trip found:", err.message);
            setActiveTrip(null);
        }
    };

    const fetchMyBus = async () => {
        try {
            const res = await driverApi.getBuses();
            const { success, data } = res.data || {};
            // In dynamic mode, just showing the first available bus as "primary"
            const busList = Array.isArray(data) ? data : [];
            const primaryBus = busList.find(b => b.isActive) || busList[0];
            setBus(primaryBus || null);
        } catch (err) {
            console.log("No bus assigned or error", err.message);
            setBus(null);
        }
    };

    const fetchStudents = async (busId) => {
        if (!busId) return;
        try {
            const res = await driverApi.getStudents(busId);
            const { success, data } = res.data || {};
            setStudents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.log("Error fetching students:", error.message);
            setStudents([]);
        }
    };

    const markAttendance = async (studentId, status) => {
        if (!activeTrip) {
            Alert.alert("Warning", "You must start a trip before marking attendance.");
            return;
        }

        try {
            await driverApi.markAttendance({
                studentId,
                status,
                tripId: activeTrip._id
            });
            Alert.alert('Success', `Attendance marked as ${status}`);
        } catch (error) {
            Alert.alert('Error', 'Failed to mark attendance');
        }
    };

    const handleActionPress = (actionId) => {
        if (actionId === 'students') {
            setAttendanceModalVisible(true);
        } else if (actionId === 'route') {
            navigation.navigate("DriverSelectBus");
        } else if (actionId === 'locate') {
            if (!bus) return Alert.alert("Error", "No bus assigned to you.");
            navigation.navigate("ParentMap", { bus });
        }
    };

    const DRIVER_ACTIONS = [
        { id: "route", label: "My Route", icon: "map", color: "#4299e1" },
        { id: "locate", label: "Locate Bus", icon: "location", color: "#48bb78" },
        { id: "students", label: "Student List", icon: "people", color: "#ecc94b" },
    ];

    const handleResumeTrip = () => {
        if (!activeTrip) return;
        navigation.navigate("DriverMap", {
            bus: activeTrip.busId,
            tripId: activeTrip._id
        });
    };

    const handleEndTrip = () => {
        Alert.alert("End Current Trip?", "This will forcibly conclude your active session.", [
            { text: "Cancel" },
            {
                text: "End Trip",
                style: "destructive",
                onPress: async () => {
                    try {
                        await driverApi.endTrip({ tripId: activeTrip._id });
                        setActiveTrip(null);
                        Alert.alert("Success", "Trip session ended.");
                    } catch (err) {
                        Alert.alert("Error", "Failed to end session.");
                    }
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Driver Portal</Text>
                <TouchableOpacity onPress={logout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statusCard}>
                <Ionicons name="bus" size={40} color="white" />
                <View style={{ marginLeft: 15 }}>
                    <Text style={styles.label}>Assigned Vehicle</Text>
                    <Text style={styles.value}>
                        {activeTrip?.busId?.busNumber || bus?.busNumber || (loading ? "Loading..." : "No Bus")}
                    </Text>
                </View>
                {activeTrip && (
                    <View style={styles.activeLabel}>
                        <Text style={styles.activeText}>{activeTrip.status}</Text>
                    </View>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.gridContainer}>
                {DRIVER_ACTIONS.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.gridItem}
                        onPress={() => handleActionPress(item.id)}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                            <Ionicons name={item.icon} size={32} color="white" />
                        </View>
                        <Text style={styles.gridLabel}>{item.label}</Text>
                    </TouchableOpacity>
                ))}

                {!activeTrip ? (
                    <TouchableOpacity
                        style={[styles.tripBtn, styles.startBtn]}
                        onPress={() => navigation.navigate("DriverSelectBus")}
                    >
                        <Ionicons name="play-circle" size={60} color="white" />
                        <Text style={styles.tripBtnText}>PREPARE TRIP</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: '100%' }}>
                        <TouchableOpacity
                            style={[styles.tripBtn, styles.resumeBtn]}
                            onPress={handleResumeTrip}
                        >
                            <Ionicons name="map" size={50} color="white" />
                            <Text style={styles.tripBtnText}>RESUME TRIP</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tripBtn, styles.forceEndBtn]}
                            onPress={handleEndTrip}
                        >
                            <Ionicons name="stop-circle-outline" size={30} color="white" />
                            <Text style={[styles.tripBtnText, { fontSize: 14 }]}>End Current Session</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <Text style={styles.infoText}>
                    {activeTrip ? "You have an ongoing journey." : "Ready to start your journey?"}
                </Text>
            </ScrollView>

            <Modal visible={attendanceModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Mark Attendance</Text>
                            <TouchableOpacity onPress={() => setAttendanceModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#4a5568" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={students}
                            keyExtractor={item => item._id}
                            renderItem={({ item }) => (
                                <View style={styles.studentItem}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.studentNameText}>{item.name}</Text>
                                        <Text style={styles.studentClassText}>{item.class}</Text>
                                    </View>
                                    <View style={styles.attendanceButtons}>
                                        <TouchableOpacity
                                            style={[styles.attBtn, styles.pickupBtn]}
                                            onPress={() => markAttendance(item._id, 'PICKED_UP')}
                                        >
                                            <Text style={styles.attBtnText}>Pickup</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.attBtn, styles.dropBtn]}
                                            onPress={() => markAttendance(item._id, 'DROPPED_OFF')}
                                        >
                                            <Text style={styles.attBtnText}>Drop</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={<Text style={styles.emptyText}>No students in this bus</Text>}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#1a202c" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 24 },
    title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
    logoutText: { color: "#fc8181", fontWeight: "600" },
    statusCard: { flexDirection: "row", backgroundColor: "#2d3748", margin: 20, padding: 20, borderRadius: 12, alignItems: "center" },
    label: { color: "#a0aec0", fontSize: 14 },
    value: { color: "#fff", fontSize: 24, fontWeight: "bold" },
    gridContainer: { padding: 20, alignItems: "center", paddingBottom: 100 },
    gridItem: { width: ITEM_WIDTH, backgroundColor: "#2d3748", padding: 20, borderRadius: 16, alignItems: "center", margin: 10, marginBottom: 20 },
    iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginBottom: 10 },
    gridLabel: { color: "white", fontWeight: "bold", fontSize: 16 },
    tripBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", padding: 20, borderRadius: 16, marginTop: 15, elevation: 5, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5 },
    startBtn: { backgroundColor: "#48bb78" },
    resumeBtn: { backgroundColor: "#4c51bf" },
    forceEndBtn: { backgroundColor: "#e53e3e", marginTop: 12, padding: 12 },
    tripBtnText: { color: "#fff", fontSize: 20, fontWeight: "bold", marginLeft: 10 },
    infoText: { color: "#a0aec0", marginTop: 15, fontSize: 16 },
    activeLabel: { backgroundColor: "#ed8936", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 'auto' },
    activeText: { color: "white", fontSize: 10, fontWeight: "800" },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2d3748' },
    studentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#edf2f7' },
    studentNameText: { fontSize: 16, fontWeight: 'bold', color: '#2d3748' },
    studentClassText: { fontSize: 12, color: '#718096' },
    attendanceButtons: { flexDirection: 'row', gap: 8 },
    attBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    pickupBtn: { backgroundColor: '#48bb78' },
    dropBtn: { backgroundColor: '#ecc94b' },
    attBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    emptyText: { textAlign: 'center', color: '#a0aec0', marginTop: 20 }
});

export default DriverDashboard;
