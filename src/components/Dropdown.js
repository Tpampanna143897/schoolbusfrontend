import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const Dropdown = ({ label, selectedValue, onValueChange, items, error, placeholder }) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.pickerContainer, error && styles.errorBorder]}>
                <Picker
                    selectedValue={selectedValue}
                    onValueChange={onValueChange}
                    style={styles.picker}
                >
                    {placeholder && <Picker.Item label={placeholder} value="" color="#a0aec0" />}
                    {items.map((item) => (
                        <Picker.Item key={item.id} label={item.label} value={item.id} />
                    ))}
                </Picker>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4a5568',
        marginBottom: 6,
    },
    pickerContainer: {
        backgroundColor: '#f7fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        width: '100%',
    },
    errorBorder: {
        borderColor: '#e53e3e',
    },
    errorText: {
        color: '#e53e3e',
        fontSize: 12,
        marginTop: 4,
    },
});

export default Dropdown;
