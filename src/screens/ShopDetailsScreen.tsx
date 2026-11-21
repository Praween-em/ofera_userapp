import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    Share,
    Alert,
    Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const ShopDetailsScreen = ({ navigation, route }: any) => {
    const { shopId } = route.params;
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [business, setBusiness] = useState<any>(null);
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState<'feed' | 'grid'>('grid');

    useEffect(() => {
        fetchData();
    }, [shopId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const bizRes = await api.get(`/users/business/${shopId}`);
            const bizData = bizRes.data;
            setBusiness(bizData);
            setOffers(bizData.offers || []);
            if (bizData.isFollowing !== undefined) {
                setIsFollowing(bizData.isFollowing);
            }
        } catch (error) {
            console.error('Failed to fetch shop data:', error);
            Alert.alert('Error', 'Failed to load shop details');
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        try {
            if (isFollowing) {
                await api.delete(`/users/follow/${shopId}`);
            } else {
                await api.post(`/users/follow/${shopId}`);
            }
            setIsFollowing(!isFollowing);
        } catch (error) {
            console.error('Follow action failed:', error);
            Alert.alert('Login Required', 'Please login to follow shops');
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${business.business_name} on OfferMarket! They have amazing offers right now.`,
            });
        } catch (error) {
            console.error('Share action failed:', error);
        }
    };

    const handleShareOffer = async (offer: any) => {
        try {
            await Share.share({
                message: `Check out this offer from ${business.business_name}: ${offer.title}\n${offer.short_description}\nJoin OfferMarket for more!`,
            });
            await api.post(`/offers/${offer.id}/share`).catch(() => { });
        } catch (error) {
            console.error('Share offer failed:', error);
        }
    };

    const handleOfferPress = async (offer: any) => {
        navigation.navigate('OfferDetails', { offer });
        // Background tracking
        api.post(`/offers/${offer.id}/view`, {}).catch(() => { });
    };

    const handleSaveOffer = async (offerId: string, isSaved: boolean) => {
        try {
            if (isSaved) {
                await api.delete(`/offers/${offerId}/save`);
            } else {
                await api.post(`/offers/${offerId}/save`);
            }
            fetchData(); // Refresh to update saved state
        } catch (error) {
            Alert.alert('Login Required', 'Please login to save offers');
        }
    };

    const handleContact = (offerId?: string) => {
        const phone = business.whatsapp_number || business.users?.phone;
        if (phone) {
            Alert.alert(
                'Contact Business',
                `Choose how you'd like to reach ${business.business_name}`,
                [
                    {
                        text: 'Call', onPress: () => {
                            Linking.openURL(`tel:${phone}`);
                            if (offerId) api.post(`/offers/${offerId}/lead`, {
                                phone: user?.phone || '',
                                name: user?.display_name || '',
                                type: 'call'
                            }).catch(() => { });
                        }
                    },
                    {
                        text: 'WhatsApp', onPress: () => {
                            Linking.openURL(`whatsapp://send?phone=${phone}`);
                            if (offerId) api.post(`/offers/${offerId}/lead`, {
                                phone: user?.phone || '',
                                name: user?.display_name || '',
                                type: 'whatsapp'
                            }).catch(() => { });
                        }
                    },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        } else {
            Alert.alert('Not Available', 'Contact information is not available for this shop.');
        }
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#3F51B5" />
            </View>
        );
    }

    if (!business) return null;

    const stats = {
        posts: offers.length,
        followers: business._count?.user_followed_businesses || 0,
    };

    const branch = business.business_branches?.[0];
    console.log(branch);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header Sticky Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{business.business_name}</Text>
                <View style={styles.topBarRight}>
                    <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                        <Icon name="share-variant" size={22} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Icon name="dots-vertical" size={22} color="#333" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View style={styles.profileInfo}>
                    <View style={styles.profileTop}>
                        <View style={styles.avatarWrapper}>
                            <View style={styles.storyRing}>
                                <Image
                                    source={{ uri: business.logo_url || 'https://via.placeholder.com/150' }}
                                    style={styles.avatar}
                                />
                            </View>
                        </View>
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.posts}</Text>
                                <Text style={styles.statLabel}>Offers</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.followers}</Text>
                                <Text style={styles.statLabel}>Followers</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>4.5</Text>
                                <Text style={styles.statLabel}>Rating</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.bioSection}>
                        <Text style={styles.businessName}>{business.business_name}</Text>
                        <Text style={styles.category}>{business.business_type}</Text>
                        <Text style={styles.bioText}>
                            {business.bio || `Welcome to ${business.business_name}. Discover our latest exclusive deals and offers!`}
                        </Text>
                        {branch && (
                            <TouchableOpacity
                                style={styles.locationLink}
                                onPress={() => {
                                    const address = [
                                        branch.address_line,
                                        branch.area,
                                        branch.city
                                    ].filter(Boolean).join(', ');
                                    const query = address || business.business_name;
                                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
                                }}
                            >
                                <Icon name="map-marker" size={18} color="#666" />
                                <Text style={styles.locationText}>
                                    {branch.address_line}, {branch.area ? `${branch.area}, ` : ''}{branch.city}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.btn, isFollowing ? styles.btnFollowing : styles.btnFollow]}
                            onPress={handleFollow}
                        >
                            <Text style={isFollowing ? styles.btnTextFollowing : styles.btnTextFollow}>
                                {isFollowing ? 'Following' : 'Follow'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.btnSecondary}
                            onPress={() => handleContact()}
                        >
                            <Text style={styles.btnTextSecondary}>Contact</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtnSmall}>
                            <Icon name="account-plus-outline" size={20} color="#333" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'grid' && styles.activeTab]}
                        onPress={() => setActiveTab('grid')}
                    >
                        <Icon
                            name="grid"
                            size={24}
                            color={activeTab === 'grid' ? '#1A1A1A' : '#999'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
                        onPress={() => setActiveTab('feed')}
                    >
                        <Icon
                            name="format-list-bulleted"
                            size={24}
                            color={activeTab === 'feed' ? '#1A1A1A' : '#999'}
                        />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                {activeTab === 'grid' ? (
                    <View style={styles.grid}>
                        {offers.map((offer) => (
                            <TouchableOpacity
                                key={offer.id}
                                style={styles.tile}
                                onPress={() => handleOfferPress(offer)}
                            >
                                <Image
                                    source={{ uri: offer.offer_media?.[0]?.image_url || 'https://via.placeholder.com/200' }}
                                    style={styles.tileImage}
                                />
                                <View style={styles.tileOverlay}>
                                    <View style={styles.tileMetrics}>
                                        <View style={styles.tileMetricItem}>
                                            <Icon name="eye-outline" size={12} color="#FFF" />
                                            <Text style={styles.tileMetricText}>{offer._count?.offer_views || 0}</Text>
                                        </View>
                                        <View style={styles.tileMetricItem}>
                                            <Icon name="share-variant" size={10} color="#FFF" />
                                            <Text style={styles.tileMetricText}>{offer._count?.offer_clicks || 0}</Text>
                                        </View>
                                    </View>
                                </View>
                                {offer.status === 'active' && (
                                    <View style={styles.tileBadge}>
                                        <Text style={styles.tileBadgeText}>🔥</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.feed}>
                        {offers.map((offer) => (
                            <View key={offer.id} style={styles.feedCard}>
                                <TouchableOpacity onPress={() => handleOfferPress(offer)}>
                                    <Image
                                        source={{ uri: offer.offer_media?.[0]?.image_url || 'https://via.placeholder.com/400' }}
                                        style={styles.feedImage}
                                    />
                                </TouchableOpacity>
                                <View style={styles.feedInfo}>
                                    <View style={styles.feedHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.feedTitle}>{offer.title}</Text>
                                            <Text style={styles.feedDesc} numberOfLines={2}>{offer.short_description}</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => handleSaveOffer(offer.id, !!offer.user_saved_offers?.length)}
                                            style={styles.feedActionBtn}
                                        >
                                            <Icon
                                                name={offer.user_saved_offers?.length ? "bookmark" : "bookmark-outline"}
                                                size={24}
                                                color={offer.user_saved_offers?.length ? "#3F51B5" : "#666"}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.feedActions}>
                                        <View style={styles.feedEngagement}>
                                            <View style={styles.engagementItem}>
                                                <Icon name="eye-outline" size={18} color="#666" />
                                                <Text style={styles.engagementText}>{offer._count?.offer_views || 0}</Text>
                                            </View>
                                            <View style={styles.engagementItem}>
                                                <Icon name="share-variant-outline" size={16} color="#666" />
                                                <Text style={styles.engagementText}>{offer.offer_metrics?.shares || 0}</Text>
                                            </View>
                                            <View style={styles.engagementItem}>
                                                <Icon name="cursor-default-click-outline" size={16} color="#666" />
                                                <Text style={styles.engagementText}>{offer._count?.offer_clicks || 0}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.feedInteractionBtns}>
                                            <TouchableOpacity
                                                style={styles.feedActionIcon}
                                                onPress={() => handleShareOffer(offer)}
                                            >
                                                <Icon name="share-variant" size={22} color="#666" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.feedContactBtn, { backgroundColor: '#25D366' }]}
                                                onPress={() => handleContact(offer.id)}
                                            >
                                                <Icon name="whatsapp" size={18} color="#FFF" />
                                                <Text style={styles.feedContactText}>WhatsApp</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {offers.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Icon name="tag-off-outline" size={60} color="#DDD" />
                        <Text style={styles.emptyText}>No active offers at the moment</Text>
                    </View>
                )}

                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        height: 50,
        backgroundColor: '#FFF',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        flex: 1,
        marginHorizontal: 15,
    },
    topBarRight: {
        flexDirection: 'row',
        gap: 5,
    },
    iconBtn: {
        padding: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    profileTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrapper: {
        width: 90,
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyRing: {
        width: 86,
        height: 86,
        borderRadius: 43,
        padding: 3,
        borderWidth: 2,
        elevation: 2,
        borderColor: '#EFEFEF',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#EFEFEF',
        overflow: 'hidden',
        elevation: 2,
        backgroundColor: '#F0F0F0',
    },
    statsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginLeft: 10,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    bioSection: {
        marginTop: 12,
    },
    businessName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    category: {
        fontSize: 14,
        color: '#666',
        marginTop: 1,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    bioText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#333',
        marginTop: 4,
    },
    locationLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    locationText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 4,
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 15,
        gap: 8,
        alignItems: 'center',
    },
    btn: {
        flex: 1,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnFollow: {
        backgroundColor: '#FF5722',
        borderWidth: 1,
        borderColor: '#FF5722',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    btnFollowing: {
        backgroundColor: '#EFEFEF',
    },
    btnTextFollow: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    btnTextFollowing: {
        color: '#1A1A1A',
        fontWeight: 'bold',
    },
    btnSecondary: {
        flex: 1,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#EFEFEF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnTextSecondary: {
        color: '#1A1A1A',
        fontWeight: 'bold',
    },
    iconBtnSmall: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#EFEFEF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabs: {
        flexDirection: 'row',
        marginTop: 20,
        borderTopWidth: 0.5,
        borderColor: '#EEE',
    },
    tab: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 1.5,
        borderColor: '#1A1A1A',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tile: {
        width: width / 3,
        aspectRatio: 1,
        borderWidth: 0.5,
        borderColor: '#FFF',
    },
    tileImage: {
        width: '100%',
        height: '100%',
    },
    tileBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
    },
    tileBadgeText: {
        fontSize: 12,
    },
    tileOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'flex-end',
        padding: 5,
    },
    tileMetrics: {
        flexDirection: 'row',
        gap: 6,
    },
    tileMetricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    tileMetricText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    feed: {
        padding: 15,
    },
    feedCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    feedImage: {
        width: '100%',
        height: 250,
        backgroundColor: '#F0F0F0',
    },
    feedInfo: {
        padding: 12,
    },
    feedHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    feedTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    feedDesc: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    feedActionBtn: {
        padding: 5,
    },
    feedActions: {
        marginTop: 15,
        paddingTop: 12,
        borderTopWidth: 1,
        borderColor: '#F0F0F0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    feedEngagement: {
        flexDirection: 'row',
        gap: 12,
    },
    engagementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    engagementText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    feedInteractionBtns: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    feedActionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    feedContactBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    feedContactText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        marginTop: 20,
    },
    emptyText: {
        marginTop: 15,
        color: '#999',
        fontSize: 15,
        fontWeight: '500',
    },
});

export default ShopDetailsScreen;
