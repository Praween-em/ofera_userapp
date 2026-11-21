import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const EditProfileScreen = ({ navigation, route }: any) => {
    const insets = useSafeAreaInsets();
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.display_name || '');
    const [image, setImage] = useState<string | null>(user?.profile_picture || null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
        });

        if (result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            uploadImage(asset);
        }
    };

    const uploadImage = async (asset: any) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
                type: asset.type,
                name: asset.fileName || 'profile.jpg',
            } as any);

            const response = await api.post('/bunny/upload?folder=profiles', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setImage(response.data.url);
        } catch (error) {
            console.error('Upload failed', error);
            Alert.alert('Upload Failed', 'Could not upload profile picture.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        setLoading(true);
        try {
            const response = await api.patch('/users/profile', {
                display_name: name,
                profile_picture: image
            });
            Alert.alert('Success', 'Profile updated successfully');
            if (updateUser) await updateUser(response.data);
            navigation.goBack();
        } catch (error) {
            console.error('Update profile error', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="chevron-left" size={28} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#3F51B5" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.avatarSection}>
                    <TouchableOpacity style={styles.avatarPlaceholder} onPress={pickImage} disabled={uploading}>
                        {uploading ? (
                            <ActivityIndicator size="large" color="#3F51B5" />
                        ) : image ? (
                            <Image source={{ uri: image }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarChars}>
                                {name.substring(0, 2).toUpperCase() || 'U'}
                            </Text>
                        )}
                        <View style={styles.editBadge}>
                            <Icon name="camera" size={16} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarLabel}>{uploading ? 'Uploading...' : 'Tap to change photo'}</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Display Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.infoBox}>
                        <Icon name="information-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>
                            Your display name will be visible to businesses when you interact with their offers.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#3F51B5',
        paddingHorizontal: 10,
    },
    content: {
        padding: 24,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 35,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F0F2FF',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatarChars: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#3F51B5',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#3F51B5',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    avatarLabel: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    form: {
        marginTop: 10,
    },
    inputGroup: {
        marginBottom: 25,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F7F8FA',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F0F7FF',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#444',
        lineHeight: 18,
    },
});

export default EditProfileScreen;
