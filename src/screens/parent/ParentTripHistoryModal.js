import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

const ParentTripHistoryModal = ({ visible, tripData, onClose }) => {
    if (!tripData) return null;

    const DetailItem = ({ icon, label, value, color = "#4c51bf" }) => (
        <View style={styles.detailItem}>
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value || 'N/A'}</Text>
            </View>
        </View>
    );

    const trip = tripData.tripId || {};
    const duration = tripData.pickupTime && tripData.dropTime
        ? moment.duration(moment(tripData.dropTime).diff(moment(tripData.pickupTime))).asMinutes()
        : null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Journey Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#718096" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.statusSection}>
                            <View style={[styles.statusIndicator, { backgroundColor: tripData.status === 'DROPPED' ? '#4299e1' : '#48bb78' }]} />
                            <Text style={styles.statusText}>{tripData.status === 'DROPPED' ? 'Successfully Dropped' : 'Picked Up'}</Text>
                            <Text style={styles.dateText}>{moment(tripData.date).format("MMMM DD, YYYY")}</Text>
                        </View>

                        <View style={styles.infoGrid}>
                            <DetailItem icon="person" label="Driver" value={trip.driverId?.name} />
                            <DetailItem icon="bus" label="Bus Number" value={trip.busId?.busNumber} color="#38a169" />
                            <DetailItem icon="trail-sign" label="Route" value={trip.routeId?.name} color="#d69e2e" />
                            {duration && <DetailItem icon="time" label="Duration" value={`${Math.round(duration)} mins`} color="#e53e3e" />}
                        </View>

                        <Text style={styles.sectionTitle}>Timeline</Text>
                        <View style={styles.timeline}>
                            <View style={styles.timelineItem}>
                                <View style={styles.dot} />
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timeLabel}>Pickup Time</Text>
                                    <Text style={styles.timeValue}>{tripData.pickupTime ? moment(tripData.pickupTime).format("hh:mm A") : '--:--'}</Text>
                                </View>
                            </View>
                            <View style={[styles.line, { backgroundColor: tripData.dropTime ? '#4c51bf' : '#e2e8f0' }]} />
                            <View style={styles.timelineItem}>
                                <View style={[styles.dot, { backgroundColor: tripData.dropTime ? '#4c51bf' : '#cbd5e0' }]} />
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timeLabel}>Drop Time</Text>
                                    <Text style={styles.timeValue}>{tripData.dropTime ? moment(tripData.dropTime).format("hh:mm A") : 'Pending'}</Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                        <Text style={styles.doneText}>Close Details</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    content: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, height: '75%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1a365d' },
    closeBtn: { padding: 5 },
    statusSection: { alignItems: 'center', marginBottom: 25, padding: 20, backgroundColor: '#f7fafc', borderRadius: 20 },
    statusIndicator: { width: 12, height: 12, borderRadius: 6, marginBottom: 8 },
    statusText: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
    dateText: { fontSize: 13, color: '#718096', marginTop: 4 },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 25 },
    detailItem: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#edf2f7' },
    iconBox: { padding: 8, borderRadius: 10 },
    detailLabel: { fontSize: 10, color: '#a0aec0', fontWeight: 'bold', textTransform: 'uppercase' },
    detailValue: { fontSize: 14, fontWeight: 'bold', color: '#4a5568' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2d3748', marginBottom: 15 },
    timeline: { paddingLeft: 10 },
    timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4c51bf' },
    timelineContent: { flex: 1 },
    timeLabel: { fontSize: 12, color: '#718096' },
    timeValue: { fontSize: 16, fontWeight: 'bold', color: '#2d3748' },
    line: { width: 2, height: 40, marginLeft: 4, marginVertical: 4 },
    doneBtn: { backgroundColor: '#4c51bf', padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 10 },
    doneText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default ParentTripHistoryModal;
