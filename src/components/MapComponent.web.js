import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MapComponent = ({
    busLocation,
    busDetails,
    connectionStatus,
    lastUpdated,
    speed,
    mode,
    buses = []
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.webPlaceholder}>
                <Ionicons name="map" size={64} color="#FC8019" />
                <Text style={styles.title}>Live Tracking Web View</Text>
                <Text style={styles.subtitle}>
                    {buses.length > 0 ? `Monitoring ${buses.length} Active Buses` :
                        (busLocation ? `Tracking Bus: ${busDetails?.busNumber || 'Live'}` : 'Map Preview')}
                </Text>

                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{speed || 0} km/h</Text>
                        <Text style={styles.statLabel}>Speed</Text>
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{connectionStatus || 'Connected'}</Text>
                        <Text style={styles.statLabel}>Status</Text>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        📦 Map view is optimized for Mobile (Android/iOS).
                    </Text>
                    <Text style={styles.infoText}>
                        Current Mode: {mode || 'MORNING'}
                    </Text>
                    <Text style={styles.infoSubtitle}>
                        Last GPS Heartbeat: {lastUpdated || 'Waiting...'}
                    </Text>
                </View>

                {busLocation && (
                    <Text style={styles.coordText}>
                        Lat: {busLocation.latitude.toFixed(4)}, Lng: {busLocation.longitude.toFixed(4)}
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    webPlaceholder: {
        backgroundColor: 'white',
        padding: 40,
        borderRadius: 32,
        alignItems: 'center',
        width: '90%',
        maxWidth: 500,
        elevation: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a365d',
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        color: '#718096',
        marginTop: 8,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 30,
        backgroundColor: '#f8fafc',
        padding: 20,
        borderRadius: 20,
        width: '100%',
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FC8019',
    },
    statLabel: {
        fontSize: 12,
        color: '#a0aec0',
        marginTop: 4,
    },
    separator: {
        width: 1,
        backgroundColor: '#e2e8f0',
        height: '100%',
    },
    infoBox: {
        marginTop: 30,
        width: '100%',
    },
    infoText: {
        fontSize: 14,
        color: '#4a5568',
        marginBottom: 8,
    },
    infoSubtitle: {
        fontSize: 12,
        color: '#718096',
        fontStyle: 'italic',
        marginTop: 10,
    },
    coordText: {
        marginTop: 20,
        fontSize: 11,
        color: '#cbd5e0',
        fontFamily: 'monospace',
    }
});

export default MapComponent;
