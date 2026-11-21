import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    ActivityIndicator,
    TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

const AffiliateStoresScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [stores, setStores] = useState<any[]>([]);
    const [filteredStores, setFilteredStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchStores();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = stores.filter(store =>
                store.name.toLowerCase().includes(lowerQuery) ||
                store.description?.toLowerCase().includes(lowerQuery)
            );
            setFilteredStores(filtered);
        } else {
            setFilteredStores(stores);
        }
    }, [searchQuery, stores]);

    const fetchStores = async () => {
        try {
            setLoading(true);
            const response = await api.get('/affiliate/stores');
            setStores(response.data || []);
            setFilteredStores(response.data || []);
        } catch (error) {
            console.error('Fetch affiliate stores error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageError = (id: string) => {
        setImageErrors(prev => ({ ...prev, [id]: true }));
    };

    const renderStore = ({ item }: { item: any }) => {
        const hasError = imageErrors[item.id];

        return (
            <TouchableOpacity
                style={styles.storeCard}
                onPress={() => navigation.navigate('AffiliateOffers', {
                    storeId: item.id,
                    storeName: item.name,
                    storeSlug: item.slug
                })}
            >
                <View style={[styles.logoContainer, { borderColor: item.brand_color || '#eee' }]}>
                    {item.logo_url && !hasError ? (
                        <Image
                            source={{ uri: item.logo_url }}
                            style={styles.storeLogo}
                            resizeMode="contain"
                            onError={() => handleImageError(item.id)}
                        />
                    ) : (
                        <View style={[styles.fallbackLogo, { backgroundColor: (item.brand_color || '#999') + '15' }]}>
                            <Text style={[styles.fallbackText, { color: item.brand_color || '#666' }]}>
                                {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                            </Text>
                        </View>
                    )}
                </View>

                <Text style={styles.storeName} numberOfLines={1}>{item.name}</Text>
                {/* Cashback tag removed */}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3436" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Official Brands</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search stores..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#999"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3F51B5" />
                </View>
            ) : (
                <FlatList
                    data={filteredStores}
                    renderItem={renderStore}
                    keyExtractor={(item) => item.id}
                    numColumns={3}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="store-search-outline" size={48} color="#CCC" />
                            <Text style={styles.emptyText}>No stores found matching "{searchQuery}"</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3436',
    },
    placeholder: {
        width: 40,
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#FFF',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F2F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 46,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#2D3436',
        height: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    columnWrapper: {
        justifyContent: 'flex-start',
        gap: 12,
    },
    storeCard: {
        width: '31%', // roughly 1/3 minus gap
        alignItems: 'center',
        marginBottom: 20,
        marginRight: '2%', // small gap
    },
    logoContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    storeLogo: {
        width: '70%',
        height: '70%',
    },
    fallbackLogo: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fallbackText: {
        fontSize: 24,
        fontWeight: '700',
    },
    storeName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2D3436',
        textAlign: 'center',
        marginBottom: 4,
    },
    cashbackTag: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    cashbackText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#4CAF50',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        marginTop: 16,
        color: '#999',
        fontSize: 14,
    }
});

export default AffiliateStoresScreen;
