import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

// Safe Area + Premium UI Updates
const { width } = Dimensions.get("window");
// 3 columns: Each item is 1/3 of the width. 
// We use padding inside the item to create spacing between them.
const COLUMNS = 3;
const ITEM_WIDTH = width / COLUMNS;

const GRID_ITEMS = [
    { id: "route", label: "My Route", icon: "map", roles: ["DRIVER"] },
    { id: "students", label: "Students", icon: "people", roles: ["DRIVER", "TEACHER"] },
    { id: "sos", label: "SOS", icon: "warning", roles: ["DRIVER", "STUDENT", "TEACHER"], color: "#e53e3e" },
    { id: "trip", label: "Start Trip", icon: "bus", roles: ["DRIVER"] },
    { id: "bus_loc", label: "Bus Location", icon: "location", roles: ["STUDENT", "PARENT", "TEACHER"] },
    { id: "attendance", label: "Attendance", icon: "checkmark-circle", roles: ["TEACHER"] },
    { id: "exam", label: "Exams", icon: "document-text", roles: ["STUDENT", "TEACHER"] },
    { id: "admin_users", label: "Users", icon: "people-circle", roles: ["ADMIN"] },
    { id: "admin_fleet", label: "Fleet", icon: "bus-outline", roles: ["ADMIN"] },
    { id: "admin_reports", label: "Reports", icon: "stats-chart", roles: ["ADMIN"] },
];

const HomeScreen = ({ navigation }) => {
    const { role, user, logout } = useContext(AuthContext);

    const handlePress = (item) => {
        // ... (Keep existing logic)
        switch (item.id) {
            case "bus_loc":
                navigation.navigate("Bus");
                break;
            case "route":
                navigation.navigate("Bus");
                break;
            case "trip":
                navigation.navigate("Bus");
                break;
            case "sos":
                navigation.navigate("Emergency");
                break;
            default:
                console.log("Navigating to", item.label);
                break;
        }
    };

    const visibleItems = GRID_ITEMS.filter(item => {
        if (!role) return false;
        if (role === "ADMIN") return true;
        return item.roles.includes(role);
    });

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.username}>{role || "User"}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={24} color="#e53e3e" />
                </TouchableOpacity>
            </View>

            {/* Grid Content */}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.gridContainer}>
                    {visibleItems.map((item) => (
                        <View key={item.id} style={styles.gridItemWrapper}>
                            <TouchableOpacity
                                style={styles.gridItemInner}
                                onPress={() => handlePress(item)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconCircle, item.color && { backgroundColor: item.color }]}>
                                    <Ionicons
                                        name={item.icon}
                                        size={28}
                                        color={item.color ? "#fff" : "#4c51bf"}
                                    />
                                </View>
                                <Text style={styles.label} numberOfLines={2}>{item.label}</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f9fa" },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#fff",
        elevation: 2, // Android shadow
        shadowColor: "#000", // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        marginBottom: 10,
    },
    greeting: { fontSize: 14, color: "#a0aec0", fontWeight: "600" },
    username: { fontSize: 22, fontWeight: "800", color: "#2d3748" },
    logoutBtn: { padding: 10, backgroundColor: "#fff5f5", borderRadius: 12 },

    scrollContent: { paddingBottom: 120 }, // Extra padding for bottom tab
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "flex-start", // Top align items
    },
    gridItemWrapper: {
        width: ITEM_WIDTH, // Exactly 1/3 of screen
        padding: 10, // Creates spacing between items
        alignItems: "center",
    },
    gridItemInner: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        // Optional: Add card background if desired, keeping it clean for now
    },
    iconCircle: {
        width: 65,
        height: 65,
        borderRadius: 24, // Squircle shape
        backgroundColor: "#ebf4ff",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
        shadowColor: "#4299e1",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#4a5568",
        textAlign: "center",
        lineHeight: 18,
    },
});

export default HomeScreen;
