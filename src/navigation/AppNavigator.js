import React, { useContext } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthContext } from "../context/AuthContext";
import AdminUsers from "../screens/admin/AdminUsers";
import AdminRoutes from "../screens/admin/AdminRoutes";
import AdminBuses from "../screens/admin/AdminBuses";
import AdminStudents from "../screens/admin/AdminStudents";
import MainTabNavigator from "./MainTabNavigator";
import LoginScreen from "../screens/auth/LoginScreen";
import ParentStudentDetails from "../screens/parent/ParentStudentDetails";
import ParentMapScreen from "../screens/parent/ParentMapScreen";
import DriverSelectBusScreen from "../screens/driver/DriverSelectBusScreen";
import DriverMapScreen from "../screens/driver/DriverMapScreen";
import AdminLiveTripsScreen from "../screens/admin/AdminLiveTripsScreen";
import AdminMapScreen from "../screens/admin/AdminMapScreen";
import AdminAllBusesMapScreen from "../screens/admin/AdminAllBusesMapScreen";
import AdminStaffManagementScreen from "../screens/admin/AdminStaffManagementScreen";
import AdminTripHistoryScreen from "../screens/admin/AdminTripHistoryScreen";
import StaffDashboardScreen from "../screens/driver/StaffDashboardScreen";
import StaffLiveTrackingScreen from "../screens/driver/StaffLiveTrackingScreen";
import StaffCalendarViewScreen from "../screens/driver/StaffCalendarViewScreen";
import ParentCalendarScreen from "../screens/parent/ParentCalendarScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const { token, role, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#4c51bf" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {token ? (
                    <>
                        <Stack.Screen name="Main" component={MainTabNavigator} />
                        {/* Parent Specific Screens */}
                        <Stack.Screen name="ParentStudentDetails" component={ParentStudentDetails} options={{ headerShown: true, title: 'Student Details' }} />
                        <Stack.Screen name="ParentMap" component={ParentMapScreen} />

                        {/* Driver Specific Screens */}
                        <Stack.Screen name="DriverSelectBus" component={DriverSelectBusScreen} options={{ headerShown: true, title: 'Bus Selection' }} />
                        <Stack.Screen name="DriverMap" component={DriverMapScreen} />

                        {/* Admin Specific Screens */}
                        <Stack.Screen name="AdminUsers" component={AdminUsers} options={{ headerShown: true, title: 'Manage Users' }} />
                        <Stack.Screen name="AdminRoutes" component={AdminRoutes} options={{ headerShown: true, title: 'Manage Routes' }} />
                        <Stack.Screen name="AdminBuses" component={AdminBuses} options={{ headerShown: true, title: 'Manage Buses' }} />
                        <Stack.Screen name="AdminStudents" component={AdminStudents} options={{ headerShown: true, title: 'Manage Students' }} />
                        <Stack.Screen name="AdminLiveTrips" component={AdminLiveTripsScreen} options={{ headerShown: true, title: 'Live Fleet' }} />
                        <Stack.Screen name="AdminMap" component={AdminMapScreen} />
                        <Stack.Screen name="AdminAllBusesMap" component={AdminAllBusesMapScreen} />
                        <Stack.Screen name="AdminStaffManagement" component={AdminStaffManagementScreen} options={{ headerShown: true, title: 'Manage Staff' }} />
                        <Stack.Screen name="AdminTripHistory" component={AdminTripHistoryScreen} options={{ headerShown: true, title: 'Trip History' }} />

                        {/* Staff Specific Screens */}
                        <Stack.Screen name="StaffDashboard" component={StaffDashboardScreen} />
                        <Stack.Screen name="StaffLiveTracking" component={StaffLiveTrackingScreen} />
                        <Stack.Screen name="StaffCalendarView" component={StaffCalendarViewScreen} options={{ headerShown: true, title: 'Attendance Feed' }} />

                        {/* Parent Specific Screens (Extended) */}
                        <Stack.Screen name="ParentCalendar" component={ParentCalendarScreen} options={{ headerShown: true, title: 'Attendance History' }} />
                    </>
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
