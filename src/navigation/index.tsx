import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import OfferDetailsScreen from '../screens/OfferDetailsScreen';
import ShopDetailsScreen from '../screens/ShopDetailsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HotDealsScreen from '../screens/HotDealsScreen';
import BusinessesScreen from '../screens/BusinessesScreen';
import CategoryAndItemScreen from '../screens/CategoryAndItemScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SavedOffersScreen from '../screens/SavedOffersScreen';
import FavouriteBusinessesScreen from '../screens/FavouriteBusinessesScreen';
import WalletScreen from '../screens/WalletScreen';
import AffiliateOffersScreen from '../screens/AffiliateOffersScreen';
import AffiliateStoresScreen from '../screens/AffiliateStoresScreen';
import ServiceProviderDetailsScreen from '../screens/ServiceProviderDetailsScreen';
import ServicesSearchScreen from '../screens/ServicesSearchScreen';
import PostServiceRequestScreen from '../screens/PostServiceRequestScreen';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#3F51B5',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: {
                    paddingBottom: 5,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                }
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home" color={color} size={size || 24} />
                    )
                }}
            />
            <Tab.Screen
                name="Categories"
                component={CategoriesScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="view-grid" color={color} size={size || 24} />
                    )
                }}
            />
            <Tab.Screen
                name="HotDeals"
                component={HotDealsScreen}
                options={{
                    tabBarLabel: 'Hot Deals',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="fire" color={color} size={size || 24} />
                    )
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account" color={color} size={size || 24} />
                    )
                }}
            />
        </Tab.Navigator>
    );
};

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import OTPScreen from '../screens/OTPScreen';
import { ActivityIndicator } from 'react-native';

const AuthStack = createNativeStackNavigator();

const linking = {
    prefixes: ['offermarket://'],
    config: {
        screens: {
            Main: {
                initialRouteName: 'Home',
                screens: {
                    Home: 'home',
                    Categories: 'categories',
                    HotDeals: 'hot-deals',
                    Profile: 'profile',
                },
            },
            OfferDetails: 'offer/:offerId',
            ShopDetails: 'shop/:shopId',
        },
    },
};

const Navigation = () => {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3F51B5" />
            </View>
        );
    }

    return (
        <NavigationContainer linking={linking as any}>
            {token ? (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Main" component={TabNavigator} />
                    <Stack.Screen name="OfferDetails" component={OfferDetailsScreen} />
                    <Stack.Screen name="ShopDetails" component={ShopDetailsScreen} />
                    <Stack.Screen name="Businesses" component={BusinessesScreen} />
                    <Stack.Screen name="CategoryAndItem" component={CategoryAndItemScreen} />
                    <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                    <Stack.Screen name="SavedOffers" component={SavedOffersScreen} />
                    <Stack.Screen name="FavouriteBusinesses" component={FavouriteBusinessesScreen} />
                    {/* <Stack.Screen name="Wallet" component={WalletScreen} /> */}
                    <Stack.Screen name="AffiliateOffers" component={AffiliateOffersScreen} />
                    <Stack.Screen name="AffiliateStores" component={AffiliateStoresScreen} />
                    <Stack.Screen name="ServiceProviderDetails" component={ServiceProviderDetailsScreen} />
                    <Stack.Screen name="ServicesSearch" component={ServicesSearchScreen} />
                    <Stack.Screen name="PostServiceRequest" component={PostServiceRequestScreen} />
                    <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
                    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                </Stack.Navigator>
            ) : (
                <AuthStack.Navigator screenOptions={{ headerShown: false }}>
                    <AuthStack.Screen name="Login" component={LoginScreen} />
                    <AuthStack.Screen name="OTP" component={OTPScreen} />
                    <AuthStack.Screen name="TermsConditions" component={TermsConditionsScreen} />
                    <AuthStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                </AuthStack.Navigator>
            )}
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default Navigation;
