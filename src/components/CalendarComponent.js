import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Calendar } from 'react-native-calendars/src/index';

const CalendarComponent = ({ history = [], onDatePress }) => {
    // Generate marked dates from history
    const markedDates = history.reduce((acc, curr) => {
        let color = '#718096'; // Default color
        if (curr.status === 'PICKED_UP' || curr.status === 'PICKED') color = '#48bb78'; // Green
        if (curr.status === 'DROPPED_OFF' || curr.status === 'DROPPED') color = '#4299e1'; // Blue
        if (curr.status === 'ABSENT') color = '#f56565'; // Red

        acc[curr.date] = {
            marked: true,
            dotColor: color,
            selected: true,
            selectedColor: color + '20', // Light background
            customStyles: {
                container: {
                    backgroundColor: 'white',
                    elevation: 1
                },
                text: {
                    color: '#2d3748',
                    fontWeight: 'bold'
                }
            }
        };
        return acc;
    }, {});

    return (
        <View style={styles.container}>
            <Calendar
                theme={{
                    backgroundColor: '#ffffff',
                    calendarBackground: '#ffffff',
                    textSectionTitleColor: '#b6c1cd',
                    selectedDayBackgroundColor: '#4c51bf',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#4c51bf',
                    dayTextColor: '#2d4150',
                    textDisabledColor: '#d9e1e8',
                    dotColor: '#4c51bf',
                    selectedDotColor: '#ffffff',
                    arrowColor: '#4c51bf',
                    monthTextColor: '#4c51bf',
                    indicatorColor: '#4c51bf',
                    textDayFontWeight: '300',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '300',
                    textDayFontSize: 16,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 14
                }}
                markedDates={markedDates}
                onDayPress={(day) => {
                    const selectedData = history.find(h => h.date === day.dateString);
                    onDatePress && onDatePress(day.dateString, selectedData);
                }}
            />
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#48bb78' }]} />
                    <Text style={styles.legendText}>Picked</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#4299e1' }]} />
                    <Text style={styles.legendText}>Dropped</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#f56565' }]} />
                    <Text style={styles.legendText}>Absent</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 10,
        elevation: 4,
        margin: 10
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#edf2f7',
        marginTop: 10
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6
    },
    legendText: {
        fontSize: 12,
        color: '#718096',
        fontWeight: '500'
    }
});

export default CalendarComponent;
