import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';

const AdminDashboard = ({ navigation }) => {
    const { logout, user } = useContext(AuthContext);

    const ADMIN_MENU = [
        { id: 'live-map', title: 'Fleet Map', icon: 'planet', color: '#2b6cb0', screen: 'AdminAllBusesMap' },
        { id: 'tracking', title: 'Live Journeys', icon: 'map', color: '#667eea', screen: 'AdminLiveTrips' },
        { id: 'users', title: 'Manage Users', icon: 'people', color: '#4c51bf', screen: 'AdminUsers' },
        { id: 'routes', title: 'Manage Routes', icon: 'trail-sign', color: '#48bb78', screen: 'AdminRoutes' },
        { id: 'buses', title: 'Manage Buses', icon: 'bus', color: '#ed8936', screen: 'AdminBuses' },
        { id: 'students', title: 'Manage Students', icon: 'school', color: '#e53e3e', screen: 'AdminStudents' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcome}>Admin Portal</Text>
                    <Text style={styles.name}>{user?.name || 'Administrator'}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={24} color="#e53e3e" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.menuGrid}>
                {ADMIN_MENU.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        onPress={() => navigation.navigate(item.screen)}
                    >
                        < View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                            <Ionicons name={item.icon} size={32} color="white" />
                        </View>
                        <Text style={styles.menuTitle}>{item.title}</Text>
                        <Text style={styles.menuDesc}>Manage all {item.id} in the system</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: 'white', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 4 },
    welcome: { fontSize: 14, color: '#718096', fontWeight: '600' },
    name: { fontSize: 24, fontWeight: 'bold', color: '#2d3748' },
    logoutBtn: { padding: 8, borderRadius: 12, backgroundColor: '#fff5f5' },
    menuGrid: { padding: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    menuItem: { width: '47%', backgroundColor: 'white', padding: 20, borderRadius: 20, marginBottom: 20, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
    iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    menuTitle: { fontSize: 16, fontWeight: 'bold', color: '#2d3748', textAlign: 'center' },
    menuDesc: { fontSize: 10, color: '#a0aec0', marginTop: 4, textAlign: 'center' },
});

export default AdminDashboard;
