import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Image,
    Alert,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ProfileScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { logout } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/profile');
            setProfile(response.data);
        } catch (error) {
            console.error('Fetch profile error', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: () => logout() }
            ]
        );
    };

    const renderOption = (icon: string, title: string, subtitle: string, onPress: () => void, isDestructive = false) => (
        <TouchableOpacity
            style={[styles.optionCard, isDestructive && styles.destructiveCard]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, isDestructive ? styles.destructiveIconBg : styles.regularIconBg]}>
                <Text style={styles.optionIcon}>{icon}</Text>
            </View>
            <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, isDestructive && styles.destructiveText]}>{title}</Text>
                {subtitle ? <Text style={styles.optionSubtitle}>{subtitle}</Text> : null}
            </View>
            <Text style={styles.arrow}>{isDestructive ? '' : '›'}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3F51B5" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#3F51B5" />

            {/* Header Section */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {profile?.display_name ? profile.display_name.substring(0, 2).toUpperCase() : 'U'}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>{profile?.display_name || 'Guest User'}</Text>
                        <Text style={styles.userEmail}>{profile?.phone || 'No Phone'}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate('EditProfile')}
                >
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Account Section */}
                <Text style={styles.sectionTitle}>Activity</Text>
                {renderOption("🔖", "Saved Offers", "Quick access to deals you liked", () => navigation.navigate('SavedOffers'))}
                {renderOption("🏪", "Favourite Businesses", "Your favorite local stores", () => navigation.navigate('FavouriteBusinesses'))}
                {/* Wallet Option Removed as per request */}

                {/* Preferences Section */}
                <View style={styles.sectionSpacer} />
                <Text style={styles.sectionTitle}>Support & Legal</Text>
                {renderOption("🔒", "Privacy Policy", "", () => Alert.alert("Privacy Policy", "This is a placeholder for Privacy Policy."))}
                {renderOption("📄", "Terms & Conditions", "", () => Alert.alert("Terms & Conditions", "This is a placeholder for Terms & Conditions."))}

                {/* Merchant CTA */}
                <View style={styles.sectionSpacer} />

                {/* Logout Section */}
                <View style={styles.sectionSpacer} />
                {renderOption("🚪", "Logout", "Sign out of your account", handleLogout, true)}
                <TouchableOpacity
                    style={styles.merchantCTA}
                    onPress={() => Alert.alert("Merchant Program", "Apply to become a merchant and post your own offers!")}
                >
                    <View style={styles.merchantIconBg}>
                        <Text style={styles.merchantIcon}>🏪</Text>
                    </View>
                    <View style={styles.merchantContent}>
                        <Text style={styles.merchantTitle}>Become a Merchant</Text>
                        <Text style={styles.merchantSubtitle}>Grow your business with OfferMarket</Text>
                    </View>
                    <View style={styles.merchantBadge}>
                        <Text style={styles.merchantBadgeText}>JOIN</Text>
                    </View>
                </TouchableOpacity>

                <Text style={styles.versionText}>App Version 1.0.0</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F8FA',
    },
    header: {
        backgroundColor: '#3F51B5',
        paddingHorizontal: 20,
        paddingBottom: 30,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 4,
        shadowColor: '#3F51B5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#3F51B5',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
    },
    userEmail: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    editButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    editButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 13,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#888',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionSpacer: {
        height: 3,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    destructiveCard: {
        backgroundColor: '#FFF0F0',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    regularIconBg: {
        backgroundColor: '#F0F2FF',
    },
    destructiveIconBg: {
        backgroundColor: '#FFE5E5',
    },
    optionIcon: {
        fontSize: 20,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    destructiveText: {
        color: '#FF3B30',
    },
    optionSubtitle: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    arrow: {
        fontSize: 20,
        color: '#CCC',
        fontWeight: 'bold',
    },
    versionText: {
        textAlign: 'center',
        marginTop: 30,
        color: '#CCC',
        fontSize: 12,
        marginBottom: 20,
    },
    merchantCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A237E',
        padding: 20,
        marginTop: 50,
        borderRadius: 20,
        shadowColor: '#1A237E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    merchantIconBg: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    merchantIcon: {
        fontSize: 24,
    },
    merchantContent: {
        flex: 1,
    },
    merchantTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    merchantSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    merchantBadge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    merchantBadgeText: {
        color: '#1A237E',
        fontSize: 11,
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
