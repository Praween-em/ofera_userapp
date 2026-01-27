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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AutoScrollingBanner from '../components/AutoScrollingBanner';
import CountdownTimer from '../components/CountdownTimer';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

const getCategoryColor = (name: string) => {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F06292', '#AED581', '#FFD54F', '#4DB6AC', '#7986CB'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const HomeScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [selectedLocation, setSelectedLocation] = useState('Anantapur');
    const [showNotifications, setShowNotifications] = useState(false);
    const slideAnim = useRef(new Animated.Value(width)).current;

    // API State
    const [offers, setOffers] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchOffers();
        fetchCategories();
        fetchBusinesses();
    }, []);

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

    const fetchOffers = async (nextCursor?: string) => {
        if (loading || (!hasMore && nextCursor)) return;

        setLoading(true);
        try {
            const url = nextCursor ? `/offers/feed?cursor=${nextCursor}` : '/offers/feed';
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
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
        } finally {
            setLoading(false);
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
        { id: 'bogo', name: 'Buy 1 Get 1', icon: '🎁', color: '#FF4757' },
        { id: 'flash', name: 'Flash Sale', icon: '⚡', color: '#FFA502' },
        { id: 'flat', name: 'Flat Discount', icon: '💰', color: '#2ED573' },
        { id: 'combo', name: 'Combo Deals', icon: '🍔', color: '#1E90FF' },
        { id: 'limited', name: 'Limited Time', icon: '⏰', color: '#747067' },
        { id: 'new', name: 'New Arrivals', icon: '🔥', color: '#FF6B81' },
    ];

    const bannerData = [
        { id: '1', title: 'Fashion Sale', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80', description: 'Up to 50% off on latest trends' },
        { id: '2', title: 'Tech Deals', image: 'https://images.unsplash.com/photo-1531297425163-432b0307cc81?w=800&q=80', description: 'Best gadgets at best prices' },
        { id: '3', title: 'Home Decor', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?w=800&q=80', description: 'Revamp your living space' },
        { id: '4', title: 'Health Essentials', image: 'https://plus.unsplash.com/premium_photo-1673953510197-0950d951c6d9?w=800&q=80', description: 'Care for your loved ones' },
    ];

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

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerTop}>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.title}>Offer Market</Text>
                        <View style={styles.locationBadge}>
                            <MaterialCommunityIcons name="map-marker" size={12} color="#FF4757" />
                            <Text style={styles.locationText}>{selectedLocation}</Text>
                        </View>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            onPress={() => toggleNotifications(true)}
                            style={styles.headerIconBtn}
                        >
                            <MaterialCommunityIcons name="bell-outline" size={26} color="#2D3436" />
                            <View style={styles.notifBadge} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar */}
                <TouchableOpacity style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={22} color="#A0A0A0" />
                    <Text style={styles.searchText}>Search for brands or offers...</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={offers}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={() => (
                    <>
                        {/* Businesses Section (Instagram Stories Style) */}
                        {businesses.length > 0 && (
                            <View style={styles.storySection}>
                                <View style={styles.sectionHeader}>
                                    <View>
                                        <Text style={styles.sectionTitle}>Top Businesses</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => navigation.navigate('Businesses')}>
                                        <Text style={styles.viewAllText}>See All</Text>
                                    </TouchableOpacity>
                                </View>
                                <FlatList
                                    data={businesses}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.storyCard}
                                            onPress={() => navigation.navigate('ShopDetails', { shopId: item.id })}
                                        >
                                            <View style={styles.storyIconWrapper}>
                                                <Image
                                                    source={{ uri: item.logo_url || 'https://via.placeholder.com/100' }}
                                                    style={styles.storyLogo}
                                                />
                                            </View>
                                            <Text style={styles.storyName} numberOfLines={1}>{item.business_name}</Text>
                                        </TouchableOpacity>
                                    )}
                                    keyExtractor={(item) => item.id}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.storiesList}
                                />
                            </View>
                        )}

                        {/* Auto Scrolling Banner */}
                        <AutoScrollingBanner data={bannerData} />

                        {/* Categories Section */}
                        <View style={styles.catSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Categories</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
                                    <Text style={styles.viewAllText}>View All</Text>
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={categories}
                                keyExtractor={(item) => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.catList}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.catItem}
                                        onPress={() => navigation.navigate('Categories')}
                                    >
                                        <View style={[styles.catIconWrapper, { backgroundColor: getCategoryColor(item.name) + '15' }]}>
                                            <Text style={styles.catIconText}>{item.icon || '📦'}</Text>
                                        </View>
                                        <Text style={styles.catNameText} numberOfLines={1}>{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                            />

                            {/* Offer Type Bar - Modern Addition */}
                            <View style={styles.offerTypeContainer}>
                                <FlatList
                                    data={offerTypes}
                                    keyExtractor={(item) => item.id}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.offerTypeList}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={[styles.offerTypeChip, { borderColor: item.color + '30' }]}>
                                            <Text style={styles.offerTypeIcon}>{item.icon}</Text>
                                            <Text style={[styles.offerTypeName, { color: '#2D3436' }]}>{item.name}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        </View>

                        {/* Hot Deals Filters */}
                        <View style={styles.filterSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>🔥 Hot Deals</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
                                {discountFilters.map((disc, index) => (
                                    <TouchableOpacity key={index} style={styles.dealChip}>
                                        <Text style={styles.dealChipText}>{disc} OFF</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Featured Offers Title */}
                        <View style={[styles.section, { paddingBottom: 0 }]}>
                            <Text style={styles.sectionTitle}>Offers near you</Text>
                        </View>
                    </>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('OfferDetails', { offer: item })}
                        style={styles.modernOfferCard}
                    >
                        <View style={styles.cardImageContainer}>
                            {item.offer_media && item.offer_media[0] ? (
                                <Image
                                    source={{ uri: item.offer_media[0].image_url }}
                                    style={styles.cardImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.imagePlaceholderBase} />
                            )}
                            <View style={styles.discountBadge}>
                                <Text style={styles.discountText}>HOT</Text>
                            </View>
                            <View style={styles.distanceTag}>
                                <MaterialCommunityIcons name="clock-outline" size={12} color="#FFF" />
                                <CountdownTimer targetDate={new Date(item.end_date)} style={styles.miniTimer} />
                            </View>
                        </View>

                        <View style={styles.cardInfo}>
                            <View style={styles.cardTopRow}>
                                <Text style={styles.cardStoreName} numberOfLines={1}>
                                    {item.business_branches?.[0]?.businesses?.business_name || 'Store'}
                                </Text>
                                <View style={styles.cityBadge}>
                                    <Text style={styles.cityText}>{item.business_branches?.[0]?.city || selectedLocation}</Text>
                                </View>
                            </View>

                            <Text style={styles.cardOfferTitle} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.cardDescription} numberOfLines={1}>
                                {item.short_description}
                            </Text>

                            <View style={styles.cardFooter}>
                                <View style={styles.viewsContainer}>
                                    <MaterialCommunityIcons name="eye-outline" size={14} color="#999" />
                                    <Text style={styles.viewsText}>1.2k</Text>
                                </View>
                                <View style={styles.modernClaimBtn}>
                                    <Text style={styles.modernClaimBtnText}>Get Deal</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={16} color="#FFF" />
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListFooterComponent={loading ? <ActivityIndicator size="small" color="#3F51B5" style={{ margin: 20 }} /> : null}
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
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    headerTitleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#2D3436',
        letterSpacing: -0.5,
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    locationText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#636E72',
        marginLeft: 4,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F1F2F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        backgroundColor: '#FF4757',
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F2F6',
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    searchText: {
        fontSize: 14,
        color: '#A0A0A0',
        marginLeft: 10,
        fontWeight: '500',
    },
    storySection: {
        paddingTop: 20,
        paddingBottom: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#2D3436',
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FF4757',
    },
    storiesList: {
        paddingLeft: 20,
    },
    storyCard: {
        alignItems: 'center',
        marginRight: 18,
        width: 72,
    },
    storyIconWrapper: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: '#FF4757',
        padding: 3,
        marginBottom: 6,
    },
    storyLogo: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
        backgroundColor: '#F1F2F6',
    },
    storyName: {
        fontSize: 11,
        fontWeight: '600',
        color: '#2D3436',
        textAlign: 'center',
    },
    catSection: {
        paddingVertical: 20,
    },
    catList: {
        paddingLeft: 20,
    },
    catItem: {
        alignItems: 'center',
        marginRight: 20,
        width: 80,
    },
    catIconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    catIconText: {
        fontSize: 28,
    },
    catNameText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2D3436',
        textAlign: 'center',
    },
    offerTypeContainer: {
        marginTop: 20,
    },
    offerTypeList: {
        paddingLeft: 20,
    },
    offerTypeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginRight: 12,
        borderWidth: 1.5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    offerTypeIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    offerTypeName: {
        fontSize: 13,
        fontWeight: '800',
    },
    filterSection: {
        marginBottom: 20,
    },
    filterList: {
        paddingLeft: 20,
    },
    dealChip: {
        backgroundColor: '#FF4757',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginRight: 10,
    },
    dealChipText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '800',
    },
    modernOfferCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden',
    },
    cardImageContainer: {
        height: 150, // Slightly more compact
        backgroundColor: '#F1F2F6',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholderBase: {
        flex: 1,
        backgroundColor: '#E1E1E1',
    },
    discountBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#FF4757',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    discountText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 10,
    },
    distanceTag: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    miniTimer: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    cardInfo: {
        padding: 15, // More compact padding
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    cardStoreName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FF4757',
        flex: 1,
    },
    cityBadge: {
        backgroundColor: '#F1F2F6',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    cityText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#636E72',
    },
    cardOfferTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
        lineHeight: 22,
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 12,
        color: '#636E72',
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F2F6',
        paddingTop: 12,
    },
    viewsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewsText: {
        fontSize: 11,
        color: '#B2BEC3',
        fontWeight: '600',
        marginLeft: 4,
    },
    modernClaimBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2D3436',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    modernClaimBtnText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
        marginRight: 6,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 2000,
    },
    notifSheet: {
        position: 'absolute',
        right: 0,
        top: 0,
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
        fontSize: 22,
        fontWeight: '900',
        color: '#2D3436',
    },
    closeText: {
        fontSize: 28,
        color: '#B2BEC3',
        fontWeight: '300',
    },
    sheetContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    notifItem: {
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    notifItemTitle: {
        fontWeight: '800',
        fontSize: 15,
        color: '#2D3436',
    },
    notifItemDesc: {
        fontSize: 13,
        color: '#636E72',
        marginTop: 4,
        lineHeight: 18,
    },
    notifItemTime: {
        fontSize: 11,
        color: '#B2BEC3',
        fontWeight: '600',
        marginTop: 8,
    },
    section: {
        paddingTop: 10,
    },
});

export default HomeScreen;
