import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import io from 'socket.io-client';
import client from '../api/client';

export const useTrackingSocket = (role) => {
    const socketRef = useRef(null);
    const [connectionStatus, setConnectionStatus] = useState("Connecting...");
    const [isConnected, setIsConnected] = useState(false);
    const locationQueue = useRef([]); // 5) Offline GPS queueing


    useEffect(() => {
        let baseUrl = client.defaults.baseURL || "";
        let socketUrl = baseUrl ? baseUrl.split('/api')[0] : "";

        if (!socketUrl) {
            setConnectionStatus("URL Error ❌");
            return;
        }

        // 1) Implement a production-safe Socket.IO client in Expo
        socketRef.current = io(socketUrl, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 10,
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

    const emitLocation = useCallback((data) => {
        // 4) Add GPS emit safeguards: Never emit undefined latitude/longitude
        if (!data.lat || !data.lng || !data.tripId || !data.busId || !data.driverId) {
            console.warn("[SOCKET] Attempted to emit invalid location data", data);
            return false;
        }

        if (socketRef.current?.connected) {
            socketRef.current.emit("driver-location-update", data);
            return true;
        } else {
            // 5) Store updates locally if socket is disconnected
            console.log("[SOCKET] Disconnected. Queueing location update...");
            locationQueue.current.push({ ...data, queued: true, timestamp: new Date() });
            return false;
        }
    }, []);

    const onLocationUpdate = useCallback((callback) => {
        if (socketRef.current) {
            socketRef.current.on("trip-location", callback);
            return () => {
                if (socketRef.current) {
                    socketRef.current.off("trip-location", callback);
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
        emitLocation,
        onLocationUpdate
    };
};
