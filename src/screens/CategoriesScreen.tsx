import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
    Animated,
    TextInput,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';

interface SubCategory {
    id: string;
    name: string;
    icon: string;
}

interface Category {
    id: string;
    name: string;
    subCategories: SubCategory[];
    icon: string;
    color: string;
}

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



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        paddingTop: 10,
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 5,
    },
    screenSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 10,
        color: '#999',
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
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    icon: {
        fontSize: 24,
    },
    headerContent: {
        flex: 1,
    },
    categoryName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    subCount: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },
    arrow: {
        fontSize: 14,
        color: '#CCC',
        transform: [{ rotate: '0deg' }],
    },
    arrowRotated: {
        transform: [{ rotate: '180deg' }],
    },
    subCategoryContainer: {
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginBottom: 12,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        margin: 4,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    chipIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    chipText: {
        fontSize: 13,
        color: '#444',
        fontWeight: '500',
    },
    viewAllButton: {
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

const CategoryItem = React.memo(({ item, isExpanded, onToggle, onSubCategoryPress }: {
    item: Category;
    isExpanded: boolean;
    onToggle: (id: string) => void;
    onSubCategoryPress: (sub: SubCategory) => void;
}) => {
    return (
        <View style={[styles.card, { borderLeftColor: item.color }]}>
            <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => onToggle(item.id)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                    <Text style={styles.icon}>{item.icon}</Text>
                </View>
                <View style={styles.headerContent}>
                    <Text style={styles.categoryName}>{item.name}</Text>
                    <Text style={styles.subCount}>{item.subCategories.length} Sub-categories</Text>
                </View>
                <Text style={[styles.arrow, isExpanded && styles.arrowRotated]}>▼</Text>
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.subCategoryContainer}>
                    <View style={styles.divider} />
                    <View style={styles.chipsContainer}>
                        {item.subCategories.map((sub: SubCategory, index: number) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.chip}
                                onPress={() => onSubCategoryPress(sub)}
                            >
                                <Text style={styles.chipIcon}>{sub.icon}</Text>
                                <Text style={styles.chipText}>{sub.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity
                        style={styles.viewAllButton}
                        onPress={() => onSubCategoryPress({ id: item.id, name: item.name, icon: item.icon } as SubCategory)}
                    >
                        <Text style={[styles.viewAllText, { color: item.color }]}>View All in {item.name} →</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}, (prevProps, nextProps) => {
    return prevProps.isExpanded === nextProps.isExpanded && prevProps.item.id === nextProps.item.id;
});

const CategoriesScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            // Transform backend data to match UI
            const transformed = response.data.map((cat: any) => ({
                id: cat.id,
                name: cat.name,
                subCategories: cat.children ? cat.children.map((child: any) => ({
                    id: child.id,
                    name: child.name,
                    icon: child.icon || '🔹'
                })) : [],
                icon: cat.icon || '📦',
                color: getCategoryColor(cat.name),
            }));
            setCategories(transformed);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = React.useCallback((id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(prevId => prevId === id ? null : id);
    }, []);

    const handleSubCategoryPress = React.useCallback((sub: SubCategory) => {
        navigation.navigate('CategoryAndItem', {
            categoryId: sub.id,
            categoryName: sub.name,
            parentCategory: categories.find(c => c.id === expandedId || c.subCategories.some((s: any) => s.id === sub.id))
        });
    }, [navigation, categories, expandedId]);

    const filteredCategories = React.useMemo(() => {
        const query = searchQuery.toLowerCase();
        if (!query) return categories;

        return categories.filter(cat =>
            cat.name.toLowerCase().includes(query) ||
            cat.subCategories.some((sub: SubCategory) => sub.name.toLowerCase().includes(query))
        );
    }, [categories, searchQuery]);

    const renderCategoryItem = React.useCallback(({ item }: { item: Category }) => (
        <CategoryItem
            item={item}
            isExpanded={expandedId === item.id}
            onToggle={toggleExpand}
            onSubCategoryPress={handleSubCategoryPress}
        />
    ), [expandedId, toggleExpand, handleSubCategoryPress]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            <View style={styles.header}>
                <Text style={styles.screenTitle}>All Categories</Text>
                <Text style={styles.screenSubtitle}>Explore thousands of products</Text>
            </View>

            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search category or product..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filteredCategories}
                keyExtractor={(item) => item.id}
                renderItem={renderCategoryItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                getItemLayout={(data, index) => (
                    { length: 100, offset: 100 * index, index } // Approximate height
                )}
            />
        </View>
    );
};

export default CategoriesScreen;

