import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { AppState } from 'react-native';
import io from 'socket.io-client';
import client from '../api/client';

export const useTrackingSocket = (role) => {
    const socketRef = useRef(null);
    const [connectionStatus, setConnectionStatus] = useState("Connecting...");
    const [isConnected, setIsConnected] = useState(false);
    const locationQueue = useRef([]); // 5) Offline GPS queueing
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        // AppState listener: We ONLY emit tracking if explicitly foregrounded
        const subscription = AppState.addEventListener('change', nextAppState => {
            appState.current = nextAppState;
            console.log(`[SOCKET] AppState changed to: ${nextAppState}`);
        });

        let baseUrl = client.defaults.baseURL || "";
        let socketUrl = baseUrl ? baseUrl.split('/api')[0] : "";

        if (!socketUrl) {
            setConnectionStatus("URL Error ❌");
            return;
        }

        // 1) Implement a production-safe Socket.IO client in Expo
        socketRef.current = io(socketUrl, {
            transports: ["polling", "websocket"],
            reconnection: true,
            reconnectionAttempts: 15,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 20000,
            autoConnect: true
        });

        socketRef.current.on("connect", () => {
            console.log(`[SOCKET] ${role} connected:`, socketRef.current.id);
            setConnectionStatus("Live ✔");
            setIsConnected(true);

            // Re-identify/join based on role if needed
            if (role === "ADMIN_FLEET" || role === "STAFF_FLEET" || role === "ADMIN") {
                socketRef.current.emit("join-admin");
                console.log(`[SOCKET] Auto-joined admin-room for ${role}`);
            }

            flushQueue();
        });

        socketRef.current.on("connect_error", (err) => {
            console.warn(`[SOCKET] ${role} connect_error:`, err.message);
            setConnectionStatus("Connecting... ⏳");
            setIsConnected(false);
        });

        socketRef.current.on("disconnect", (reason) => {
            console.log(`[SOCKET] ${role} disconnected:`, reason);
            setConnectionStatus("Disconnected ⚠️");
            setIsConnected(false);

            if (reason === "io server disconnect" || reason === "transport close") {
                setTimeout(() => socketRef.current?.connect(), 5000);
            }
        });

        return () => {
            subscription.remove();
            if (socketRef.current) {
                console.log(`[SOCKET] Cleaning up ${role} socket...`);
                socketRef.current.removeAllListeners();
                socketRef.current.disconnect();
            }
        };
    }, [role]);

    const flushQueue = useCallback(() => {
        if (locationQueue.current.length > 0 && socketRef.current?.connected) {
            console.log(`[SOCKET] Flushing ${locationQueue.current.length} queued updates...`);
            while (locationQueue.current.length > 0) {
                const data = locationQueue.current.shift();
                socketRef.current.emit("driver-location-update", data);
            }
        }
    }, []);

    const joinBus = useCallback((busId) => {
        if (socketRef.current && busId) {
            socketRef.current.emit("join-bus", busId);
            console.log(`[SOCKET] Emitted join-bus for ${busId}`);
        }
    }, []);

    const joinAdmin = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit("join-admin");
            console.log(`[SOCKET] Emitted join-admin`);
        }
    }, []);

    const joinTrip = useCallback((tripId) => {
        if (socketRef.current && tripId) {
            socketRef.current.emit("join-trip", tripId);
            console.log(`[SOCKET] Emitted join-trip for ${tripId}`);
        }
    }, []);

    const emitLocation = useCallback((data) => {
        // PRODUCTION SAFEGUARDS:
        // 1. Only emit if app is ACTIVE (Foreground) - REMOVED for background tracking support
        // if (appState.current !== 'active') {
        //     return false;
        // }

        const { lat, lng, tripId, busId, driverId } = data;

        // 2. Strict Coordinate Validation (Prevents Native App Crash)
        if (!tripId || !busId || !driverId || !Number.isFinite(lat) || !Number.isFinite(lng)) {
            console.warn("[SOCKET] Rejected invalid/NaN GPS point:", data);
            return false;
        }

        if (socketRef.current?.connected) {
            socketRef.current.emit("driver-location-update", data);
            return true;
        } else {
            // Keep queueing for reconnections
            console.log("[SOCKET] Offline. Queueing update...");
            locationQueue.current.push({ ...data, queued: true, timestamp: new Date() });
            if (locationQueue.current.length > 30) locationQueue.current.shift();
            return false;
        }
    }, []);

    const onLocationUpdate = useCallback((callback) => {
        if (socketRef.current) {
            const wrappedCallback = (data) => {
                // console.log(`[SOCKET] Received bus-location for Trip:${data.tripId}`);
                callback(data);
            };
            socketRef.current.on("busLocation", wrappedCallback);
            return () => {
                if (socketRef.current) {
                    socketRef.current.off("busLocation", wrappedCallback);
                }
            };
        }
    }, []);

    const onOfflineUpdate = useCallback((callback) => {
        if (socketRef.current) {
            socketRef.current.on("busOffline", callback);
            return () => {
                if (socketRef.current) {
                    socketRef.current.off("busOffline", callback);
                }
            };
        }
    }, []);

    const onStopProgressed = useCallback((callback) => {
        if (socketRef.current) {
            socketRef.current.on("stopProgressed", callback);
            return () => {
                if (socketRef.current) {
                    socketRef.current.off("stopProgressed", callback);
                }
            };
        }
    }, []);

    const onAttendanceMarked = useCallback((callback) => {
        if (socketRef.current) {
            socketRef.current.on("attendanceMarked", callback);
            return () => {
                if (socketRef.current) {
                    socketRef.current.off("attendanceMarked", callback);
                }
            };
        }
    }, []);

    return {
        socket: socketRef.current,
        connectionStatus,
        isConnected,
        joinBus,
        joinAdmin,
        joinTrip,
        emitLocation,
        onLocationUpdate,
        onOfflineUpdate,
        onStopProgressed,
        onAttendanceMarked
    };
};
