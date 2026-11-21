import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import CountdownTimer from '../components/CountdownTimer';

const SearchResultsScreen = ({ route, navigation }: any) => {
    const insets = useSafeAreaInsets();
    const initialQuery = route.params?.search || '';

    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (initialQuery) {
            handleSearch(initialQuery);
        }
    }, []);

    const handleSearch = async (query: string, nextCursor?: string) => {
        if (!query.trim()) return;
        if (loading || (!hasMore && nextCursor)) return;

        setLoading(true);
        try {
            const url = `/offers/feed?search=${encodeURIComponent(query)}${nextCursor ? `&cursor=${nextCursor}` : ''}`;
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
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (hasMore && !loading && cursor) {
            handleSearch(searchQuery, cursor);
        }
    };

    const renderOfferItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.resultCard}
            onPress={() => navigation.navigate('OfferDetails', { offer: item })}
        >
            <View style={styles.cardContent}>
                <View style={styles.imageContainer}>
                    {item.offer_media?.[0]?.image_url ? (
                        <Image source={{ uri: item.offer_media[0].image_url }} style={styles.offerImage} />
                    ) : (
                        <View style={styles.placeholderImage} />
                    )}
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{item.offer_rules?.[0]?.rule_type?.toUpperCase() || 'DEAL'}</Text>
                    </View>
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.storeName} numberOfLines={1}>
                        {item.business_branches?.[0]?.businesses?.business_name || 'Store'}
                    </Text>
                    <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

                    <View style={styles.footer}>
                        <View style={styles.timerRow}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color="#999" />
                            <CountdownTimer targetDate={new Date(item.end_date)} style={styles.timerText} />
                        </View>
                        <View style={styles.viewBtn}>
                            <Text style={styles.viewBtnText}>View</Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header with Search Bar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3436" />
                </TouchableOpacity>
                <View style={styles.searchBarWrapper}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for anything..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={() => {
                            setOffers([]);
                            setHasMore(true);
                            handleSearch(searchQuery);
                        }}
                        autoFocus={!initialQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close-circle" size={18} color="#CCC" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Results */}
            <View style={styles.resultsContainer}>
                {loading && offers.length === 0 ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#3F51B5" />
                    </View>
                ) : offers.length === 0 ? (
                    <View style={styles.center}>
                        <MaterialCommunityIcons name="magnify-scan" size={80} color="#F1F2F6" />
                        <Text style={styles.emptyTitle}>No Results Found</Text>
                        <Text style={styles.emptySubtitle}>Try searching for something else</Text>
                    </View>
                ) : (
                    <FlatList
                        data={offers}
                        keyExtractor={(item) => item.id}
                        renderItem={renderOfferItem}
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.5}
                        contentContainerStyle={styles.listPadding}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={() => (
                            <Text style={styles.resultsCount}>
                                Found {offers.length}{hasMore ? '+' : ''} offers for you
                            </Text>
                        )}
                        ListFooterComponent={loading ? <ActivityIndicator size="small" color="#3F51B5" style={{ margin: 20 }} /> : null}
                    />
                )}
            </View>
        </View>
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
        paddingHorizontal: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    backBtn: {
        padding: 5,
        marginRight: 10,
    },
    searchBarWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F8FA',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 45,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        marginLeft: 8,
        fontSize: 14,
        color: '#2D3436',
        fontWeight: '500',
    },
    resultsContainer: {
        flex: 1,
        backgroundColor: '#FBFBFE',
    },
    listPadding: {
        padding: 15,
    },
    resultsCount: {
        fontSize: 12,
        fontWeight: '700',
        color: '#999',
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    resultCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        padding: 12,
    },
    imageContainer: {
        width: 100,
        height: 100,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F1F2F6',
    },
    offerImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        flex: 1,
        backgroundColor: '#E1E1E1',
    },
    typeBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        backgroundColor: '#FF4757',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    typeBadgeText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: '900',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    storeName: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FF4757',
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 15,
        fontWeight: '800',
        color: '#2D3436',
        marginVertical: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timerText: {
        fontSize: 11,
        color: '#999',
        fontWeight: '600',
        marginLeft: 4,
    },
    viewBtn: {
        backgroundColor: '#3F51B5',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 8,
    },
    viewBtnText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#2D3436',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
});

export default SearchResultsScreen;
