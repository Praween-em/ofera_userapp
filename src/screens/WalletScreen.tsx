import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

const WalletScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [balance, setBalance] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            const [balanceRes, transactionsRes] = await Promise.all([
                api.get('/wallet/balance'),
                api.get('/wallet/transactions')
            ]);
            setBalance(balanceRes.data);
            setTransactions(transactionsRes.data);
        } catch (error) {
            console.error('Fetch wallet error', error);
        } finally {
            setLoading(false);
        }
    };

    const renderTransaction = ({ item }: { item: any }) => {
        const getStatusColor = (status: string) => {
            switch (status) {
                case 'confirmed': return '#4CAF50';
                case 'pending': return '#FF9800';
                case 'cancelled': return '#F44336';
                default: return '#999';
            }
        };

        return (
            <View style={styles.transactionCard}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
                <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>{item.platform?.toUpperCase() || 'Purchase'}</Text>
                    <Text style={styles.transactionDate}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
                <View style={styles.transactionAmount}>
                    <Text style={[styles.amountText, { color: getStatusColor(item.status) }]}>
                        + ₹{item.amount}
                    </Text>
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#3F51B5" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#3F51B5" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Wallet</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
                <View style={styles.balanceRow}>
                    <View style={styles.balanceItem}>
                        <Text style={styles.balanceLabel}>Available</Text>
                        <Text style={styles.balanceValue}>₹{balance?.current_balance || '0.00'}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.balanceItem}>
                        <Text style={styles.balanceLabel}>Pending</Text>
                        <Text style={[styles.balanceValue, { color: '#FF9800' }]}>₹{balance?.pending_balance || '0.00'}</Text>
                    </View>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Lifetime Earnings:</Text>
                    <Text style={styles.totalValue}>₹{balance?.total_earned || '0.00'}</Text>
                </View>
                <TouchableOpacity style={styles.withdrawButton}>
                    <Text style={styles.withdrawButtonText}>Withdraw Earnings</Text>
                </TouchableOpacity>
                <Text style={styles.withdrawHint}>Min. withdrawal: ₹200</Text>
            </View>

            {/* History Section */}
            <View style={styles.historyContainer}>
                <Text style={styles.sectionTitle}>Transaction History</Text>
                {transactions.length > 0 ? (
                    <FlatList
                        data={transactions}
                        renderItem={renderTransaction}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                ) : (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="history" size={60} color="#DDD" />
                        <Text style={styles.emptyText}>No transactions yet</Text>
                        <Text style={styles.emptySubtext}>Shop through Spot Loot to earn cashback!</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F8FA',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#3F51B5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 60,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    balanceCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginTop: -40,
        borderRadius: 20,
        padding: 24,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    balanceItem: {
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: '#EEE',
    },
    balanceLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    balanceValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#3F51B5',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 15,
        marginBottom: 20,
    },
    totalLabel: {
        fontSize: 13,
        color: '#999',
    },
    totalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 5,
    },
    withdrawButton: {
        backgroundColor: '#3F51B5',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    withdrawButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    withdrawHint: {
        textAlign: 'center',
        fontSize: 11,
        color: '#AAA',
        marginTop: 8,
    },
    historyContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 30,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    transactionCard: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    statusIndicator: {
        width: 4,
        height: 30,
        borderRadius: 2,
        marginRight: 15,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
    },
    transactionDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    transactionAmount: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 2,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#CCC',
        marginTop: 10,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#DDD',
        marginTop: 5,
    },
});

export default WalletScreen;
