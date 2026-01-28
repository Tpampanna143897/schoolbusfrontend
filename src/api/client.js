import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Replace with your local IP if testing on real device
// e.g., http://192.168.1.5:5000/api
export const BASE_URL = "https://schoolbusbackend-acx9.onrender.com/api";
// export const BASE_URL = "http://10.16.202.148:5000/api";
// const BASE_URL = "http://192.168.137.1:5000/api";
const client = axios.create({
    baseURL: BASE_URL,
    timeout: 30000, // Increased to 30s for Render cold starts
    headers: {
        "Content-Type": "application/json",
    },
});

client.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for global error handling
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            console.warn("Session expired. Clearing local token...");
            await SecureStore.deleteItemAsync("token");
        } else if (!error.response) {
            console.error("Network Error: Please check your connection.");
        }
        return Promise.reject(error);
    }
);

export default client;
