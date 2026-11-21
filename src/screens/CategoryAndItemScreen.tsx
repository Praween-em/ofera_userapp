import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StatusBar,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import CountdownTimer from '../components/CountdownTimer';

const { width } = Dimensions.get('window');

const CategoryAndItemScreen = ({ route, navigation }: any) => {
    const { categoryId, categoryName, parentCategory } = route.params;
    const insets = useSafeAreaInsets();

    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSubId, setSelectedSubId] = useState(categoryId);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchOffers(undefined, selectedSubId);
    }, [selectedSubId]);

    const fetchOffers = async (nextCursor?: string, id?: string) => {
        if (loading || (!hasMore && nextCursor)) return;
        setLoading(true);

        try {
            const currentId = id || selectedSubId;
            const url = `/offers/feed?categoryId=${currentId}${nextCursor ? `&cursor=${nextCursor}` : ''}`;
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
            console.error('Fetch category offers failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (hasMore && !loading && cursor) {
            fetchOffers(cursor);
        }
    };

    const renderOfferItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.offerCard}
            onPress={() => navigation.navigate('OfferDetails', { offer: item })}
        >
            <View style={styles.imageContainer}>
                {item.offer_media?.[0]?.image_url ? (
                    <Image source={{ uri: item.offer_media[0].image_url }} style={styles.offerImage} />
                ) : (
                    <View style={styles.imagePlaceholder} />
                )}
                <View style={styles.timerBadge}>
                    <CountdownTimer targetDate={new Date(item.end_date)} style={styles.timerText} />
                </View>
            </View>
            <View style={styles.offerInfo}>
                <Text style={styles.storeName} numberOfLines={1}>
                    {item.business_branches?.[0]?.businesses?.business_name || 'Store'}
                </Text>
                <Text style={styles.offerTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.offerFooter}>
                    <Text style={styles.offerType}>{item.offer_rules?.[0]?.rule_type?.toUpperCase() || 'DEAL'}</Text>
                    <View style={styles.claimBtn}>
                        <Text style={styles.claimText}>View</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3436" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{categoryName}</Text>
                    <Text style={styles.headerSubtitle}>{parentCategory?.name || 'Category'}</Text>
                </View>
            </View>

            <View style={styles.content}>
                {/* Left Sidebar - Subcategories */}
                <View style={styles.sidebar}>
                    <FlatList
                        data={[
                            { id: parentCategory?.id, name: 'All', icon: '🌟' },
                            ...(parentCategory?.subCategories || [])
                        ]}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.sideItem,
                                    selectedSubId === item.id && styles.sideItemActive
                                ]}
                                onPress={() => {
                                    setOffers([]);
                                    setHasMore(true);
                                    setSelectedSubId(item.id);
                                }}
                            >
                                <View style={[
                                    styles.sideIconCircle,
                                    selectedSubId === item.id && styles.sideIconCircleActive
                                ]}>
                                    <Text style={styles.sideIcon}>{item.icon || '🔹'}</Text>
                                </View>
                                <Text style={[
                                    styles.sideText,
                                    selectedSubId === item.id && styles.sideTextActive
                                ]} numberOfLines={2}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* Main Results Area */}
                <View style={styles.mainArea}>
                    {loading && offers.length === 0 ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#3F51B5" />
                        </View>
                    ) : offers.length === 0 ? (
                        <View style={styles.center}>
                            <MaterialCommunityIcons name="package-variant" size={64} color="#CCC" />
                            <Text style={styles.emptyText}>No offers found in this category</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={offers}
                            keyExtractor={(item) => item.id}
                            renderItem={renderOfferItem}
                            onEndReached={loadMore}
                            onEndReachedThreshold={0.5}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.listPadding}
                            ListFooterComponent={loading ? <ActivityIndicator size="small" color="#3F51B5" /> : null}
                        />
                    )}
                </View>
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
        padding: 8,
        marginRight: 10,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2D3436',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#636E72',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebar: {
        width: 85,
        backgroundColor: '#F8F9FA',
        borderRightWidth: 1,
        borderRightColor: '#F1F2F6',
    },
    sideItem: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 10,
    },
    sideItemActive: {
        backgroundColor: '#FFF',
    },
    sideIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    sideIconCircleActive: {
        backgroundColor: '#3F51B5',
    },
    sideIcon: {
        fontSize: 18,
    },
    sideText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#636E72',
        textAlign: 'center',
    },
    sideTextActive: {
        color: '#3F51B5',
        fontWeight: '900',
    },
    mainArea: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    listPadding: {
        padding: 15,
        paddingBottom: 30,
    },
    offerCard: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        overflow: 'hidden',
    },
    imageContainer: {
        height: 120,
        backgroundColor: '#F1F2F6',
    },
    offerImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        backgroundColor: '#E1E1E1',
    },
    timerBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    timerText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    offerInfo: {
        padding: 12,
    },
    storeName: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FF4757',
        marginBottom: 4,
    },
    offerTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 10,
    },
    offerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F2F6',
        paddingTop: 8,
    },
    offerType: {
        fontSize: 9,
        fontWeight: '900',
        color: '#999',
    },
    claimBtn: {
        backgroundColor: '#3F51B5',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
    },
    claimText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});

export default CategoryAndItemScreen;
