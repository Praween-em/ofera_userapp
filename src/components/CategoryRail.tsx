import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '../utils/theme';

interface Category {
    id: string;
    name: string;
    icon?: string;
    image_url?: string;
}

interface CategoryRailProps {
    categories: Category[];
    onCategoryPress: (categoryId: string, categoryName: string) => void;
    onViewAllPress: () => void;
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

const CategoryRail: React.FC<CategoryRailProps> = ({ categories, onCategoryPress, onViewAllPress }) => {
    const renderItem = ({ item }: { item: Category }) => {
        const color = getCategoryColor(item.name);
        const iconSource = item.icon || '📦';
        const isUrl = iconSource.startsWith('http');

        return (
            <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => onCategoryPress(item.id, item.name)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                    {isUrl ? (
                        <Image
                            source={{ uri: iconSource }}
                            style={{ width: 32, height: 32, resizeMode: 'contain' }}
                        />
                    ) : (
                        <Text style={styles.icon}>{iconSource}</Text>
                    )}
                </View>
                <Text style={styles.categoryName} numberOfLines={2}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    if (!categories || categories.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Categories</Text>
                <TouchableOpacity onPress={onViewAllPress}>
                    <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={categories}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF',
        paddingVertical: SPACING.md,
        marginBottom: SPACING.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: 18,
        fontWeight: '900', // Premium bold
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.primary,
        letterSpacing: 0.5,
    },
    listContent: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.sm, // Add padding for shadow visibility
    },
    categoryCard: {
        alignItems: 'center',
        marginRight: SPACING.md,
        width: 80, // Slightly wider
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20, // Modern pill/squircle shape
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
        // Premium Shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    icon: {
        fontSize: 32, // Larger icon
    },
    categoryName: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
        lineHeight: 14,
        marginTop: 4,
    },
});

export default CategoryRail;
