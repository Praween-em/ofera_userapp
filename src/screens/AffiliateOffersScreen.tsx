import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Linking,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import { wrapAffiliateLink } from '../utils/affiliate';
import { useAuth } from '../context/AuthContext';

const AffiliateOffersScreen = ({ route, navigation }: any) => {
    const { storeId, storeName, storeSlug } = route.params;
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        fetchStoreDetails();
    }, [storeId]);

    const fetchStoreDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/affiliate/stores/${storeId}`);
            setStore(response.data);
        } catch (error) {
            console.error('Fetch store details error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShopNow = async () => {
        const userId = user?.id || user?.userId;
        if (store?.affiliate_url && userId) {
            const wrappedUrl = wrapAffiliateLink(store.affiliate_url, userId);
            try {
                await Linking.openURL(wrappedUrl);
                // Track click
                api.post(`/affiliate/stores/${storeId}/click`).catch(() => { });
            } catch (err) {
                console.error("Failed to open URL:", wrappedUrl, err);
            }
        } else {
            console.log("Cannot shop: Missing URL or User ID", { url: store?.affiliate_url, userId });
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={store?.brand_color || '#3F51B5'} />
                    <Text style={styles.loadingText}>Loading store details...</Text>
                </View>
            </View>
        );
    }

    if (!store) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="store-off" size={64} color="#DDD" />
                    <Text style={styles.emptyText}>Store not found</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: store.brand_color || '#3F51B5' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <MaterialCommunityIcons name={store.icon_name || 'shopping'} size={28} color="#FFF" />
                    <Text style={styles.headerTitle}>{store.name}</Text>
                </View>
                <View style={styles.placeholder} />
            </View>

            {/* Store Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Store Logo */}
                <View style={styles.logoContainer}>
                    {store.logo_url && !imageError ? (
                        <Image
                            source={{ uri: store.logo_url }}
                            style={styles.storeLogo}
                            resizeMode="contain"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <View style={[styles.fallbackLogo, { backgroundColor: (store.brand_color || '#3F51B5') + '15' }]}>
                            <Text style={[styles.fallbackLogoText, { color: store.brand_color || '#3F51B5' }]}>
                                {store.name ? store.name.charAt(0).toUpperCase() : '?'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Store Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoHeader}>
                        <MaterialCommunityIcons name="shopping" size={32} color="#444" />
                        <Text style={styles.infoTitle}>Discover the Best Deals!</Text>
                    </View>

                    <Text style={styles.infoDescription}>
                        {store.description || `Shop on ${store.name} and explore the latest products and exclusive collections available directly on their official platform.`}
                    </Text>

                    <View style={styles.benefitsContainer}>
                        <View style={styles.benefitItem}>
                            <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                            <Text style={styles.benefitText}>Official store products</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                            <Text style={styles.benefitText}>Direct brand warranty</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                            <Text style={styles.benefitText}>Secure official payment</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                            <Text style={styles.benefitText}>Best market prices</Text>
                        </View>
                    </View>
                </View>

                {/* How It Works */}
                <View style={styles.howItWorksCard}>
                    <Text style={styles.howItWorksTitle}>How It Works</Text>

                    <View style={styles.stepContainer}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Click "Shop Now & Earn"</Text>
                            <Text style={styles.stepDescription}>You'll be redirected to {store.name}</Text>
                        </View>
                    </View>

                    <View style={styles.stepContainer}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Shop Anything</Text>
                            <Text style={styles.stepDescription}>Buy any product from {store.name}</Text>
                        </View>
                    </View>

                    <View style={styles.stepContainer}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Enjoy Your Purchase</Text>
                            <Text style={styles.stepDescription}>Complete your shopping and receive your standard order confirmation from {store.name}</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Fixed Bottom Button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={[styles.shopButton, { backgroundColor: store.brand_color || '#3F51B5' }]}
                    onPress={handleShopNow}
                >
                    <MaterialCommunityIcons name="shopping" size={24} color="#FFF" />
                    <Text style={styles.shopButtonText}>Shop Now @ {store.name}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    backButton: {
        padding: 8,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
    },
    placeholder: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
        marginTop: 16,
    },
    content: {
        flex: 1,
    },
    logoContainer: {
        padding: 32,
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    storeLogo: {
        width: 150,
        height: 80,
    },
    infoCard: {
        backgroundColor: '#FFF',
        margin: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2D3436',
        flex: 1,
    },
    infoDescription: {
        fontSize: 14,
        color: '#636E72',
        lineHeight: 22,
        marginBottom: 20,
    },
    benefitsContainer: {
        gap: 12,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    benefitText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3436',
    },
    howItWorksCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    howItWorksTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 20,
    },
    stepContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 16,
    },
    stepNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#3F51B5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFF',
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 13,
        color: '#636E72',
    },
    bottomContainer: {
        padding: 16,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F2F6',
    },
    shopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    shopButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFF',
    },
    fallbackLogo: {
        width: 150,
        height: 80,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fallbackLogoText: {
        fontSize: 32,
        fontWeight: '800',
    },
});

export default AffiliateOffersScreen;
