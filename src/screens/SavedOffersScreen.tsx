import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

const SavedOffersScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSavedOffers = async () => {
        try {
            const response = await api.get('/users/profile');
            // Assuming profile returns user_saved_offers with offer details
            setOffers(response.data?.user_saved_offers || []);
        } catch (error) {
            console.error('Fetch saved offers error', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSavedOffers();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSavedOffers();
    };

    const renderOffer = ({ item }: { item: any }) => {
        const offer = item.offers; // Based on Prisma schema relation
        if (!offer) return null;

        const media = offer.offer_media?.[0]?.image_url;

        return (
            <TouchableOpacity
                style={styles.offerCard}
                onPress={() => navigation.navigate('OfferDetails', { offer })}
            >
                <Image source={{ uri: media }} style={styles.offerImage} />
                <View style={styles.offerInfo}>
                    <Text style={styles.offerTitle} numberOfLines={1}>{offer.title}</Text>
                    <Text style={styles.offerDesc} numberOfLines={2}>{offer.short_description}</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#CCC" />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="chevron-left" size={28} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved Offers</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3F51B5" />
                </View>
            ) : offers.length === 0 ? (
                <View style={styles.center}>
                    <Icon name="tag-outline" size={64} color="#EEE" />
                    <Text style={styles.emptyTitle}>No saved offers</Text>
                    <Text style={styles.emptySubtitle}>Offers you save will appear here.</Text>
                </View>
            ) : (
                <FlatList
                    data={offers}
                    renderItem={renderOffer}
                    keyExtractor={(item: any) => item.offer_id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3F51B5"]} />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F8FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 15,
        backgroundColor: '#FFF',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    list: {
        padding: 16,
    },
    offerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    offerImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        marginRight: 15,
    },
    offerInfo: {
        flex: 1,
    },
    offerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    offerDesc: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
    },
});

export default SavedOffersScreen;
