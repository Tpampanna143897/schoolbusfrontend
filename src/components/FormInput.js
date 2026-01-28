import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const FormInput = ({ label, value, onChangeText, placeholder, secureTextEntry, error, keyboardType }) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[styles.input, error && styles.inputError]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                placeholderTextColor="#a0aec0"
            />
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
    input: {
        backgroundColor: '#f7fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#2d3748',
    },
    inputError: {
        borderColor: '#e53e3e',
    },
    errorText: {
        color: '#e53e3e',
        fontSize: 12,
        marginTop: 4,
    },
});

export default FormInput;
