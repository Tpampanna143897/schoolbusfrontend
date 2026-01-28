import React, { useEffect, useState, useRef } from "react";
import { Animated, View, StyleSheet, Image, Dimensions } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

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
