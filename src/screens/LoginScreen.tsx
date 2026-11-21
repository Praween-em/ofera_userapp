
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }: any) => {
    const [phone, setPhone] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { requestOtp } = useAuth();

    const handleLogin = async () => {
        if (!phone || phone.length < 10) {
            Alert.alert('Error', 'Please enter a valid 10-digit phone number');
            return;
        }

        setIsSending(true);
        try {
            await requestOtp(phone);
            navigation.navigate('OTP', { phone });
        } catch (error) {
            Alert.alert('Request Failed', 'Unable to send verification code. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleQuickDemo = async () => {
        setPhone('9999999999');
        setIsSending(true);
        try {
            await requestOtp('9999999999');
            navigation.navigate('OTP', { phone: '9999999999' });
        } catch (error) {
            navigation.navigate('OTP', { phone: '9999999999' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Spot Loot</Text>
                <Text style={styles.subtitle}>Discover Best Deals & Offers</Text>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter mobile (e.g. 9999999999)"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    maxLength={10}
                />
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={isSending}
            >
                {isSending ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Send Verification Code</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.demoButton}
                onPress={handleQuickDemo}
                disabled={isSending}
            >
                <Text style={styles.demoButtonText}>⚡ Quick Demo Login (9999999999)</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'hidden',
    },
    logo: {
        width: 80,
        height: 80,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#3F51B5',
        marginBottom: 5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    button: {
        backgroundColor: '#3F51B5',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    demoButton: {
        backgroundColor: '#E8EAF6',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C5CAE9',
    },
    demoButtonText: {
        color: '#283593',
        fontSize: 14,
        fontWeight: 'bold',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    termsText: {
        marginTop: 20,
        fontSize: 12,
        color: '#B2BEC3',
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: '#3F51B5',
        fontWeight: '700',
    },
});

export default LoginScreen;
