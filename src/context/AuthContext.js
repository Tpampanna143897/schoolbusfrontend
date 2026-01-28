import React, { createContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import client from "../api/client";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load stored token on app start
    useEffect(() => {
        const loadAuth = async () => {
            try {
                const storedToken = await SecureStore.getItemAsync("token");
                const storedRole = await SecureStore.getItemAsync("role");

                if (storedToken && storedRole) {
                    setToken(storedToken);
                    setRole(storedRole);

                    // Fetch full user profile to populate context
                    try {
                        const res = await client.get("/auth/me");
                        setUser(res.data);
                    } catch (err) {
                        console.error("Failed to fetch profile during load", err);
                    }
                }
            } catch (error) {
                console.error("Auth load failed", error);
            } finally {
                setLoading(false);
            }
        };
        loadAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await client.post("/auth/login", { email, password });

            const { token, role, user } = res.data;

            await SecureStore.setItemAsync("token", token);
            await SecureStore.setItemAsync("role", role);

            setToken(token);
            setRole(role);
            setUser(user);

            return { success: true };
        } catch (error) {
            let errorMsg = "Login failed. Please try again.";

            if (error.response) {
                // Server responded with an error
                errorMsg = error.response.data?.message || `Server Error: ${error.response.status}`;
            } else if (error.request) {
                // Request was made but no response was received
                errorMsg = "Network Error: Server is not responding. It might be starting up (Render cold-start) or your internet is weak.";
            } else {
                errorMsg = error.message;
            }

            console.error("Login Error Details:", errorMsg);
            return { success: false, message: errorMsg };
        }
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync("token");
        await SecureStore.deleteItemAsync("role");
        setToken(null);
        setRole(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, role, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
