import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Image,
    Dimensions,
    Share,
    StatusBar,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
    Linking,
    FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

import { wrapAffiliateLink } from '../utils/affiliate';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 400;

const OfferDetailsScreen = ({ route, navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { offer: initialOffer } = route.params;
    const [offer, setOffer] = useState(initialOffer);
    const [fullBusiness, setFullBusiness] = useState<any>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const scrollY = useRef(new Animated.Value(0)).current;
    const imageScrollRef = useRef<ScrollView>(null);

    const business = offer.business_branches?.businesses || offer.businesses;
    const websiteurl = business.website;
    // For offer details, business_branches is a single object because an offer belongs to one specific branch
    const branch = offer.business_branches;


    const metrics = offer.offer_metrics || { views: 0, leads: 0, claims: 0 };
    const rawImages = offer.offer_media || [];
    const images = offer.offer_media || []; // Remove .slice(0, 3) to show all images

    useEffect(() => {
        fetchOfferDetails();
        checkIfOfferIsSaved();
        trackView();
    }, []);

    const checkIfOfferIsSaved = async () => {
        try {
            // Fetch the user's profile which includes saved offers
            const response = await api.get('/users/profile');
            const savedOffers = response.data?.user_saved_offers || [];

            // Check if current offer ID exists in the saved offers list
            // savedOffers contains objects with offer_id and offers (the full offer object)
            const isOfferSaved = savedOffers.some((savedOffer: any) => savedOffer.offer_id === offer.id);

            console.log('Saved offers check:', {
                currentOfferId: offer.id,
                totalSavedOffers: savedOffers.length,
                isOfferSaved
            });

            setIsSaved(isOfferSaved);
        } catch (error) {
            console.error('Failed to fetch saved offers:', error);
            // If fetch fails, keep the current state
        }
    };

    const fetchOfferDetails = async () => {
        try {
            // 1. Fetch full offer details (to get all media/images)
            const offerResponse = await api.get(`/offers/${offer.id}`);
            if (offerResponse.data) {
                console.log('Offer details fetched for ID:', offerResponse.data.id);
                setOffer(offerResponse.data);
            }

            // 2. Fetch business details
            if (business?.id) {
                const bizResponse = await api.get(`/users/business/${business.id}`);
                const data = bizResponse.data;
                setFullBusiness(data);
                if (data?.isFollowing !== undefined) {
                    setIsFollowing(data.isFollowing);
                }
            }
        } catch (error) {
            console.error('Failed to fetch details', error);
        }
    };

    const trackView = async () => {
        api.post(`/offers/${offer.id}/view`, {}).catch(() => { });
    };

    const trackLead = async (type: string) => {
        api.post(`/offers/${offer.id}/lead`, {
            type,
            phone: user?.phone || '',
            name: user?.display_name || ''
        }).catch(() => { });
    };

    const handleShare = async () => {
        try {
            const shareMessage = `🔥 Check out this offer from ${business?.business_name || 'Offer Market'}:\n\n*${offer.title}*\n\nOpen in app: offermarket://offer/${offer.id}`;

            await Share.share({
                message: shareMessage,
                title: offer.title,
            });
            trackShare();
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const trackShare = async () => {
        api.post(`/offers/${offer.id}/share`).catch(() => { });
    };

    const handleSaveOffer = async () => {
        try {
            console.log('handleSaveOffer called, current isSaved:', isSaved);
            if (isSaved) {
                await api.delete(`/offers/${offer.id}/save`);
                console.log('Offer unsaved successfully');
                setIsSaved(false);
            } else {
                await api.post(`/offers/${offer.id}/save`);
                console.log('Offer saved successfully');
                setIsSaved(true);
            }
        } catch (error) {
            console.error('Save/unsave error:', error);
            Alert.alert('Login Required', 'Please login to save offers');
        }
    };

    const handleFollow = async () => {
        if (!business?.id) return;
        try {
            if (isFollowing) {
                await api.delete(`/users/follow/${business.id}`);
                setIsFollowing(false);
            } else {
                await api.post(`/users/follow/${business.id}`);
                setIsFollowing(true);
            }
        } catch (error) {
            console.error('Follow failed', error);
        }
    };

    const getOfferTypeLabel = (type: string) => {
        const labels: any = {
            'flat': 'Flat Amount',
            'percentage': 'Percentage Off',
            'buy_x_get_y': 'Buy X Get Y',
            'bogo': 'Buy 1 Get 1',
            'cashback': 'Cashback',
            'tiered_volume': 'Tiered Volume',
            'tiered_spending': 'Tiered Spending',
            'bundle_fixed_price': 'Bundle Deal',
            'free_gift': 'Free Gift',
            'none': 'Regular Price'
        };
        return labels[type] || 'Special Offer';
    };

    const getOfferTypeIcon = (type: string) => {
        const icons: any = {
            'flat': 'ticket-percent-outline',
            'percentage': 'brightness-percent',
            'buy_x_get_y': 'basket-outline',
            'bogo': 'cards-outline',
            'cashback': 'cash-multiple',
            'free_gift': 'auto-fix',
            'tiered_volume': 'layers-triple-outline',
            'tiered_spending': 'finance',
            'bundle_fixed_price': 'bundle-outline',
            'none': 'cart-outline',
        };
        return icons[type] || 'tag-outline';
    };

    const getOfferTypeColor = (type: string) => {
        const colors: any = {
            'flat': '#4834D4',
            'percentage': '#FF4757',
            'buy_x_get_y': '#F0932B',
            'bogo': '#22A6B3',
            'cashback': '#27AE60',
            'free_gift': '#BE2EDD',
        };
        return colors[type] || '#FF4757';
    };

    const renderRuleDescription = (rule: any, itemName: string) => {
        const type = rule.rule_type;
        const discount = Number(rule.discount_value);
        const buy = rule.buy_quantity;
        const get = rule.get_quantity;
        const cond = rule.conditions || {};

        switch (type) {
            case 'flat': return `Discount of ₹${discount} on ${itemName}`;
            case 'percentage': return `Discount of ${discount}% on ${itemName}`;
            case 'buy_x_get_y': return `Buy ${itemName} (x${buy}) with FREE ${cond.gift || itemName} (x${get})`;
            case 'bogo': return `Buy 1 ${itemName} with FREE 1 ${cond.gift || itemName}`;
            case 'cashback': return `Cashback of ₹${discount} on ${itemName}`;
            case 'none': return `${itemName} at Best Price`;
            default: return `${itemName} Special Offer`;
        }
    };

    const getExpiryText = (date: string) => {
        const remaining = new Date(date).getTime() - new Date().getTime();
        if (remaining <= 0) return 'Expired';
        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days}d ${hours}h left`;
        return `${hours}h left`;
    };

    // Parallax Interpolations
    const headerTranslateY = scrollY.interpolate({
        inputRange: [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
        outputRange: [HEADER_HEIGHT / 2, 0, -HEADER_HEIGHT / 3],
        extrapolate: 'clamp',
    });

    const imageScale = scrollY.interpolate({
        inputRange: [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
        outputRange: [2, 1, 1],
        extrapolate: 'clamp',
    });

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_HEIGHT - 100],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const renderHeroImage = ({ item }: { item: any }) => (
        <Image source={{ uri: item.image_url || item.url }} style={styles.heroImage} resizeMode="cover" />
    );

    const scrollToImage = (index: number) => {
        setActiveImageIndex(index);
        (imageScrollRef.current as any)?.scrollToIndex({ index, animated: true });
    };

    const handleGetDeal = async () => {
        if (offer.affiliate_url) {
            const wrappedUrl = wrapAffiliateLink(offer.affiliate_url, user?.userId);
            Linking.openURL(wrappedUrl).catch(err => console.error('Failed to open URL', err));
            api.post(`/offers/${offer.id}/click`, { action: 'affiliate_visit' }).catch(() => { });
        } else {
            handleSaveOffer();
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Sticky Header */}
            <Animated.View style={[styles.stickyHeader, { height: insets.top + 60, opacity: headerOpacity }]}>
                <View style={[styles.stickyHeaderInner, { paddingTop: insets.top }]}>
                    <Text style={styles.stickyTitle} numberOfLines={1}>{offer.title}</Text>
                </View>
            </Animated.View>

            {/* Top Controls */}
            <View style={[styles.topControls, { top: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Icon name="arrow-left" size={24} color="#2D3436" />
                </TouchableOpacity>
                <View style={styles.headerRight}>
                    {/* Share/Save buttons optionally kept here for reach, but also added to Metrics HUD below */}
                </View>
            </View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            >
                {/* Parallax Hero Section */}
                <Animated.View style={[styles.heroContainer, { transform: [{ translateY: headerTranslateY }] }]}>
                    <Animated.View style={[styles.imageWrapper, { transform: [{ scale: imageScale }] }]}>
                        {images.length > 0 ? (
                            <>
                                <FlatList
                                    ref={imageScrollRef as any}
                                    data={images}
                                    keyExtractor={(_, i) => i.toString()}
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    nestedScrollEnabled={true}
                                    onMomentumScrollEnd={(e) => {
                                        const index = Math.round(e.nativeEvent.contentOffset.x / width);
                                        setActiveImageIndex(index);
                                    }}
                                    getItemLayout={(_, index) => ({
                                        length: width,
                                        offset: width * index,
                                        index,
                                    })}
                                    renderItem={({ item }) => (
                                        <View style={{ width: width, height: HEADER_HEIGHT }}>
                                            <Image
                                                source={{ uri: item.image_url || item.url }}
                                                style={{ width: '100%', height: '100%' }}
                                                resizeMode="cover"
                                            />
                                        </View>
                                    )}
                                />

                                {images.length > 1 && (
                                    <View style={styles.pagingDotsContainer}>
                                        {images.map((_: any, i: number) => (
                                            <View
                                                key={i}
                                                style={[
                                                    styles.pagingDot,
                                                    i === activeImageIndex && styles.pagingDotActive
                                                ]}
                                            />
                                        ))}
                                    </View>
                                )}

                                {/* Image Counter Badge */}
                                <View style={styles.imageCounter}>
                                    <Text style={styles.imageCounterText}>{activeImageIndex + 1}/{images.length}</Text>
                                </View>

                                {images.length > 1 && (
                                    <View style={styles.thumbnailContainer}>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={styles.thumbnailList}
                                        >
                                            {images.map((img: any, i: number) => (
                                                <TouchableOpacity
                                                    key={i}
                                                    onPress={() => scrollToImage(i)}
                                                    style={[
                                                        styles.thumbnailWrapper,
                                                        i === activeImageIndex && styles.activeThumbnail
                                                    ]}
                                                >
                                                    <Image source={{ uri: img.image_url || img.url }} style={styles.thumbnailImage} />
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={[styles.heroImage, styles.placeholderBg]}>
                                <Icon name="image-outline" size={80} color="#BBB" />
                            </View>
                        )}
                    </Animated.View>
                    <View style={styles.gradientOverlay} pointerEvents="none" />
                </Animated.View>

                {/* Content Card */}
                <View style={styles.contentCard}>
                    {/* 0. Offer Title (Moved to top) */}
                    <View style={styles.titleSection}>
                        <Text style={styles.offerMainTitle}>{offer.title}</Text>
                    </View>

                    {/* 1. Metrics HUD Row (Metrics on Left, Actions on Right) */}
                    <View style={styles.metricsActionRow}>
                        <View style={styles.topMetricsHUD}>
                            <View style={styles.hudItem}>
                                <Icon name="eye-outline" size={14} color="#636E72" />
                                <Text style={styles.hudValue}>{metrics.views}</Text>
                            </View>
                            <View style={styles.hudDivider} />
                            <View style={styles.hudItem}>
                                <Icon name="bookmark-outline" size={12} color="#636E72" />
                                <Text style={styles.hudValue}>{metrics.claims}</Text>
                            </View>
                            <View style={styles.hudDivider} />
                            <View style={styles.hudItem}>
                                <Icon name="clock-outline" size={12} color="#FF4757" />
                                <Text style={[styles.hudValue, { color: '#FF4757' }]}>{getExpiryText(offer.end_date)}</Text>
                            </View>
                        </View>
                        <View style={styles.metricsActions}>
                            <TouchableOpacity style={styles.miniHUDAction} onPress={handleShare}>
                                <Icon name="share-variant" size={18} color="#2D3436" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.miniHUDAction} onPress={handleSaveOffer}>
                                <Icon name={isSaved ? "bookmark" : "bookmark-outline"} size={18} color={isSaved ? "#FF4757" : "#2D3436"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 2. Business Profile Row (Logo, Name+Followers, Follow Btn) */}
                    <View style={styles.businessProfileRow}>
                        <TouchableOpacity
                            style={styles.bizProfileMain}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('ShopDetails', { shopId: business?.id })}
                        >
                            <View style={styles.bizAvatarWrapper}>
                                {business?.logo_url ? (
                                    <Image source={{ uri: business.logo_url }} style={styles.bizAvatar} />
                                ) : (
                                    <View style={[styles.bizAvatar, { backgroundColor: '#F1F2F6' }]}>
                                        <Text style={styles.bizInitial}>{business?.business_name?.[0]}</Text>
                                    </View>
                                )}
                                <View style={styles.bizVerifiedBadge}>
                                    <Icon name="check-decagram" size={10} color="#FFF" />
                                </View>
                            </View>
                            <View style={styles.bizProfileInfo}>
                                <Text style={styles.bizProfileName}>{business?.business_name || 'Business'}</Text>
                                <Text style={styles.bizFollowersCount}>
                                    {fullBusiness?._count?.user_followed_businesses || 0} Followers
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.miniFollowBtn, isFollowing && styles.miniFollowingBtn]}
                            onPress={handleFollow}
                        >
                            <Text style={[styles.miniFollowText, isFollowing && styles.miniFollowingText]}>
                                {isFollowing ? 'Following' : 'Follow'}
                            </Text>
                        </TouchableOpacity>
                    </View>


                    {/* 4. Available Deals */}
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}><Icon name="tag-multiple" size={12} color="#666" /></View>
                        <Text style={styles.sectionTitle}>  Offer details </Text>
                    </View>

                    {offer.offer_rules?.map((rule: any, idx: number) => (
                        <View key={idx} style={styles.denseVariationCard}>
                            <View style={styles.variationMain}>
                                <View style={[styles.variationIconBox, { backgroundColor: getOfferTypeColor(rule.rule_type) + '15' }]}>
                                    <Icon name={getOfferTypeIcon(rule.rule_type)} size={22} color={getOfferTypeColor(rule.rule_type)} />
                                </View>
                                <View style={styles.variationDetails}>
                                    <Text style={styles.variationLabel}>{getOfferTypeLabel(rule.rule_type)}</Text>
                                    <Text style={styles.variationValue}>{renderRuleDescription(rule, offer.title)}</Text>
                                </View>
                                {rule.rule_type === 'percentage' && (
                                    <View style={[styles.miniSaveBadge, { backgroundColor: getOfferTypeColor('percentage') }]}>
                                        <Text style={styles.saveBadgeText}>{rule.discount_value}% OFF</Text>
                                    </View>
                                )}
                            </View>

                            {rule.conditions?.gift && (
                                <View style={styles.denseGiftBox}>
                                    <Icon name="gift-outline" size={16} color="#FF9F43" />
                                    <Text style={styles.giftNameText}>{rule.conditions.gift}</Text>
                                </View>
                            )}

                            {rule.conditions?.original_price > 0 && !['buy_x_get_y', 'bogo'].includes(rule.rule_type) && (
                                <View style={styles.densePricingRow}>
                                    <View style={styles.priceCol}>
                                        <Text style={styles.priceLabel}>Regular</Text>
                                        <Text style={styles.oldPrice}>₹{rule.conditions.original_price}</Text>
                                    </View>
                                    <Icon name="chevron-double-right" size={12} color="#D1D5DB" />
                                    <View style={styles.priceCol}>
                                        <Text style={styles.priceLabel}>Offer Price</Text>
                                        <Text style={styles.newPrice}>₹{rule.conditions.offer_price}</Text>
                                    </View>
                                    {rule.conditions.original_price - rule.conditions.offer_price > 0 && (
                                        <View style={styles.denseSavePill}>
                                            <Text style={styles.denseSavePillText}>SAVE ₹{Math.floor(rule.conditions.original_price - rule.conditions.offer_price)}</Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Card Multi-Actions */}
                            <View style={styles.cardActionRow}>
                                <TouchableOpacity
                                    style={[styles.cardActionBtn, { backgroundColor: '#25D366' }]}
                                    onPress={() => {
                                        const phone = business?.whatsapp_number || business?.phone;
                                        if (phone) Linking.openURL(`whatsapp://send?phone=${phone}&text=Hi, I'm interested in: ${offer.title} (${getOfferTypeLabel(rule.rule_type)})`);
                                        trackLead('whatsapp');
                                    }}
                                >
                                    <Icon name="whatsapp" size={18} color="#FFF" />
                                    <Text style={[styles.cardActionBtnText, { color: '#FFF' }]}>WhatsApp</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.cardActionBtn, { backgroundColor: '#4285F4' }]}
                                    onPress={() => {
                                        const address = [
                                            branch?.address_line,
                                            branch?.area,
                                            branch?.city
                                        ].filter(Boolean).join(', ');

                                        const query = address || branch?.address_line || 'Store';

                                        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

                                        Linking.openURL(url);
                                        trackLead('navigation');
                                    }}
                                >
                                    <Icon name="map-marker" size={18} color="#FFF" />
                                    <Text style={[styles.cardActionBtnText, { color: '#FFF' }]}>Visit Store</Text>
                                </TouchableOpacity>
                                {websiteurl && (
                                    <TouchableOpacity
                                        style={styles.websiteBtn}
                                        onPress={() => Linking.openURL(websiteurl)}
                                    >
                                        <Icon name="web" size={18} color="#FFF" />
                                        <Text style={[styles.cardActionBtnText, { color: '#FFF' }]}>
                                            {websiteurl.replace('https://', '').replace('http://', '')}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}

                    {/* 5. Description */}
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}><Icon name="text" size={16} color="#666" /></View>
                        <Text style={styles.sectionTitle}>  Description</Text>
                    </View>
                    <Text style={styles.offerDescriptionText}>
                        {offer.description || offer.short_description}
                    </Text>


                </View>
            </Animated.ScrollView>

            {/* Sticky Action Hook: Contact Now */}
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                <TouchableOpacity
                    style={styles.mainContactBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                        const phone = business?.phone || business?.whatsapp_number;
                        if (phone) Linking.openURL(`tel:${phone}`);
                        trackLead('call');
                    }}
                >
                    <Icon name="phone" size={22} color="#FFF" />
                    <Text style={styles.mainContactBtnText}>Contact Now</Text>
                    <Icon name="arrow-right" size={22} style={{ marginLeft: 5, marginTop: 2, fontWeight: 'bold' }} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        zIndex: 1000,
        elevation: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    stickyHeaderInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    stickyTitle: { fontSize: 14, fontWeight: '900', color: '#2D3436', textTransform: 'uppercase', letterSpacing: 0.5 },
    topControls: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 1100,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerRight: { flexDirection: 'row', gap: 8 },
    heroContainer: { width: width, height: HEADER_HEIGHT, overflow: 'hidden' },
    imageWrapper: { width: width, height: '100%' },
    heroImage: { width: width, height: HEADER_HEIGHT },
    placeholderBg: { backgroundColor: '#F1F2F6', justifyContent: 'center', alignItems: 'center' },
    imageCounter: {
        position: 'absolute',
        top: 60,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    imageCounterText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
    },
    thumbnailContainer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
    },
    thumbnailList: {
        gap: 6,
    },
    thumbnailWrapper: {
        width: 40,
        height: 40,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'transparent',
        backgroundColor: '#FFF',
    },
    activeThumbnail: {
        borderColor: '#FF4757',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    gradientOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
    pagingDotsContainer: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    websiteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    pagingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    pagingDotActive: {
        backgroundColor: '#FFF',
        width: 14,
    },
    heroContent: { position: 'absolute', bottom: 50, left: 24, right: 24 },
    badgeRow: { flexDirection: 'row', marginBottom: 10, gap: 6 },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF4757',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    limitedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2D3436',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    premiumBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    heroTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFF',
        lineHeight: 34,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    contentCard: {
        marginTop: -40,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        minHeight: 600,
    },
    metricsActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    topMetricsHUD: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    hudItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    hudValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2D3436',
    },
    hudDivider: {
        width: 1,
        height: 12,
        backgroundColor: '#D1D5DB',
        marginHorizontal: 8,
    },
    metricsActions: {
        flexDirection: 'row',
        gap: 8,
    },
    miniHUDAction: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    businessProfileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    bizProfileMain: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    bizAvatarWrapper: {
        position: 'relative',
    },
    bizAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: '#F1F2F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bizAvatarPlaceholder: {
        backgroundColor: '#F1F2F6',
    },
    bizInitial: {
        fontSize: 20,
        fontWeight: '800',
        color: '#636E72',
    },
    bizVerifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#0984E3',
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    bizProfileInfo: {
        marginLeft: 12,
    },
    bizProfileName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2D3436',
    },
    bizFollowersCount: {
        fontSize: 12,
        color: '#636E72',
        fontWeight: '600',
        marginTop: 2,
    },
    miniFollowBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FF4757',
    },
    miniFollowingBtn: {
        backgroundColor: '#F1F2F6',
    },
    miniFollowText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFF',
    },
    miniFollowingText: {
        color: '#636E72',
    },
    titleSection: {
        marginBottom: 8,
    },
    offerMainTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#2D3436',
        lineHeight: 30,
    },
    offerDescriptionText: {
        fontSize: 15,
        color: '#636E72',
        lineHeight: 24,

    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,


    },
    sectionIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#F1F2F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#2D3436' },
    denseVariationCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#F1F2F6',
    },
    variationMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    variationIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#FF475708',
        justifyContent: 'center',
        alignItems: 'center',
    },
    variationDetails: { flex: 1 },
    variationLabel: { fontSize: 10, color: '#B2BEC3', fontWeight: '900', textTransform: 'uppercase' },
    variationValue: { fontSize: 14, fontWeight: '900', color: '#2D3436', marginTop: 1 },
    miniSaveBadge: { backgroundColor: '#FF4757', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
    saveBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
    denseGiftBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFF8F1',
        padding: 10,
        borderRadius: 10,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#FF9F4320',
    },
    giftNameText: { fontSize: 12, fontWeight: '800', color: '#FF9F43' },
    densePricingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F2F6',
        justifyContent: 'space-between',
    },
    priceCol: { flexShrink: 1 },
    denseSavePill: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    denseSavePillText: {
        color: '#27AE60',
        fontSize: 10,
        fontWeight: '900',
    },
    priceLabel: { fontSize: 8, color: '#B2BEC3', fontWeight: '900', marginBottom: 1, textTransform: 'uppercase' },
    oldPrice: { fontSize: 15, fontWeight: '700', color: '#B2BEC3', textDecorationLine: 'line-through' },
    newPrice: { fontSize: 18, fontWeight: '900', color: '#27AE60' },
    contactRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
        marginBottom: 20,
    },
    compactContactBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingVertical: 12,
        gap: 8,
        borderWidth: 1.5,
        borderColor: '#F1F2F6',
    },
    cardActionRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F2F6',
    },
    cardActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
    },
    cardActionBtnText: {
        fontSize: 12,
        fontWeight: '800',
    },
    contactBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#2D3436',
    },
    locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        borderColor: '#F1F2F6',
    },
    mainContactBtn: {
        height: 50,
        backgroundColor: '#FF4757',
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#FF4757',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    mainContactBtnIcon: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
    },
    mainContactBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFF',
    },
});

export default OfferDetailsScreen;
