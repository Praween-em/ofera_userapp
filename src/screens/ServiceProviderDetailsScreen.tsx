import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    Linking,
    Platform,
    Share,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';
import VerificationBadge from '../components/VerificationBadge';
import { useLanguage } from '../context/LanguageContext';
import { COLORS } from '../utils/theme';

const { width } = Dimensions.get('window');

const ServiceProviderDetailsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { t, translateData } = useLanguage();
    const { providerId } = route.params;

    const [provider, setProvider] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProviderDetails();
    }, [providerId]);

    const fetchProviderDetails = async () => {
        try {
            const response = await api.get(`/services/providers/${providerId}`);
            setProvider(response.data);
        } catch (error) {
            console.error('Fetch provider details error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCall = () => {
        if (provider?.phone_number) {
            Linking.openURL(`tel:${provider.phone_number}`);
        }
    };

    const handleWhatsApp = () => {
        if (provider?.whatsapp_number) {
            Linking.openURL(`whatsapp://send?phone=${provider.whatsapp_number}&text=${t('whatsappMessage')}`);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${provider?.display_name} on ${t('appName')}! Service: ${translateData(provider?.service_categories?.name)}`,
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <MaterialCommunityIcons name="circle-outline" size={40} color={COLORS.primary} />
            </View>
        );
    }

    if (!provider) {
        return (
            <View style={styles.errorContainer}>
                <Text>{t('noProviders')}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero / Portfolio Section */}
                <View style={styles.heroContainer}>
                    <Image
                        source={{ uri: provider.users?.profile_picture || 'https://via.placeholder.com/400' }}
                        style={[
                            styles.heroImage,
                            provider.is_verified ? styles.verifiedHeroBorder : styles.unverifiedHeroBorder
                        ]}
                    />
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.roundBtn} onPress={() => navigation.goBack()}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.roundBtn} onPress={handleShare}>
                            <MaterialCommunityIcons name="share-variant" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{translateData(provider.service_categories?.name)}</Text>
                    </View>
                    <View style={styles.detailBadgeOverlay}>
                        <VerificationBadge isVerified={provider.is_verified} size="large" />
                    </View>
                </View>

                <View style={styles.content}>
                    {/* Header Info */}
                    <View style={styles.mainInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.displayName}>{provider.display_name}</Text>
                        </View>
                        <View style={styles.ratingRow}>
                            <MaterialCommunityIcons name="star" size={16} color="#FFA502" />
                            <Text style={styles.ratingText}>4.8 (120 reviews)</Text>
                            <View style={styles.dot} />
                            <Text style={styles.experienceText}>{provider.experience_years} {t('yearsExp')}</Text>
                        </View>
                    </View>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.primary} />
                            <Text style={styles.statLabel}>{t('serviceArea')}</Text>
                            <Text style={styles.statValue}>{provider.service_area || 'Not specified'}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <MaterialCommunityIcons name="currency-inr" size={20} color="#27AE60" />
                            <Text style={styles.statLabel}>{t('startsFrom')}</Text>
                            <Text style={styles.statValue}>₹{Number(provider.starting_price || 0)}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.info} />
                            <Text style={styles.statLabel}>{t('responseTime')}</Text>
                            <Text style={styles.statValue}>&lt; 15 mins</Text>
                        </View>
                    </View>

                    {/* Bio Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('about')}</Text>
                        <Text style={styles.bioText}>{provider.bio || 'No bio provided.'}</Text>
                    </View>

                    {/* Portfolio Preview */}
                    {provider.service_portfolios?.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('recentWork')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioList}>
                                {provider.service_portfolios.map((item: any, index: number) => (
                                    <Image
                                        key={index}
                                        source={{ uri: item.image_url }}
                                        style={styles.portfolioImage}
                                    />
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Individual Services */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('servicesPricing')}</Text>
                        {provider.services?.map((svc: any, index: number) => (
                            <View key={index} style={styles.serviceItem}>
                                <View style={styles.serviceInfo}>
                                    <Text style={styles.serviceTitle}>{translateData(svc.title)}</Text>
                                    <Text style={styles.serviceDesc} numberOfLines={2}>{translateData(svc.description)}</Text>
                                </View>
                                <View style={styles.servicePriceContainer}>
                                    <Text style={styles.servicePrice}>₹{Number(svc.price)}</Text>
                                    <Text style={styles.serviceUnit}>/{svc.price_unit}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Sticky Action Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={handleCall}>
                    <MaterialCommunityIcons name="phone" size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>{t('callNow')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.waBtn]} onPress={handleWhatsApp}>
                    <MaterialCommunityIcons name="whatsapp" size={22} color="#FFF" />
                    <Text style={styles.actionBtnText}>{t('whatsapp')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroContainer: {
        height: 300,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    headerActions: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    roundBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    categoryBadge: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.surface,
    },
    categoryBadgeText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    content: {
        flex: 1,
        backgroundColor: '#FFF',
        marginTop: -20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    mainInfo: {
        marginBottom: 20,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailBadgeOverlay: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 10,
    },
    verifiedHeroBorder: {
        borderBottomWidth: 4,
        borderBottomColor: '#1E90FF',
    },
    unverifiedHeroBorder: {
        borderBottomWidth: 4,
        borderBottomColor: '#FF4757', // Red for unverified
    },
    displayName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#2D3436',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D3436',
        marginLeft: 4,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
        marginHorizontal: 10,
    },
    experienceText: {
        fontSize: 14,
        color: '#636E72',
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 10,
        color: '#999',
        fontWeight: '700',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 12,
        fontWeight: '800',
        color: '#2D3436',
        marginTop: 2,
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 12,
    },
    bioText: {
        fontSize: 15,
        color: '#636E72',
        lineHeight: 22,
    },
    portfolioList: {
        flexDirection: 'row',
    },
    portfolioImage: {
        width: 140,
        height: 140,
        borderRadius: 12,
        marginRight: 12,
        backgroundColor: '#F3F4F6',
    },
    serviceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F1F1',
    },
    serviceInfo: {
        flex: 1,
        marginRight: 16,
    },
    serviceTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 4,
    },
    serviceDesc: {
        fontSize: 13,
        color: '#999',
        lineHeight: 18,
    },
    servicePriceContainer: {
        alignItems: 'flex-end',
    },
    servicePrice: {
        fontSize: 18,
        fontWeight: '900',
        color: '#27AE60',
    },
    serviceUnit: {
        fontSize: 11,
        color: '#999',
        fontWeight: '700',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F1F1',
    },
    actionBtn: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    callBtn: {
        backgroundColor: COLORS.primary,
    },
    waBtn: {
        backgroundColor: '#25D366',
    },
    actionBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
});

export default ServiceProviderDetailsScreen;
