import { useEffect, useRef, useState } from 'react';
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
            transports: ["websocket", "polling"], // Uses websocket + polling fallback
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            forceNew: true,
            autoConnect: true
        });

        socketRef.current.on("connect", () => {
            console.log(`[SOCKET] ${role} connected:`, socketRef.current.id);
            setConnectionStatus("Live ✔");
            setIsConnected(true);

            // 5) Flush queued updates when the socket reconnects
            flushQueue();
        });

        // 1) Handles connect_error, disconnect, and error events
        socketRef.current.on("connect_error", (err) => {
            console.warn(`[SOCKET] ${role} connect_error:`, err.message);
            // setConnectionStatus("Socket Error ❌"); // Don't show error immediately to user, let it retry
            setIsConnected(false);
        });

        socketRef.current.on("error", (err) => {
            console.error(`[SOCKET] ${role} error:`, err);
            setIsConnected(false);
        });

        socketRef.current.on("disconnect", (reason) => {
            console.log(`[SOCKET] ${role} disconnected:`, reason);
            setConnectionStatus("Disconnected ⚠️");
            setIsConnected(false);

            // 1) Prevents unhandled socket exceptions & Handles Render sleep reconnects
            if (reason === "io server disconnect") {
                // the disconnection was initiated by the server, you need to reconnect manually
                socketRef.current.connect();
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

    const flushQueue = () => {
        if (locationQueue.current.length > 0 && socketRef.current?.connected) {
            console.log(`[SOCKET] Flushing ${locationQueue.current.length} queued updates...`);
            while (locationQueue.current.length > 0) {
                const data = locationQueue.current.shift();
                socketRef.current.emit("driver-location-update", data);
            }
        }
    };

    const joinBus = (busId) => {
        if (socketRef.current && busId) {
            socketRef.current.emit("join-bus", busId);
            console.log(`[SOCKET] Emitted join-bus for ${busId}`);
        }
    };

    const joinAdmin = () => {
        if (socketRef.current) {
            socketRef.current.emit("join-admin");
            console.log(`[SOCKET] Emitted join-admin`);
        }
    };

    const emitLocation = (data) => {
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
    };

    const onLocationUpdate = (callback) => {
        if (socketRef.current) {
            socketRef.current.on("trip-location", callback);
            return () => {
                if (socketRef.current) {
                    socketRef.current.off("trip-location", callback);
                }
            };
        }
    };

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
