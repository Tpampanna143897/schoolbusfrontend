import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

// ================= EMERGENCY SCREEN =================
export const EmergencyScreen = () => {
    const handleSOS = () => {
        Alert.alert("SOS SENT", "Panic signal sent to school admin and transport manager!");
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Emergency Mode</Text>
            </View>
            <View style={styles.centerParams}>
                <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
                    <Text style={styles.sosText}>SOS</Text>
                </TouchableOpacity>
                <Text style={styles.sosSubtext}>Hold for 3 seconds in case of emergency</Text>

                <View style={styles.emergencyRow}>
                    <TouchableOpacity style={styles.callBtn} onPress={() => Alert.alert("Calling Police...")}>
                        <Ionicons name="call" size={24} color="white" />
                        <Text style={styles.callBtnText}>Police</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.callBtn, { backgroundColor: "#ECC94B" }]} onPress={() => Alert.alert("Calling School...")}>
                        <Ionicons name="school" size={24} color="white" />
                        <Text style={styles.callBtnText}>School</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

// ================= NOTIFICATIONS SCREEN =================
const DUMMY_NOTIFS = [
    { id: "1", title: "Bus Late", body: "School Bus KA-01-1234 is delayed by 10 mins.", time: "10:30 AM", icon: "time", color: "#ECC94B" },
    { id: "2", title: "Trip Started", body: "Driver has started the afternoon trip.", time: "2:00 PM", icon: "bus", color: "#48BB78" },
    { id: "3", title: "Holiday Alert", body: "School is closed tomorrow due to heavy rain.", time: "Yesterday", icon: "alert-circle", color: "#F56565" },
];

export const NotificationsScreen = () => (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <FlatList
            data={DUMMY_NOTIFS}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 20 }}
            renderItem={({ item }) => (
                <View style={styles.notifCard}>
                    <View style={[styles.notifIcon, { backgroundColor: item.color + "20" }]}>
                        <Ionicons name={item.icon} size={24} color={item.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.notifTitle}>{item.title}</Text>
                        <Text style={styles.notifBody}>{item.body}</Text>
                        <Text style={styles.notifTime}>{item.time}</Text>
                    </View>
                </View>
            )}
        />
    </SafeAreaView>
);

// ================= PROFILE SCREEN =================
export const ProfileScreen = () => {
    const { logout, role, user } = useContext(AuthContext);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Profile</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(role || "U")[0]}</Text>
                    </View>
                    <Text style={styles.profileName}>{user?.name || "John Doe"}</Text>
                    <Text style={styles.profileRole}>{role || "User"}</Text>
                </View>

                {/* Settings Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <TouchableOpacity style={styles.settingItem}>
                        <Ionicons name="person-outline" size={20} color="#4a5568" />
                        <Text style={styles.settingText}>Edit Profile</Text>
                        <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingItem}>
                        <Ionicons name="notifications-outline" size={20} color="#4a5568" />
                        <Text style={styles.settingText}>Notification Preferences</Text>
                        <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Ionicons name="log-out-outline" size={20} color="white" />
                    <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F7FAFC" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    centerParams: { flex: 1, justifyContent: "center", alignItems: "center", paddingBottom: 50 },
    header: { padding: 20, backgroundColor: "white", borderBottomWidth: 1, borderColor: "#EDF2F7", elevation: 2 },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: "#2D3748" },

    // SOS Styles
    sosButton: {
        width: 180, height: 180, borderRadius: 90, backgroundColor: "#F56565",
        justifyContent: "center", alignItems: "center", elevation: 10,
        borderWidth: 8, borderColor: "#FED7D7"
    },
    sosText: { color: "white", fontSize: 40, fontWeight: "bold" },
    sosSubtext: { marginTop: 20, color: "#718096" },
    emergencyRow: { flexDirection: "row", marginTop: 40, gap: 20 },
    callBtn: {
        flexDirection: "row", backgroundColor: "#2D3748", paddingHorizontal: 20, paddingVertical: 12,
        borderRadius: 30, alignItems: "center"
    },
    callBtnText: { color: "white", fontWeight: "bold", marginLeft: 8 },

    // Notification Styles
    notifCard: {
        flexDirection: "row", backgroundColor: "white", padding: 16, borderRadius: 12,
        marginBottom: 12, elevation: 1
    },
    notifIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
    notifTitle: { fontWeight: "bold", fontSize: 16, color: "#2D3748" },
    notifBody: { color: "#718096", fontSize: 14, marginVertical: 4 },
    notifTime: { color: "#A0AEC0", fontSize: 12 },

    // Profile Styles
    profileHeader: { alignItems: "center", marginBottom: 30 },
    avatar: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: "#4C51BF",
        justifyContent: "center", alignItems: "center", marginBottom: 12
    },
    avatarText: { color: "white", fontSize: 32, fontWeight: "bold" },
    profileName: { fontSize: 22, fontWeight: "bold", color: "#2D3748" },
    profileRole: { color: "#718096", fontSize: 16 },
    section: { backgroundColor: "white", borderRadius: 12, padding: 10, marginBottom: 20, elevation: 1 },
    sectionTitle: { marginLeft: 10, marginTop: 10, marginBottom: 5, color: "#A0AEC0", fontSize: 13, fontWeight: "bold" },
    settingItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: "#EDF2F7" },
    settingText: { flex: 1, marginLeft: 16, fontSize: 16, color: "#2D3748" },
    logoutButton: {
        flexDirection: "row", backgroundColor: "#F56565", padding: 16, borderRadius: 12,
        justifyContent: "center", alignItems: "center"
    },
    logoutButtonText: { color: "white", fontWeight: "bold", fontSize: 16, marginLeft: 8 }
});
