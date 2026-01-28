import React, { useRef, useEffect, useState, useMemo, memo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Image } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, AnimatedRegion } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

import { decodePolyline } from '../utils/polyline';

const MapComponent = ({
    busLocation,
    busDetails,
    routeCoordinates = [],
    polyline = '',
    speed = 0,
    heading = 0,
    isDriver = false,
    connectionStatus = 'Connected',
    lastUpdated = '',
    onCenterPress,
}) => {
    const mapRef = useRef(null);
    const [followsBus, setFollowsBus] = useState(true);

    // Memoize Polyline Decoding
    const decodedCoords = useMemo(() => {
        return polyline ? decodePolyline(polyline) : [];
    }, [polyline]);

    // Safety check for polyline coordinates - Memoized for performance
    const validRouteCoords = useMemo(() => {
        const combined = [...decodedCoords, ...routeCoordinates];
        return combined.filter(c => c && typeof c.latitude === 'number' && typeof c.longitude === 'number');
    }, [decodedCoords, routeCoordinates]);

    // Smooth Animated Coordinate state
    const [animatedCoordinate] = useState(new AnimatedRegion({
        latitude: busLocation?.latitude || 12.9716,
        longitude: busLocation?.longitude || 77.5946,
        latitudeDelta: 0,
        longitudeDelta: 0,
    }));

    useEffect(() => {
        if (busLocation && typeof busLocation.latitude === 'number' && typeof busLocation.longitude === 'number') {
            // Animate marker to new position
            animatedCoordinate.timing({
                latitude: busLocation.latitude,
                longitude: busLocation.longitude,
                duration: 1000,
                useNativeDriver: false // AnimatedRegion doesn't support native driver
            }).start();

            // Animate camera if following
            if (followsBus) {
                mapRef.current?.animateCamera({
                    center: {
                        latitude: busLocation.latitude,
                        longitude: busLocation.longitude,
                    },
                    zoom: 17,
                }, { duration: 1000 });
            }
        }
    }, [busLocation, followsBus]);

    // ... handleZoom logic (unchanged)

    const handleZoomIn = () => {
        mapRef.current?.getCamera().then(camera => {
            mapRef.current?.animateCamera({ zoom: camera.zoom + 1 });
        });
    };

    const handleZoomOut = () => {
        mapRef.current?.getCamera().then(camera => {
            mapRef.current?.animateCamera({ zoom: camera.zoom - 1 });
        });
    };

    const handleToggleFollow = () => {
        setFollowsBus(!followsBus);
        if (!followsBus && busLocation) {
            mapRef.current?.animateCamera({
                center: {
                    latitude: busLocation.latitude,
                    longitude: busLocation.longitude,
                },
                zoom: 17,
            }, { duration: 500 });
        }
    };

    const initialRegion = {
        latitude: busLocation?.latitude || 12.9716,
        longitude: busLocation?.longitude || 77.5946,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={initialRegion}
                onTouchStart={() => setFollowsBus(false)}
                showsUserLocation={isDriver}
                followsUserLocation={isDriver && followsBus}
                showsMyLocationButton={false}
                showsCompass={true}
                rotateEnabled={true}
                toolbarEnabled={false}
            >
                {/* Route Polyline */}
                {validRouteCoords.length > 0 && (
                    <Polyline
                        coordinates={validRouteCoords}
                        strokeColor="#4c51bf"
                        strokeWidth={4}
                    />
                )}

                {/* Bus Marker */}
                <Marker.Animated
                    coordinate={animatedCoordinate}
                    title={busDetails?.busNumber || "School Bus"}
                    flat
                    anchor={{ x: 0.5, y: 0.5 }}
                    rotation={heading}
                >
                    <View style={styles.markerContainer}>
                        <Image
                            source={{ uri: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png" }}
                            style={styles.busIcon}
                        />
                    </View>
                </Marker.Animated>
            </MapView>

            {/* UI Overlays */}

            {/* Speedometer */}
            <View style={styles.speedometerContainer}>
                <View style={styles.speedCircle}>
                    <Text style={styles.speedValue}>{speed}</Text>
                    <Text style={styles.speedUnit}>km/h</Text>
                </View>
            </View>

            {/* Connection Status */}
            <View style={[
                styles.toast,
                { backgroundColor: connectionStatus.includes("Error") ? "rgba(229, 62, 62, 0.9)" : "rgba(72, 187, 120, 0.9)" }
            ]}>
                <Text style={styles.toastText}>{connectionStatus}</Text>
                {lastUpdated ? <Text style={styles.lastUpdatedText}>{lastUpdated}</Text> : null}
            </View>

            {/* Map Controls */}
            <View style={styles.controlsContainer}>
                <TouchableOpacity style={styles.controlBtn} onPress={handleZoomIn}>
                    <Ionicons name="add" size={24} color="#2d3748" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlBtn} onPress={handleZoomOut}>
                    <Ionicons name="remove" size={24} color="#2d3748" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.controlBtn, followsBus && styles.activeControlBtn]}
                    onPress={handleToggleFollow}
                >
                    <Ionicons name="locate" size={24} color={followsBus ? "white" : "#2d3748"} />
                </TouchableOpacity>
            </View>

            {isDriver && (
                <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>LIVE TRANSMISSION</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
    },
    markerContainer: {
        backgroundColor: "white",
        padding: 5,
        borderRadius: 20,
        elevation: 5,
        shadowColor: "black",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 }
    },
    busIcon: {
        width: 36,
        height: 36,
        resizeMode: "contain"
    },
    speedometerContainer: {
        position: 'absolute',
        top: 60,
        right: 20,
        alignItems: 'center'
    },
    speedCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        borderWidth: 3,
        borderColor: '#48bb78'
    },
    speedValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2d3748'
    },
    speedUnit: {
        fontSize: 10,
        color: '#718096',
        fontWeight: 'bold'
    },
    toast: {
        position: 'absolute',
        top: 20,
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
        flexDirection: 'row',
    },
    toastText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12
    },
    lastUpdatedText: {
        color: '#e2e8f0',
        fontSize: 10,
        marginLeft: 8
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        gap: 10,
    },
    controlBtn: {
        backgroundColor: 'white',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 }
    },
    activeControlBtn: {
        backgroundColor: '#4c51bf',
    },
    liveBadge: {
        position: 'absolute',
        top: 140,
        right: 20,
        backgroundColor: 'rgba(255,0,0,0.8)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    liveBadgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold'
    }
});

export default memo(MapComponent);
