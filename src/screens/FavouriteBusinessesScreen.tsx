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

const FavouriteBusinessesScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchFavourites = async () => {
        try {
            const response = await api.get('/users/profile');
            // Assuming profile returns user_followed_businesses
            setBusinesses(response.data?.user_followed_businesses || []);
        } catch (error) {
            console.error('Fetch favourite businesses error', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchFavourites();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchFavourites();
    };

    const renderBusiness = ({ item }: { item: any }) => {
        const business = item.businesses;
        if (!business) return null;

        return (
            <TouchableOpacity
                style={styles.bizCard}
                onPress={() => navigation.navigate('ShopDetails', { shopId: business.id })}
            >
                <View style={styles.logoContainer}>
                    {business.logo_url ? (
                        <Image source={{ uri: business.logo_url }} style={styles.bizLogo} />
                    ) : (
                        <View style={[styles.bizLogo, { backgroundColor: '#F0F2FF' }]}>
                            <Text style={styles.logoChars}>{business.business_name?.[0]}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.bizInfo}>
                    <View style={styles.bizRow}>
                        <Text style={styles.bizName} numberOfLines={1}>{business.business_name}</Text>
                        {business.is_verified && <Icon name="check-decagram" size={16} color="#4CAF50" style={{ marginLeft: 4 }} />}
                    </View>
                    <Text style={styles.bizType}>{business.business_type} • {business.bio || 'Favorite Store'}</Text>
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
                <Text style={styles.headerTitle}>Favourite Businesses</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3F51B5" />
                </View>
            ) : businesses.length === 0 ? (
                <View style={styles.center}>
                    <Icon name="store-outline" size={64} color="#EEE" />
                    <Text style={styles.emptyTitle}>No favorite stores</Text>
                    <Text style={styles.emptySubtitle}>Stores you follow will appear here.</Text>
                </View>
            ) : (
                <FlatList
                    data={businesses}
                    renderItem={renderBusiness}
                    keyExtractor={(item: any) => item.business_id}
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
    bizCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    logoContainer: {
        marginRight: 15,
    },
    bizLogo: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoChars: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3F51B5',
    },
    bizInfo: {
        flex: 1,
    },
    bizRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    bizName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    bizType: {
        fontSize: 13,
        color: '#666',
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

export default FavouriteBusinessesScreen;
