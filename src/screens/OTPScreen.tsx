import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OTPScreen = ({ route, navigation }: any) => {
    const { phone } = route.params;
    const { verifyOtp } = useAuth();
    const insets = useSafeAreaInsets();
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter a 6-digit verification code.');
            return;
        }

        setIsVerifying(true);
        try {
            await verifyOtp(phone, otp);
        } catch (error) {
            Alert.alert('Verification Failed', 'The code you entered is incorrect or has expired. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.content}>
                <Text style={styles.title}>Confirm OTP</Text>
                <Text style={styles.subtitle}>Enter the 6-digit code sent to +91 {phone}</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.input, { letterSpacing: 10 }]}
                        placeholder="000000"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otp}
                        onChangeText={setOtp}
                        autoFocus
                        textAlign="center"
                    />
                </View>

                <TouchableOpacity
                    style={styles.demoFillBtn}
                    onPress={() => setOtp('123456')}
                >
                    <Text style={styles.demoFillText}>⚡ Use Demo OTP: 123456</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleVerify}
                    disabled={isVerifying}
                >
                    {isVerifying ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Verify & Continue</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    backBtn: {
        padding: 20,
    },
    backBtnText: {
        fontSize: 16,
        color: '#3F51B5',
    },
    content: {
        flex: 1,
        padding: 24,
        paddingTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
    },
    inputContainer: {
        marginBottom: 30,
    },
    input: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#3F51B5',
        height: 60,
        borderBottomWidth: 2,
        borderBottomColor: '#3F51B5',
        textAlign: 'center',
    },
    demoFillBtn: {
        backgroundColor: '#E8EAF6',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 10,
        alignSelf: 'center',
    },
    demoFillText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#283593',
    },
    button: {
        backgroundColor: '#3F51B5',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default OTPScreen;
