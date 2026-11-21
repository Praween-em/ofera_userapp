import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Image,
    Dimensions,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import { getServiceIcon } from '../utils/serviceIcons';
import VerificationBadge from '../components/VerificationBadge';
import { useLanguage } from '../context/LanguageContext';
import { COLORS } from '../utils/theme';
import { LocationService } from '../services/LocationService';

const { width } = Dimensions.get('window');

const ServicesSearchScreen = ({ navigation, route }: any) => {
    const initialQuery = route.params?.initialQuery || '';
    const insets = useSafeAreaInsets();
    const { t, translateData } = useLanguage();
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

    useEffect(() => {
        detectUserLocation();
        fetchCategories();
    }, []);

    const detectUserLocation = async () => {
        try {
            const loc = await LocationService.getCurrentLocation();
            if (loc) {
                setUserLocation({ latitude: loc.latitude, longitude: loc.longitude });
            }
        } catch (error) {
            console.warn('Could not detect user location for search:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        // Debounce or just call? For now call, but declarative is better
        fetchProviders(searchQuery, selectedCategory);
    }, [searchQuery, selectedCategory, userLocation]);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/services/categories');
            setCategories(response.data || []);
        } catch (error) {
            console.error('Fetch service categories error:', error);
        }
    };

    const fetchProviders = async (query = '', catId = selectedCategory) => {
        setLoading(true);
        try {
            let url = '/services/providers';
            const params: string[] = [];
            if (catId) params.push(`categoryId=${catId}`);
            if (query) params.push(`search=${query}`);
            if (userLocation) {
                params.push(`lat=${userLocation.latitude}`);
                params.push(`lng=${userLocation.longitude}`);
            }

            if (params.length > 0) {
                url += `?${params.join('&')}`;
            }

            const response = await api.get(url);
            const sortedData = (response.data || []).sort((a: any, b: any) => {
                if (a.is_verified && !b.is_verified) return -1;
                if (!a.is_verified && b.is_verified) return 1;
                return 0;
            });
            setProviders(sortedData);
        } catch (error) {
            console.error('Fetch providers search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (text.trim().length > 0 && selectedCategory !== null) {
            setSelectedCategory(null);
        }
    };

    const handleCategoryPress = (catId: string) => {
        const isDeselecting = selectedCategory === catId;
        const newCat = isDeselecting ? null : catId;

        // If selecting a NEW category, clear the search query
        if (!isDeselecting && searchQuery.length > 0) {
            setSearchQuery('');
        }

        setSelectedCategory(newCat);
    };

    const renderProviderCard = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.providerCard}
            onPress={() => navigation.navigate('ServiceProviderDetails', { providerId: item.id })}
        >
            <View style={styles.providerHeader}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: item.users?.profile_picture || 'https://via.placeholder.com/60' }}
                        style={[
                            styles.providerAvatar,
                            item.is_verified ? styles.verifiedAvatarRing : styles.unverifiedAvatarRing
                        ]}
                    />
                    <View style={styles.badgeOverlay}>
                        <VerificationBadge isVerified={item.is_verified} size="small" />
                    </View>
                </View>
                <View style={styles.providerInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.providerName} numberOfLines={1}>{item.display_name}</Text>
                    </View>
                    <Text style={styles.providerCategory}>{translateData(item.service_categories?.name)}</Text>
                    <View style={styles.ratingRow}>
                        <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
                        <Text style={styles.ratingText}>{item.rating || '4.5'} (24 reviews)</Text>
                        {item.distance_km !== undefined && item.distance_km !== null && (
                            <View style={styles.distanceTag}>
                                <MaterialCommunityIcons name="navigation" size={12} color={COLORS.secondary} />
                                <Text style={styles.distanceText}>{item.distance_km} km</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>{t('startsFrom')}</Text>
                    <Text style={styles.priceValue}>₹{item.starting_price}</Text>
                </View>
            </View>
            <View style={styles.providerFooter}>
                <View style={styles.tag}>
                    <MaterialCommunityIcons name="briefcase-outline" size={12} color="#636E72" />
                    <Text style={styles.tagText}>{item.experience_years || '5'}+ {t('yearsExp')}</Text>
                </View>
                <View style={styles.tag}>
                    <MaterialCommunityIcons name="map-marker-outline" size={12} color="#636E72" />
                    <Text style={styles.tagText}>{item.service_area || 'Kalyan Nagar'}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Search Header */}
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('searchTitle')}</Text>
                </View>

                <View style={styles.searchContainer}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#B2BEC3" />
                    <TextInput
                        placeholder={t('searchPlaceholder')}
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={handleSearch}
                        autoFocus
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <MaterialCommunityIcons name="close-circle" size={18} color="#B2BEC3" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Categories */}
            <View style={styles.categoriesContainer}>
                <FlatList
                    data={categories}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesList}
                    keyExtractor={(item) => `search-cat-${item.id}`}
                    renderItem={({ item }) => {
                        const isActive = selectedCategory === item.id;
                        return (
                            <TouchableOpacity
                                style={[
                                    styles.categoryPill,
                                    isActive && styles.activeCategoryPill
                                ]}
                                onPress={() => handleCategoryPress(item.id)}
                            >
                                {getServiceIcon(item.name) ? (
                                    <Image
                                        source={getServiceIcon(item.name)}
                                        style={styles.searchCatIcon}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <MaterialCommunityIcons
                                        name={item.icon || 'circle-outline'}
                                        size={24}
                                        color={isActive ? '#FFF' : COLORS.primary}
                                        style={{ marginBottom: 4 }}
                                    />
                                )}
                                <Text style={[
                                    styles.categoryText,
                                    isActive && styles.activeCategoryText
                                ]} numberOfLines={1}>
                                    {translateData(item.name)}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Results */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#FF4757" />
                </View>
            ) : providers.length === 0 ? (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="account-search-outline" size={80} color="#F1F2F6" />
                    <Text style={styles.emptyTitle}>{t('noProviders')}</Text>
                    <Text style={styles.emptySubtitle}>{t('tryElse')}</Text>
                </View>
            ) : (
                <FlatList
                    data={providers}
                    renderItem={renderProviderCard}
                    keyExtractor={(item) => `search-res-${item.id}`}
                    contentContainerStyle={styles.resultsList}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#FFF',
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2D3436',
    },
    backBtn: {
        padding: 4,
        marginLeft: -4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 45,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#2D3436',
        marginLeft: 8,
        fontWeight: '500',
    },
    categoriesContainer: {
        paddingVertical: 12,
        marginTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F1F1',
    },
    categoriesList: {
        paddingHorizontal: 16,
        gap: 10,
    },
    categoryPill: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: 100,
        height: 110,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        borderWidth: 1.5,
        borderColor: '#F1F2F6',
        padding: 8,
    },
    activeCategoryPill: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        elevation: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#2D3436',
        textAlign: 'center',
        marginTop: 4,
    },
    activeCategoryText: {
        color: '#FFF',
    },
    searchCatIcon: {
        width: 100,
        height: 100,
        borderRadius: 20,
        resizeMode: 'cover',
        overflow: 'hidden',
    },
    resultsList: {
        padding: 16,
        paddingBottom: 40,
    },
    providerCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F2F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    providerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    providerAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F8F9FA',
    },
    providerInfo: {
        flex: 1,
        marginLeft: 20, // Increased gap
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    badgeOverlay: {
        position: 'absolute',
        bottom: -6,
        left: '50%',
        transform: [{ translateX: -30 }], // Half of badge width approx
        zIndex: 10,
    },
    verifiedAvatarRing: {
        borderWidth: 2,
        borderColor: '#1E90FF',
    },
    unverifiedAvatarRing: {
        borderWidth: 2,
        borderColor: '#FF4757', // Red for unverified
    },
    providerName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
    },
    providerCategory: {
        fontSize: 13,
        color: '#636E72',
        marginTop: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        color: '#2D3436',
        fontWeight: '600',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceLabel: {
        fontSize: 10,
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    priceValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#2D3436',
    },
    providerFooter: {
        flexDirection: 'row',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F2F6',
        gap: 12,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    tagText: {
        fontSize: 11,
        color: '#636E72',
        fontWeight: '600',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2D3436',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#636E72',
        marginTop: 4,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    distanceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginLeft: 8,
        backgroundColor: '#F1F9FE',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    distanceText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.secondary,
    },
});

export default ServicesSearchScreen;
