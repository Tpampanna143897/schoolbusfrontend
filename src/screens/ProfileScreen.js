import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import client from "../api/client";

const ProfileScreen = ({ navigation }) => {
    const { logout, role } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await client.get("/auth/me");
            setUser(res.data);
            setName(res.data.name);
            setEmail(res.data.email);
            setLoading(false);
        } catch (err) {
            console.log("Profile Fetch Error", err);
            setLoading(false);
            Alert.alert("Error", "Failed to load profile");
        }
    };

    const handleUpdate = async () => {
        if (!name || !email) {
            Alert.alert("Error", "Name and Email are required");
            return;
        }

        try {
            setLoading(true);
            const res = await client.put("/auth/me", { name, email });
            setUser({ ...user, name, email }); // Optimistic update or use res.data
            setIsEditing(false);
            Alert.alert("Success", "Profile updated successfully");
        } catch (err) {
            console.log("Update Error", err);
            Alert.alert("Error", "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4c51bf" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Profile</Text>
                <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                    <Text style={styles.editText}>{isEditing ? "Cancel" : "Edit"}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Avatar Section */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(name || "U")[0].toUpperCase()}</Text>
                    </View>
                    {!isEditing && (
                        <>
                            <Text style={styles.profileName}>{user?.name}</Text>
                            <Text style={styles.profileRole}>{role || "User"}</Text>
                        </>
                    )}
                </View>

                {/* Form Section */}
                <View style={styles.section}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={[styles.input, !isEditing && styles.disabledInput]}
                        value={name}
                        onChangeText={setName}
                        editable={isEditing}
                    />

                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={[styles.input, !isEditing && styles.disabledInput]}
                        value={email}
                        onChangeText={setEmail}
                        editable={isEditing} // Email usually read-only in some apps, but allowing edit here
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Role</Text>
                    <TextInput
                        style={[styles.input, styles.disabledInput]}
                        value={role}
                        editable={false}
                    />
                </View>

                {isEditing && (
                    <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.divider} />

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
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "white", elevation: 2 },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: "#2D3748" },
    editText: { color: "#4c51bf", fontWeight: "bold", fontSize: 16 },

    profileHeader: { alignItems: "center", marginBottom: 30, marginTop: 10 },
    avatar: {
        width: 100, height: 100, borderRadius: 50, backgroundColor: "#4C51BF",
        justifyContent: "center", alignItems: "center", marginBottom: 16, elevation: 5
    },
    avatarText: { color: "white", fontSize: 40, fontWeight: "bold" },
    profileName: { fontSize: 24, fontWeight: "bold", color: "#2D3748" },
    profileRole: { color: "#718096", fontSize: 16, marginTop: 4 },

    section: { backgroundColor: "white", borderRadius: 12, padding: 20, marginBottom: 20, elevation: 2 },
    label: { color: "#718096", fontSize: 14, marginBottom: 6, fontWeight: "600" },
    input: {
        backgroundColor: "#F7FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8,
        padding: 12, fontSize: 16, color: "#2D3748", marginBottom: 16
    },
    disabledInput: { color: "#A0AEC0", backgroundColor: "#EDF2F7", borderColor: "transparent" },

    saveBtn: { backgroundColor: "#48BB78", padding: 16, borderRadius: 12, alignItems: "center", marginBottom: 20, elevation: 3 },
    saveBtnText: { color: "white", fontWeight: "bold", fontSize: 18 },

    divider: { height: 1, backgroundColor: "#E2E8F0", marginBottom: 24 },

    logoutButton: {
        flexDirection: "row", backgroundColor: "#F56565", padding: 16, borderRadius: 12,
        justifyContent: "center", alignItems: "center", elevation: 3
    },
    logoutButtonText: { color: "white", fontWeight: "bold", fontSize: 16, marginLeft: 8 }
});

export default ProfileScreen;
