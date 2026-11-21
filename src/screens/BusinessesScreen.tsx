import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

const BusinessesScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const fetchBusinesses = async () => {
        try {
            const response = await api.get('/users/businesses');
            setBusinesses(response.data || []);
        } catch (error) {
            console.error('Failed to fetch businesses:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBusinesses = businesses.filter(biz =>
        biz.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.business_branches?.some((branch: any) =>
            branch.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            branch.area?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    const renderBusinessItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ShopDetails', { shopId: item.id })}
        >
            <Image
                source={{ uri: item.logo_url || 'https://via.placeholder.com/100' }}
                style={styles.logo}
            />
            <View style={styles.content}>
                <Text style={styles.name}>{item.business_name}</Text>
                <Text style={styles.type}>{item.business_type}</Text>
                <Text style={styles.location}>
                    {item.business_branches?.[0]?.area ? `${item.business_branches[0].area}, ` : ''}
                    {item.business_branches?.[0]?.city || 'Unknown Location'}
                </Text>
            </View>
            <View style={styles.arrowContainer}>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={28} color="#1A1A1A" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>All Businesses</Text>
                    <Text style={styles.subtitle}>{businesses.length} shops found</Text>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={22} color="#999" style={{ marginRight: 10 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search shop or location..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#999"
                />
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#3F51B5" />
                </View>
            ) : (
                <FlatList
                    data={filteredBusinesses}
                    renderItem={renderBusinessItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No businesses found</Text>
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
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        marginRight: 15,
        padding: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginBottom: 15,
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    logo: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F0F0F0',
    },
    content: {
        flex: 1,
        marginLeft: 15,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    type: {
        fontSize: 12,
        color: '#3F51B5',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    location: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    arrowContainer: {
        paddingLeft: 10,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});

export default BusinessesScreen;
