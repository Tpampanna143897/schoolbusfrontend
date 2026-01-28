import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // Import hook
import HomeScreen from "../screens/HomeScreen";
import { EmergencyScreen, NotificationsScreen } from "../screens/Placeholders";
import ProfileScreen from "../screens/ProfileScreen";
import { AuthContext } from "../context/AuthContext";

// Role-based Dashboards
import AdminDashboard from "../screens/admin/AdminDashboard";
import ParentDashboard from "../screens/parent/ParentDashboard";
import DriverDashboard from "../screens/driver/DriverDashboard";
import DriverSelectBusScreen from "../screens/driver/DriverSelectBusScreen";
import TrackMapScreen from "../screens/parent/TrackMapScreen";

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    const { role } = useContext(AuthContext);
    const insets = useSafeAreaInsets();

    const getHomeComponent = () => {
        switch (role) {
            case 'ADMIN': return AdminDashboard;
            case 'DRIVER': return DriverDashboard;
            case 'PARENT': return ParentDashboard;
            default: return HomeScreen;
        }
    };

    const getBusComponent = () => {
        if (role === 'DRIVER') return DriverSelectBusScreen;
        return ParentDashboard;
    };

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === "Home") {
                        iconName = focused ? "grid" : "grid-outline";
                    } else if (route.name === "Emergency") {
                        iconName = focused ? "warning" : "warning-outline";
                    } else if (route.name === "Bus") {
                        iconName = focused ? "bus" : "bus-outline";
                    } else if (route.name === "Notifications") {
                        iconName = focused ? "notifications" : "notifications-outline";
                    } else if (route.name === "Profile") {
                        iconName = focused ? "person" : "person-outline";
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: "#4c51bf",
                tabBarInactiveTintColor: "gray",
                tabBarStyle: {
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                    height: 60 + (insets.bottom > 0 ? insets.bottom : 10),
                    paddingTop: 8,
                }
            })}
        >
            <Tab.Screen name="Home" component={getHomeComponent()} />

            <Tab.Screen
                name="Bus"
                component={getBusComponent()}
            />

            <Tab.Screen name="Emergency" component={EmergencyScreen} />
            <Tab.Screen name="Notifications" component={NotificationsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;
