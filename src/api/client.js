import axios from "axios";
import { storage } from "../utils/storage";

// --- CONFIGURATION ---
// 1. For Physical Device + Hotspot: Use 192.168.137.1
// 2. For Physical Device + Common Wi-Fi: Use your laptop's Local IP (e.g. 192.168.1.x)
// 3. For Android Emulator: Use 10.0.2.2
// 4. For Web/Localhost: Use localhost

// export const BASE_URL = "http://192.168.137.1:5000/api"; 
// export const BASE_URL = "http://10.16.202.148:5000/api"; 
// export const BASE_URL = "http://10.0.2.2:5000/api";
// export const BASE_URL = "http://localhost:5000/api";
export const BASE_URL = "https://schoolbusbackend-acx9.onrender.com/api";

console.log("[API] Connecting to:", BASE_URL);

const client = axios.create({
    baseURL: BASE_URL,
    timeout: 30000, // 30s to allow Render cold start
    headers: {
        "Content-Type": "application/json",
    },
});

client.interceptors.request.use(async (config) => {
    const token = await storage.getItemAsync("token");
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
            console.warn("[API] Session expired. Clearing local token...");
            await storage.deleteItemAsync("token");
        } else if (!error.response) {
            if (error.code === 'ECONNABORTED') {
                console.error("[API] Network Timeout: Server is taking too long to respond (likely cold start).");
            } else {
                console.error("[API] Network Error Details:", {
                    message: error.message,
                    code: error.code,
                    config: error.config?.url
                });
                console.error("[API] Network Error: Unable to reach server. Check internet or BASE_URL.");
            }
        } else {
            console.error(`[API] Error ${error.response.status}:`, error.response.data);
        }
        return Promise.reject(error);
    }
);

export default client;
