import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    StatusBar,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import CountdownTimer from '../components/CountdownTimer';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const filterOptions = [
    { label: 'All', value: 'ALL' },
    { label: '🔥 BOGO', value: 'BOGO' },
    { label: '💰 Cashback', value: 'CASHBACK' },
    { label: '⚡ Flat Off', value: 'FLAT_OFF' },
    { label: '% Discounts', value: 'PERCENTAGE' },
    { label: '🎁 Free Gift', value: 'BUY_X_GET_Y' },
];

const HotDealsScreen = ({ route, navigation }: any) => {
    const insets = useSafeAreaInsets();
    const initialType = route.params?.offerType || 'ALL';
    const initialSearch = route.params?.search || '';
    const screenTitle = route.params?.title || 'Hot Deals 🔥';

    const [activeFilter, setActiveFilter] = useState(initialType);
    const [searchQuery, setSearchQuery] = useState(initialSearch);

    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        // If navigation params change, update state
        if (route.params?.search !== undefined) setSearchQuery(route.params.search);
        if (route.params?.offerType !== undefined) setActiveFilter(route.params.offerType);
    }, [route.params]);

    useEffect(() => {
        setOffers([]);
        setHasMore(true);
        fetchOffers(undefined, activeFilter, searchQuery);
    }, [activeFilter, searchQuery]);

    const fetchOffers = async (nextCursor?: string, type?: string, search?: string) => {
        if (loading || (!hasMore && nextCursor)) return;
        setLoading(true);

        try {
            const currentType = type || activeFilter;
            const currentSearch = search !== undefined ? search : searchQuery;

            let url = `/offers/feed?limit=20`;
            if (currentType !== 'ALL') url += `&offerType=${currentType.toLowerCase()}`;
            if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
            if (nextCursor) url += `&cursor=${nextCursor}`;

            const response = await api.get(url);
            const { data, meta } = response.data;

            if (nextCursor) {
                setOffers(prev => [...prev, ...(data || [])]);
            } else {
                setOffers(data || []);
            }
            setCursor(meta?.next_cursor || null);
            setHasMore(!!meta?.has_more);
        } catch (error) {
            console.error('Fetch hot deals failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (hasMore && !loading && cursor) {
            fetchOffers(cursor);
        }
    };

    const renderFilterItem = (item: { label: string, value: string }) => {
        const isActive = activeFilter === item.value;
        return (
            <TouchableOpacity
                key={item.value}
                style={[styles.filterChip, isActive && styles.activeFilterChip]}
                onPress={() => setActiveFilter(item.value)}
            >
                <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                    {item.label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderOfferCard = ({ item }: { item: any }) => {
        const businessName = item.business_branches?.businesses?.business_name || 'Store';
        const city = item.business_branches?.city;
        const imageUrl = item.offer_media?.[0]?.image_url;
        const ruleType = item.offer_rules?.[0]?.rule_type || 'flat';
        const discountValue = item.offer_rules?.[0]?.discount_value;
        const conditions = item.offer_rules?.[0]?.conditions;
        const originalPrice = conditions?.original_price;
        const offerPrice = conditions?.offer_price;
        const viewCount = item._count?.offer_views || 0;

        // Calculate savings
        const savings = originalPrice && offerPrice ? originalPrice - offerPrice : null;

        // Calculate days until expiry
        const expiryDate = new Date(item.end_date);
        const today = new Date();
        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isEndingSoon = daysLeft > 0 && daysLeft <= 3;

        // Get discount badge text
        const getBadgeText = () => {
            if (ruleType === 'percentage' && discountValue) return `${discountValue}% OFF`;
            if (ruleType === 'bogo') return 'BOGO';
            if (ruleType === 'buy_x_get_y') return 'FREE GIFT';
            if (ruleType === 'cashback') return 'CASHBACK';
            return 'HOT DEAL';
        };

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('OfferDetails', { offer: item })}
            >
                <View style={styles.imageContainer}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
                    ) : (
                        <View style={[styles.cardImage, { backgroundColor: '#EEE' }]} />
                    )}

                    {/* Discount Badge */}
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{getBadgeText()}</Text>
                    </View>

                    {/* View Count */}
                    {viewCount > 0 && (
                        <View style={styles.viewCountBadge}>
                            <MaterialCommunityIcons name="eye" size={12} color="#FFF" />
                            <Text style={styles.viewCountText}>{viewCount > 1000 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount}</Text>
                        </View>
                    )}

                    {/* Expiry Warning */}
                    {isEndingSoon && (
                        <View style={styles.expiryWarning}>
                            <MaterialCommunityIcons name="clock-alert-outline" size={12} color="#FFF" />
                            <Text style={styles.expiryWarningText}>
                                {daysLeft === 1 ? 'Ending today!' : `${daysLeft} days left`}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardContent}>
                    {/* Business Name */}
                    <Text style={styles.shopName}>{businessName}</Text>

                    {/* Offer Title */}
                    <Text style={styles.offerTitle} numberOfLines={2}>{item.title}</Text>

                    {/* Description */}
                    <Text style={styles.description} numberOfLines={2}>{item.short_description}</Text>

                    {/* Location */}
                    {city && (
                        <View style={styles.locationRow}>
                            <MaterialCommunityIcons name="map-marker" size={14} color="#999" />
                            <Text style={styles.locationText}>{city}</Text>
                        </View>
                    )}

                    {/* Pricing & Action Row */}
                    <View style={styles.priceRow}>
                        <View style={styles.priceContainer}>
                            {originalPrice && offerPrice ? (
                                <>
                                    <Text style={styles.originalPrice}>₹{originalPrice}</Text>
                                    <Text style={styles.discountedPrice}>₹{offerPrice}</Text>
                                    {savings && (
                                        <View style={styles.savingsBadge}>
                                            <Text style={styles.savingsText}>Save ₹{savings}</Text>
                                        </View>
                                    )}
                                </>
                            ) : discountValue ? (
                                <Text style={styles.discountedPrice}>{discountValue}% OFF</Text>
                            ) : null}
                        </View>
                        <View style={styles.claimButton}>
                            <Text style={styles.claimButtonText}>View</Text>
                            <MaterialCommunityIcons name="chevron-right" size={16} color="#FFF" />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3436" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.screenTitle}>{searchQuery ? `Results: ${searchQuery}` : screenTitle}</Text>
                        <Text style={styles.screenSubtitle}>
                            {searchQuery ? 'Found the best deals for you' : 'Best offers picked for you'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Filters */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContent}
                >
                    {filterOptions.map(renderFilterItem)}
                </ScrollView>
            </View>

            {/* Offers List */}
            <FlatList
                data={offers}
                keyExtractor={(item) => item.id}
                renderItem={renderOfferCard}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loading ? <ActivityIndicator size="small" color="#3F51B5" style={{ margin: 10 }} /> : null}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No deals found for this type.</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        paddingTop: 10,
        backgroundColor: '#F8F9FA',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        marginRight: 15,
        padding: 4,
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    screenSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    filterContainer: {
        marginBottom: 10,
    },
    filterContent: {
        paddingHorizontal: 20,
        paddingVertical: 5,
    },
    filterChip: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        elevation: 1,
    },
    activeFilterChip: {
        backgroundColor: '#ff4747ff',
        borderColor: '#ff4747ff',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555',
    },
    activeFilterText: {
        color: '#FFF',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    imageContainer: {
        height: 160,
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    badge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#FF4757',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        shadowColor: '#FF4757',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 3,
    },
    badgeText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 11,
        letterSpacing: 0.5,
    },
    viewCountBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    viewCountText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    expiryWarning: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF4757',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 4,
    },
    expiryWarningText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    cardContent: {
        padding: 16,
    },
    shopName: {
        fontSize: 12,
        color: '#888',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    offerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 6,
    },
    description: {
        fontSize: 13,
        color: '#636E72',
        lineHeight: 18,
        marginBottom: 10,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 4,
    },
    locationText: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
    },
    termsText: {
        fontSize: 11,
        color: '#999',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        flexWrap: 'wrap',
        gap: 8,
    },
    originalPrice: {
        fontSize: 13,
        color: '#B2BEC3',
        textDecorationLine: 'line-through',
        fontWeight: '600',
    },
    discountedPrice: {
        fontSize: 18,
        fontWeight: '900',
        color: '#2D3436',
    },
    savingsBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    savingsText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#27AE60',
    },
    claimButton: {
        backgroundColor: '#FF4757',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        shadowColor: '#FF4757',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    claimButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '800',
    },
    spacer: {
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    }
});

export default HotDealsScreen;
