import React, { useEffect, useState, useRef } from "react";
import { Animated, View, StyleSheet, Image, Dimensions } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import axios from 'axios';
import client from './src/api/client';
import { storage } from './src/utils/storage';

const isWeb = Platform.OS === 'web';
const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task (NATIVE ONLY)
if (!isWeb) {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.warn("[TASK_MANAGER] Background location error:", error);
      return;
    }
    if (data) {
      const { locations } = data;
      const location = locations[0];
      if (location) {
        try {
          // 1. Retrieve session from storage (Since headless tasks don't share React Context)
          const tripId = await storage.getItemAsync("active_trip_id");
          const busId = await storage.getItemAsync("active_bus_id");
          const driverId = await storage.getItemAsync("active_driver_id");
          const token = await storage.getItemAsync("token");

          if (!tripId) return; // No active trip tracking needed

          // 2. HTTP Fallback Emission (Sockets might be suspended in background)
          // We use the same URL from client.js but via direct axios if needed, 
          // or just the client instance if baseURL is already configured.
          await axios.post(`${client.defaults.baseURL}/tracking/update`, {
            tripId, busId, driverId,
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            speed: Math.max(0, Math.round((location.coords.speed || 0) * 3.6)),
            heading: location.coords.heading || 0
          }, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          });

          console.log(`[TASK_MANAGER] BG Hypersync: ${tripId} @ ${location.coords.latitude},${location.coords.longitude}`);
        } catch (e) {
          console.warn("[TASK_MANAGER] BG Sync Failed:", e.message);
        }
      }
    }
  });
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might cause this to error, so we can ignore it */
});

const { width, height } = Dimensions.get("window");

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);

  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const fadeContainer = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        // Simulate a delay for asset loading
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Hide native splash screen
      SplashScreen.hideAsync();

      // Start custom animation
      Animated.sequence([
        // Scale in and fade in
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        // Short pause
        Animated.delay(500),
        // Fade out the entire container
        Animated.timing(fadeContainer, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAnimationFinished(true);
      });
    }
  }, [appIsReady]);

  if (!animationFinished) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeContainer,
            },
          ]}
        >
          <Animated.Image
            source={require("./assets/icon.png")}
            style={[
              styles.logo,
              {
                transform: [{ scale: scale }],
                opacity: opacity,
              },
            ]}
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  animatedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
});
