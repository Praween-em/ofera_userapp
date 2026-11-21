import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Dimensions,
    Animated,
    StatusBar,
    FlatList,
    ActivityIndicator,
    Image,
    UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../services/api';
import { getServiceIcon } from '../utils/serviceIcons';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, THEME } from '../utils/theme';
import { LocationService } from '../services/LocationService';
import CategoryRail from '../components/CategoryRail';

const isLinearGradientAvailable = !!UIManager.getViewManagerConfig('BVLinearGradient');
const GradientContainer: any = isLinearGradientAvailable ? LinearGradient : View;

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { language, setLanguage, t, translateData } = useLanguage();
    const [selectedLocation, setSelectedLocation] = useState('Anantapur');
    const [showNotifications, setShowNotifications] = useState(false);
    const slideAnim = useRef(new Animated.Value(width)).current;

    // API State
    const [offers, setOffers] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [affiliateStores, setAffiliateStores] = useState<any[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Filter State
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [selectedOfferType, setSelectedOfferType] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'offers' | 'services'>('offers');

    // Services State
    const [serviceCategories, setServiceCategories] = useState<any[]>([]);
    const [serviceProviders, setServiceProviders] = useState<any[]>([]);
    const [serviceLoading, setServiceLoading] = useState(false);
    const [selectedServiceCategory, setSelectedServiceCategory] = useState<string | null>(null);
    const [topServiceProviders, setTopServiceProviders] = useState<any[]>([]);

    // Image Handling
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

    useEffect(() => {
        detectUserLocation();
        fetchOffers();
        fetchCategories();
        fetchBusinesses();
        fetchAffiliateStores();
        fetchServiceCategories();
        fetchServiceProviders();
        fetchTopServiceProviders();
    }, []);

    const fetchServiceCategories = async () => {
        try {
            const response = await api.get('/services/categories');
            setServiceCategories(response.data || []);
        } catch (error) {
            console.error('Fetch service categories error:', error);
        }
    };

    const fetchTopServiceProviders = async () => {
        try {
            const response = await api.get('/services/providers');
            // Take first 10 for the top section
            setTopServiceProviders(Array.isArray(response.data) ? response.data.slice(0, 10) : []);
        } catch (error) {
            console.error('Fetch top service providers error:', error);
        }
    };

    const fetchServiceProviders = async (categoryId?: string) => {
        setServiceLoading(true);
        try {
            let url = categoryId ? `/services/providers?categoryId=${categoryId}` : '/services/providers';
            if (userLocation) {
                const separator = url.includes('?') ? '&' : '?';
                url += `${separator}lat=${userLocation.latitude}&lng=${userLocation.longitude}`;
            }
            const response = await api.get(url);
            setServiceProviders(response.data || []);
        } catch (error) {
            console.error('Fetch service providers error:', error);
        } finally {
            setServiceLoading(false);
        }
    };

    const fetchAffiliateStores = async () => {
        try {
            const response = await api.get('/affiliate/stores');
            setAffiliateStores(response.data || []);
        } catch (error) {
            console.error('Fetch affiliate stores error:', error);
        }
    };

    const fetchBusinesses = async () => {
        try {
            const response = await api.get('/users/businesses');
            setBusinesses(response.data || []);
        } catch (error) {
            console.error('Fetch businesses error:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            console.log('Fetching categories from:', api.defaults.baseURL + '/categories');
            const response = await api.get('/categories');
            console.log('Categories received:', response.data.length);
            // Take first 10 for home screen preview
            setCategories(Array.isArray(response.data) ? response.data.slice(0, 10) : []);
        } catch (error: any) {
            console.error('Fetch categories error:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
        }
    };

    const fetchOffers = async (nextCursor?: string, categoryId?: string, offerType?: string, search?: string) => {
        if (loading || (!hasMore && nextCursor)) return;

        setLoading(true);
        try {
            // Build Query Parameters
            const params: any = {};
            if (nextCursor) params.cursor = nextCursor;
            if (categoryId || selectedCategoryId) params.categoryId = categoryId || selectedCategoryId;
            if (offerType || selectedOfferType) params.offerType = offerType || selectedOfferType;
            if (search || searchQuery) params.search = search || searchQuery;

            const queryString = Object.keys(params)
                .map(key => `${key}=${encodeURIComponent(params[key])}`)
                .join('&');

            const url = `/offers/feed${queryString ? `?${queryString}` : ''}`;
            console.log('Fetching offers from:', api.defaults.baseURL + url);

            const response = await api.get(url);
            const { data, meta } = response.data;
            console.log('Offers received:', data?.length);

            if (nextCursor) {
                setOffers(prev => [...prev, ...(data || [])]);
            } else {
                setOffers(data || []);
            }

            setCursor(meta?.next_cursor || null);
            setHasMore(!!meta?.has_more);
        } catch (error: any) {
            console.error('Fetch feed error:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterReset = () => {
        setSelectedCategoryId(null);
        setSelectedOfferType(null);
        setSearchQuery('');
        setCursor(null);
        setOffers([]);
        fetchOffers();
    };

    const handleCategoryPress = (catId: string, catName: string) => {
        navigation.navigate('Categories');
    };

    const handleOfferTypePress = (typeId: string, typeName: string) => {
        navigation.navigate('HotDeals', { offerType: typeId, title: typeName });
    };

    const handleServiceCategoryPress = (catId: string) => {
        if (selectedServiceCategory === catId) {
            setSelectedServiceCategory(null);
            fetchServiceProviders();
        } else {
            setSelectedServiceCategory(catId);
            fetchServiceProviders(catId);
        }
    };

    const loadMore = () => {
        if (hasMore && !loading && cursor) {
            fetchOffers(cursor);
        }
    };

    const districts = ['Anantapur', 'Kurnool', 'Chittoor', 'Kadapa', 'Nellore'];
    const discountFilters = ['80%+', '70%+', '60%+', '50%+', '40%+', '30%+', '20%+'];
    const offerTypes = [
        { id: 'bogo', name: language === 'en' ? 'Buy 1 Get 1' : 'ఒకటి కొంటే ఒకటి ఉచితం', icon: '🎁', color: '#FF4757' },
        { id: 'flash', name: language === 'en' ? 'Flash Sale' : 'ఫ్లాష్ సేల్', icon: '⚡', color: '#FFA502' },
        { id: 'flat', name: language === 'en' ? 'Flat Discount' : 'ఫ్లాట్ డిస్కౌంట్', icon: '💰', color: '#2ED573' },
        { id: 'combo', name: language === 'en' ? 'Combo Deals' : 'కాంబో డీల్స్', icon: '🍔', color: '#1E90FF' },
        { id: 'limited', name: language === 'en' ? 'Limited Time' : 'పరిమిత సమయం', icon: '⏰', color: '#747067' },
        { id: 'new', name: language === 'en' ? 'New Arrivals' : 'కొత్త రకాలు', icon: '🔥', color: '#FF6B81' },
    ];



    const detectUserLocation = async () => {
        try {
            const loc = await LocationService.getCurrentLocation();
            if (loc) {
                setUserLocation({ latitude: loc.latitude, longitude: loc.longitude });
            }
        } catch (error) {
            console.warn('Could not detect user location for home screen:', error);
        }
    };

    useEffect(() => {
        if (userLocation) {
            fetchServiceProviders(selectedServiceCategory || undefined);
            fetchTopServiceProviders();
        }
    }, [userLocation]);

    const toggleNotifications = (show: boolean) => {
        setShowNotifications(show);
        Animated.timing(slideAnim, {
            toValue: show ? width * 0.25 : width,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Compact Unified Header */}
            <View style={[styles.denseHeader, { paddingTop: insets.top + 5 }]}>
                <View style={styles.headerTopRow}>
                    <View style={styles.brandingRow}>
                        <Text style={styles.brandName}>{t('appName')}</Text>
                        <View style={styles.brandDot} />
                    </View>

                    <View style={styles.headerRightActions}>
                        <TouchableOpacity
                            style={styles.languageToggle}
                            onPress={() => setLanguage(language === 'en' ? 'te' : 'en')}
                        >
                            <Text style={styles.languageToggleText}>{language === 'en' ? 'తెలుగు' : 'English'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.locationEmbeddedPill} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.primary} />
                            <Text style={styles.locationDenseText} numberOfLines={1}>{selectedLocation}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => toggleNotifications(true)}
                            style={styles.denseNotifBtn}
                        >
                            <MaterialCommunityIcons name="bell-outline" size={20} color={COLORS.text} />
                            <View style={styles.denseNotifBadge} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.searchRow}>
                    <View style={styles.unifiedSearchContainer}>
                        <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textSecondary} style={{ marginLeft: 10 }} />
                        <TextInput
                            style={styles.unifiedSearchInput}
                            placeholder={t('searchPlaceholder')}
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onFocus={() => {
                                if (activeTab === 'services') {
                                    navigation.navigate('ServicesSearch');
                                }
                            }}
                            onSubmitEditing={() => {
                                if (searchQuery.trim()) {
                                    if (activeTab === 'services') {
                                        navigation.navigate('ServicesSearch', { initialQuery: searchQuery });
                                    } else {
                                        navigation.navigate('SearchResults', { search: searchQuery });
                                    }
                                }
                            }}
                            returnKeyType="search"
                        />
                    </View>
                </View>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabSwitcherContainer}>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'offers' && styles.activeTabBtn]}
                    onPress={() => setActiveTab('offers')}
                >
                    <Text style={[styles.tabText, activeTab === 'offers' && styles.activeTabText]}>{t('offers')}</Text>
                    {activeTab === 'offers' && <View style={[styles.tabIndicator, { backgroundColor: COLORS.primary }]} />}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'services' && styles.activeTabBtn]}
                    onPress={() => setActiveTab('services')}
                >
                    <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>{t('searchTitle')}</Text>
                    {activeTab === 'services' && <View style={[styles.tabIndicator, { backgroundColor: COLORS.primary }]} />}
                </TouchableOpacity>
            </View>

            <FlatList
                data={activeTab === 'offers' ? offers : serviceProviders}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                onEndReached={activeTab === 'offers' ? loadMore : null}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={() => (
                    activeTab === 'offers' ? (
                        <>
                            {/* Shops in Location Section */}
                            {businesses.length > 0 && (
                                <View style={styles.compactBrandSection}>
                                    <View style={styles.compactSectionHeader}>
                                        <View style={styles.sectionTitleRow}>
                                            <MaterialCommunityIcons name="store-marker" size={18} color={COLORS.primary} />
                                            <Text style={styles.denseSectionTitle}>{t('home')} {selectedLocation}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => navigation.navigate('Businesses')}>
                                            <Text style={styles.denseViewAll}>See All</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <FlatList
                                        data={businesses}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={styles.miniBrandCard}
                                                onPress={() => navigation.navigate('ShopDetails', { shopId: item.id })}
                                            >
                                                <View style={styles.miniAvatarWrapper}>
                                                    <Image
                                                        source={{ uri: item.logo_url || 'https://via.placeholder.com/80' }}
                                                        style={styles.miniAvatar}
                                                    />
                                                </View>
                                                <Text style={styles.miniBrandName} numberOfLines={1}>{item.business_name}</Text>
                                            </TouchableOpacity>
                                        )}
                                        keyExtractor={(item) => `biz-top-${item.id}`}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.horizontalDensePadding}
                                    />
                                </View>
                            )}

                            {/* Category Rail Section */}
                            <CategoryRail
                                categories={categories}
                                onCategoryPress={handleCategoryPress}
                                onViewAllPress={() => navigation.navigate('Categories')}
                            />

                            {/* Hot Deals (Vertical Cards, Horizontal Scroll) */}
                            <View style={styles.hotDealsSection}>
                                <View style={styles.compactSectionHeader}>
                                    <View style={styles.sectionTitleRow}>
                                        <MaterialCommunityIcons name="fire" size={18} color="#FF4757" />
                                        <Text style={styles.denseSectionTitle}>Hot Deals</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => navigation.navigate('HotDeals')}>
                                        <Text style={styles.denseViewAll}>See All</Text>
                                    </TouchableOpacity>
                                </View>
                                <FlatList
                                    data={[...offers].sort((a, b) => (b._count?.offer_views || 0) - (a._count?.offer_views || 0)).slice(0, 6)}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.horizontalDensePadding}
                                    keyExtractor={(item) => `hot-${item.id}`}
                                    renderItem={({ item }) => {
                                        const ruleType = item.offer_rules?.[0]?.rule_type || 'flat';
                                        const discountValue = item.offer_rules?.[0]?.discount_value;
                                        const conditions = item.offer_rules?.[0]?.conditions;
                                        const originalPrice = conditions?.original_price;
                                        const offerPrice = conditions?.offer_price;
                                        const bName = item.business_branches?.businesses?.business_name || 'Store';

                                        const expDate = new Date(item.end_date);
                                        const dLeft = Math.ceil((expDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                                        return (
                                            <TouchableOpacity
                                                style={styles.verticalDealCard}
                                                onPress={() => navigation.navigate('OfferDetails', { offer: item })}
                                            >
                                                <View style={styles.verticalDealThumbnailWrapper}>
                                                    {item.offer_media && item.offer_media[0] ? (
                                                        <Image source={{ uri: item.offer_media[0].image_url }} style={styles.verticalDealThumbnail} />
                                                    ) : (
                                                        <View style={styles.denseThumbnailPlaceholder} />
                                                    )}
                                                    <View style={styles.verticalDealBadge}>
                                                        <Text style={styles.verticalDealBadgeText}>
                                                            {ruleType === 'percentage' ? `${discountValue}% OFF` : ruleType.toUpperCase()}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={styles.verticalDealContent}>
                                                    <Text style={styles.verticalDealTitle} numberOfLines={2}>{item.title}</Text>
                                                    <View style={styles.verticalDealBusinessRow}>
                                                        <MaterialCommunityIcons name="store" size={10} color="#999" />
                                                        <Text style={styles.verticalDealBrand} numberOfLines={1}>{bName}</Text>
                                                    </View>

                                                    <View style={styles.verticalDealBottomRow}>
                                                        {originalPrice && offerPrice ? (
                                                            <View style={styles.verticalDealPricing}>
                                                                <Text style={styles.verticalDealOldPrice}>₹{originalPrice}</Text>
                                                                <Text style={styles.verticalDealNewPrice}>₹{offerPrice}</Text>
                                                            </View>
                                                        ) : (
                                                            <View style={styles.verticalDealPricing}>
                                                                <Text style={styles.verticalDealNewPrice}>Best Price</Text>
                                                            </View>
                                                        )}

                                                        <View style={styles.verticalDealMetrics}>
                                                            <View style={styles.miniMetric}>
                                                                <MaterialCommunityIcons name="share-variant" size={10} color="#636E72" />
                                                                <Text style={styles.miniMetricText}>{item.offer_metrics?.shares || 0}</Text>
                                                            </View>
                                                            <View style={styles.miniMetric}>
                                                                <MaterialCommunityIcons name="eye-outline" size={10} color="#636E72" />
                                                                <Text style={styles.miniMetricText}>{item.offer_metrics?.views || 0}</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            </View>

                            {/* Filter Type Pills */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsList}>
                                {offerTypes.map((type) => (
                                    <TouchableOpacity
                                        key={type.id}
                                        style={[styles.filterPill, selectedOfferType === type.id && styles.filterPillActive]}
                                        onPress={() => handleOfferTypePress(type.id, type.name)}
                                    >
                                        <Text style={styles.filterPillIcon}>{type.icon}</Text>
                                        <Text style={[styles.filterPillText, selectedOfferType === type.id && styles.filterPillTextActive]}>{type.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.feedHeaderRow}>
                                <MaterialCommunityIcons name="lightning-bolt" size={18} color="#FF4757" />
                                <Text style={styles.feedTitleText}>Deals Near You</Text>
                                <View style={styles.feedTitleLine} />
                            </View>
                        </>
                    ) : (
                        <>
                            {/* Top Service Providers Section */}
                            {topServiceProviders.length > 0 && (
                                <View style={styles.compactBrandSection}>
                                    <View style={styles.compactSectionHeader}>
                                        <View style={styles.sectionTitleRow}>
                                            <MaterialCommunityIcons name="account-star" size={18} color={COLORS.primary} />
                                            <Text style={styles.denseSectionTitle}>{t('appName')} Top Experts</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => navigation.navigate('ServicesSearch')}>
                                            <Text style={styles.denseViewAll}>See All</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <FlatList
                                        data={topServiceProviders}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={styles.miniBrandCard}
                                                onPress={() => navigation.navigate('ServiceProviderDetails', { providerId: item.id })}
                                            >
                                                <View style={styles.miniAvatarWrapper}>
                                                    <Image
                                                        source={{ uri: item.users?.profile_picture || 'https://via.placeholder.com/80' }}
                                                        style={styles.miniAvatar}
                                                    />
                                                    {item.is_verified && (
                                                        <View style={{
                                                            position: 'absolute',
                                                            bottom: 0,
                                                            right: 0,
                                                            backgroundColor: '#FFF',
                                                            borderRadius: 10,
                                                            padding: 1,
                                                            elevation: 2,
                                                            shadowColor: '#000',
                                                            shadowOffset: { width: 0, height: 1 },
                                                            shadowOpacity: 0.1,
                                                            shadowRadius: 1,
                                                        }}>
                                                            <MaterialCommunityIcons name="check-decagram" size={10} color="#4285F4" />
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={styles.miniBrandName} numberOfLines={1}>{item.display_name}</Text>
                                            </TouchableOpacity>
                                        )}
                                        keyExtractor={(item) => `svc-top-${item.id}`}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.horizontalDensePadding}
                                    />
                                </View>
                            )}

                            <View style={styles.serviceCategoryHeader}>
                                <FlatList
                                    data={serviceCategories}
                                    renderItem={({ item }) => {
                                        const iconSource = getServiceIcon(item.name);
                                        const isActive = selectedServiceCategory === item.id;
                                        return (
                                            <TouchableOpacity
                                                style={styles.serviceCategoryCard}
                                                onPress={() => handleServiceCategoryPress(item.id)}
                                            >
                                                <View style={[
                                                    styles.serviceCategoryIconWrapper,
                                                    isActive && styles.activeServiceCategoryIconWrapper
                                                ]}>
                                                    {iconSource ? (
                                                        <Image
                                                            source={iconSource}
                                                            style={styles.serviceCategoryLargeIcon}
                                                            resizeMode="contain"
                                                        />
                                                    ) : (
                                                        <MaterialCommunityIcons
                                                            name={item.icon || 'star-outline'}
                                                            size={30}
                                                            color={isActive ? '#FFF' : '#FF4757'}
                                                        />
                                                    )}
                                                </View>
                                                <Text style={[
                                                    styles.serviceCategoryCardText,
                                                    isActive && styles.activeServiceCategoryCardText
                                                ]} numberOfLines={2}>
                                                    {item.name}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    }}
                                    keyExtractor={(item) => `svc-cat-${item.id}`}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
                                />
                            </View>
                            <View style={[styles.feedHeaderRow, { marginTop: 10 }]}>
                                <MaterialCommunityIcons name="account-group" size={18} color="#4285F4" />
                                <Text style={styles.feedTitleText}>Recommended Providers</Text>
                                <View style={[styles.feedTitleLine, { backgroundColor: '#4285F4' }]} />
                            </View>
                        </>
                    )
                )}
                renderItem={({ item, index }) => {
                    if (activeTab === 'services') {
                        return (
                            <TouchableOpacity
                                style={styles.serviceProviderCard}
                                onPress={() => navigation.navigate('ServiceProviderDetails', { providerId: item.id })}
                            >
                                <View style={styles.serviceProviderHeader}>
                                    <View style={styles.providerAvatarWrapper}>
                                        <Image
                                            source={{ uri: item.users?.profile_picture || 'https://via.placeholder.com/80' }}
                                            style={styles.providerAvatar}
                                        />
                                        {item.is_verified && (
                                            <View style={styles.verifiedBadge}>
                                                <MaterialCommunityIcons name="check-decagram" size={14} color="#4285F4" />
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.providerInfo}>
                                        <Text style={styles.providerName}>{item.display_name}</Text>
                                        <Text style={styles.providerCategory}>{item.service_categories?.name || 'Service Provider'}</Text>
                                        <View style={styles.ratingRow}>
                                            <MaterialCommunityIcons name="star" size={14} color="#FFB800" />
                                            <Text style={styles.ratingText}>4.8 (120+ reviews)</Text>
                                        </View>
                                    </View>
                                    <View style={styles.pricingInfo}>
                                        <Text style={styles.startsFrom}>Starts from</Text>
                                        <Text style={styles.priceText}>₹{Number(item.starting_price).toLocaleString('en-IN')}</Text>
                                    </View>
                                </View>
                                <View style={styles.providerFooter}>
                                    <View style={styles.experienceTag}>
                                        <MaterialCommunityIcons name="briefcase-outline" size={12} color="#666" />
                                        <Text style={styles.experienceText}>{item.experience_years}+ Years Exp.</Text>
                                    </View>
                                    <View style={styles.locationTag}>
                                        <MaterialCommunityIcons name="map-marker-outline" size={12} color="#666" />
                                        <Text style={styles.locationText}>{item.service_area || selectedLocation}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }

                    const bName = item.business_branches?.businesses?.business_name || 'Store';
                    const city = item.business_branches?.city;
                    const rType = item.offer_rules?.[0]?.rule_type || 'flat';
                    const dValue = item.offer_rules?.[0]?.discount_value;

                    const renderOfficialStoresFeed = () => (
                        <View style={[styles.compactBrandSection, { marginVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F1F2F6' }]}>
                            <View style={styles.compactSectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <MaterialCommunityIcons name="check-decagram" size={16} color="#1E90FF" />
                                    <Text style={styles.denseSectionTitle}>Official Stores</Text>
                                </View>
                                <TouchableOpacity onPress={() => navigation.navigate('AffiliateStores')}>
                                    <Text style={styles.denseViewAll}>See All</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={affiliateStores}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(s) => `feed-store-${s.id}`}
                                renderItem={({ item: store }) => (
                                    <TouchableOpacity
                                        style={styles.miniBrandCard}
                                        onPress={() => navigation.navigate('AffiliateOffers', { storeId: store.id, storeName: store.name })}
                                    >
                                        <View style={styles.miniAvatarWrapper}>
                                            <Image source={{ uri: store.logo_url }} style={styles.miniAvatar} resizeMode="contain" />
                                        </View>
                                        <Text style={styles.miniBrandName} numberOfLines={1}>{store.name}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    );

                    return (
                        <>
                            {index === 4 && affiliateStores.length > 0 && renderOfficialStoresFeed()}
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => navigation.navigate('OfferDetails', { offer: item })}
                                style={styles.denseOfferCard}
                            >
                                <View style={styles.denseCardThumbnailWrapper}>
                                    {item.offer_media && item.offer_media[0] ? (
                                        <Image source={{ uri: item.offer_media[0].image_url }} style={styles.denseCardThumbnail} />
                                    ) : (
                                        <View style={styles.denseThumbnailPlaceholder} />
                                    )}
                                    <View style={styles.denseDiscountBadgeMini}>
                                        <Text style={styles.denseDiscountTextMini}>{rType === 'percentage' ? `${dValue}%` : rType.toUpperCase()}</Text>
                                    </View>
                                </View>
                                <View style={styles.denseCardContent}>
                                    <View style={styles.denseCardHeader}>
                                        <Text style={styles.denseCardBrand} numberOfLines={1}>{bName}</Text>
                                        <View style={styles.denseCardLocationRow}>
                                            <MaterialCommunityIcons name="map-marker" size={10} color="#999" />
                                            <Text style={styles.denseCardLocationText}>{city}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.denseCardTitle} numberOfLines={2}>{item.title}</Text>
                                    <View style={styles.denseCardFooter}>
                                        <View style={styles.denseMetricsRow}>
                                            <View style={styles.metricItem}>
                                                <MaterialCommunityIcons name="eye-outline" size={12} color="#999" />
                                                <Text style={styles.denseMetricsText}>{(item.offer_metrics?.views || 0) + 1}</Text>
                                            </View>
                                            <View style={styles.metricsDivider} />
                                            <View style={styles.metricItem}>
                                                <MaterialCommunityIcons name="share-variant" size={12} color="#999" />
                                                <Text style={styles.denseMetricsText}>{item.offer_metrics?.shares || 0}</Text>
                                            </View>
                                            <View style={styles.metricsDivider} />
                                            <View style={styles.metricItem}>
                                                <MaterialCommunityIcons name="heart-outline" size={12} color="#999" />
                                                <Text style={styles.denseMetricsText}>{item._count?.user_saved_offers || 0}</Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity style={styles.miniActionBtn}>
                                            <MaterialCommunityIcons name="chevron-right" size={16} color="#FF4757" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </>
                    );
                }}
                ListFooterComponent={loading ? <ActivityIndicator size="small" color="#FF4757" style={{ margin: 20 }} /> : null}
            />

            {/* Notification Sheet */}
            {
                showNotifications && (
                    <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={() => toggleNotifications(false)}
                    >
                        <Animated.View
                            style={[
                                styles.notifSheet,
                                { transform: [{ translateX: slideAnim }] }
                            ]}
                        >
                            <View style={[styles.sheetHeader, { paddingTop: insets.top + 20 }]}>
                                <Text style={styles.sheetTitle}>Notifications</Text>
                                <TouchableOpacity onPress={() => toggleNotifications(false)}>
                                    <Text style={styles.closeText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.sheetContent}>
                                {[1, 2, 3, 4].map((i) => (
                                    <View key={i} style={styles.notifItem}>
                                        <Text style={styles.notifItemTitle}>New Offer in {selectedLocation}!</Text>
                                        <Text style={styles.notifItemDesc}>Check out the latest electronics sale...</Text>
                                        <Text style={styles.notifItemTime}>2 mins ago</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </Animated.View>
                    </TouchableOpacity>
                )
            }

            {activeTab === 'services' && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('PostServiceRequest')}
                >
                    <MaterialCommunityIcons name="plus" size={30} color="#FFF" />
                </TouchableOpacity>
            )}
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FBFBFE',
    },
    header: {
        backgroundColor: '#FFF',
        paddingHorizontal: 12,
        paddingBottom: 12,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 8,
        zIndex: 10,
    },
    singleRowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    // --- Dense & Modern Redesign Styles ---
    denseHeader: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingBottom: 10,
        elevation: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
        zIndex: 100,
    },
    brandingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandName: {
        fontSize: 22,
        fontWeight: '900',
        color: COLORS.primary,
        letterSpacing: -0.5,
    },
    brandDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.secondary,
        marginLeft: 2,
        marginTop: 8,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerRightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    languageToggle: {
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.surface,
    },
    languageToggleText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.primary,
    },
    searchRow: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    denseLogo: {
        width: 100,
        height: 35,
    },
    unifiedSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        height: 44,
        width: '100%',
    },
    locationEmbeddedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    locationDenseText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2D3436',
        marginLeft: 2,
    },
    searchVerticalDivider: {
        width: 1,
        height: 16,
        backgroundColor: '#D1D5DB',
        marginHorizontal: 8,
    },
    unifiedSearchInput: {
        flex: 1,
        fontSize: 14,
        color: '#2D3436',
        paddingHorizontal: 10,
        fontWeight: '500',
        paddingVertical: 0,
    },
    denseNotifBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    denseNotifBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF4757',
        borderWidth: 1.5,
        borderColor: '#FFF',
    },

    compactBrandSection: {
        paddingVertical: 12,
        backgroundColor: '#FFF',
    },
    compactSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    denseSectionTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#2D3436',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    denseViewAll: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FF4757',
    },
    miniBrandCard: {
        alignItems: 'center',
        marginRight: 16,
        width: 70,

    },
    miniAvatarWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        marginBottom: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
        backgroundColor: '#F9FAFB',
        borderWidth: 3,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 9, height: 9 },
        shadowOpacity: 0.9,
        shadowRadius: 4,
        elevation: 5,
    },
    miniBrandName: {
        fontSize: 10,
        fontWeight: '700',
        color: '#636E72',
        textAlign: 'center',
    },
    miniFallbackAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniFallbackText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
    },
    horizontalDensePadding: {
        paddingLeft: 16,
    },

    miniCatEmoji: {
        fontSize: 22,
    },

    filterPillsList: {
        paddingLeft: 16,
        marginTop: 5,
        paddingBottom: 5,
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    filterPillActive: {
        backgroundColor: '#FF475710',
        borderColor: '#FF4757',
    },
    filterPillIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    filterPillText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#636E72',
    },
    filterPillTextActive: {
        color: '#FF4757',
    },

    feedHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FBFBFE',
    },
    feedTitleText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#2D3436',
        marginLeft: 6,
    },
    feedTitleLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
        marginLeft: 12,
    },

    denseOfferCard: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F2F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    denseCardThumbnailWrapper: {
        width: 100,
        height: 100,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
    },
    denseCardThumbnail: {
        width: '100%',
        height: '100%',
    },
    denseThumbnailPlaceholder: {
        flex: 1,
        backgroundColor: '#E5E7EB',
    },
    denseDiscountBadgeMini: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#FF4757',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    denseDiscountTextMini: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
    },
    denseCardContent: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    denseCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    denseCardBrand: {
        fontSize: 14,
        fontWeight: '800',
        color: '#000',
        textTransform: 'uppercase',
        flex: 1,
    },
    denseCardLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    denseCardLocationText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#636E72',
        marginLeft: 2,
    },
    denseCardTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#2D3436',
        marginVertical: 4,
        lineHeight: 18,
    },
    denseCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    denseMetricsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    denseMetricsText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ff4747ff',
        marginLeft: 3,
    },
    denseDotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#D1D5DB',
        marginHorizontal: 6,
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metricsDivider: {
        width: 1,
        height: 12,
        backgroundColor: '#F1F2F6',
        marginHorizontal: 8,
    },
    miniActionBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FF475710',
        justifyContent: 'center',
        alignItems: 'center',
    },
    denseActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2D3436',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    denseActionBtnText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        marginRight: 2,
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 2000,
    },
    notifSheet: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: width * 0.85,
        backgroundColor: '#FFF',
        shadowColor: "#000",
        shadowOffset: { width: -5, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2D3436',
    },
    closeText: {
        fontSize: 20,
        color: '#B2BEC3',
    },
    sheetContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    notifItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    notifItemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 4,
    },
    notifItemDesc: {
        fontSize: 12,
        color: '#636E72',
        lineHeight: 18,
    },
    notifItemTime: {
        fontSize: 10,
        color: '#B2BEC3',
        marginTop: 6,
    },
    section: {
        paddingTop: 10,
    },
    // E-Commerce Platforms Styles
    platformsSection: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        marginBottom: 12,
    },
    cashbackBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    cashbackBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4CAF50',
    },
    platformsList: {
        paddingHorizontal: 16,
        marginTop: 12,
        paddingBottom: 4,
    },
    platformCard: {
        width: 100,
        marginRight: 12,
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    platformLogoContainer: {
        width: 50,
        height: 50,
        marginBottom: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    platformLogo: {
        width: '100%',
        height: '100%',
    },
    platformIconWrapper: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    platformName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2D3436',
        marginBottom: 6,
        textAlign: 'center',
    },
    platformCashbackTag: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
    platformCashbackText: {
        fontSize: 9,
        fontWeight: '800',
    },

    // New Redesign Styles
    bannerContainer: {
        height: 160,
        backgroundColor: '#FFF',
        marginTop: 10,
    },
    bannerSlide: {
        width: width,
        height: 160,
        paddingHorizontal: 16,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
    },

    hotDealsSection: {
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    verticalDealCard: {
        width: 160,
        marginRight: 16,
        backgroundColor: '#FFF',
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        marginBottom: 3,
    },
    verticalDealThumbnailWrapper: {
        width: 160,
        height: 180,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        position: 'relative',
    },
    verticalDealThumbnail: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    verticalDealBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#FF4757',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        shadowColor: '#FF4757',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 3,
    },
    verticalDealBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    verticalDealGradient: {

    },
    verticalDealViews: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 3,
    },
    verticalDealViewsText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '700',
    },
    verticalDealContent: {
        padding: 10,
    },
    verticalDealTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#2D3436',
        lineHeight: 16,
        marginBottom: 6,
    },
    verticalDealBusinessRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    verticalDealBrand: {
        fontSize: 10,
        fontWeight: '600',
        color: '#636E72',
        flex: 1,
    },
    verticalDealPricing: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    verticalDealOldPrice: {
        fontSize: 11,
        fontWeight: '600',
        color: '#B2BEC3',
        textDecorationLine: 'line-through',
    },
    verticalDealNewPrice: {
        fontSize: 14,
        fontWeight: '900',
        color: '#27AE60',
    },
    verticalDealExpiry: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    verticalDealExpiryText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FF4757',
    },
    verticalDealBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    verticalDealMetrics: {
        flexDirection: 'row',
        gap: 8,
    },
    miniMetric: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    miniMetricText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#636E72',
    },
    // Tab Switcher Styles
    tabSwitcherContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F1F1',
    },
    tabBtn: {
        paddingVertical: 12,
        marginRight: 24,
        position: 'relative',
    },
    activeTabBtn: {
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#999',
    },
    activeTabText: {
        color: '#2D3436',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#FF4757',
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    // Service Card Styles
    serviceProviderCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F1F1',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    serviceProviderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    providerAvatarWrapper: {
        position: 'relative',
    },
    providerAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#F8F9FA',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 1,
    },
    providerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    providerName: {
        fontSize: 16,
        fontWeight: '700',
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
    },
    ratingText: {
        fontSize: 12,
        color: '#2D3436',
        fontWeight: '600',
        marginLeft: 4,
    },
    pricingInfo: {
        alignItems: 'flex-end',
    },
    startsFrom: {
        fontSize: 11,
        color: '#999',
    },
    priceText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2D3436',
    },
    providerFooter: {
        flexDirection: 'row',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F1F1',
    },
    experienceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
    },
    experienceText: {
        fontSize: 11,
        color: '#636E72',
        marginLeft: 4,
    },
    locationTag: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 11,
        color: '#636E72',
        marginLeft: 4,
    },
    serviceCategoryHeader: {
        marginTop: 15,
        marginBottom: 10,
    },
    serviceCategoryCard: {
        alignItems: 'center',
        marginRight: 20,
        width: 100,
    },
    serviceCategoryIconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 22,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1.5,
        borderColor: '#F1F2F6',
        overflow: 'hidden',
    },
    activeServiceCategoryIconWrapper: {
        backgroundColor: '#FF4757',
        borderColor: '#FF4757',
        elevation: 10,
        shadowColor: '#FF4757',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    serviceCategoryLargeIcon: {
        width: '100%',
        height: '100%',
    },
    serviceCategoryCardText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#2D3436',
        textAlign: 'center',
    },
    activeServiceCategoryCardText: {
        color: '#FF4757',
        fontWeight: '900',
    },
    fab: {
        position: 'absolute',
        bottom: 25,
        right: 25,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        zIndex: 100,
    },
});

export default HomeScreen;
