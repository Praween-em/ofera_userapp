import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../services/api';
import { getServiceIcon } from '../utils/serviceIcons';
import { LocationService, LocationData } from '../services/LocationService';

const { width } = Dimensions.get('window');

const PostServiceRequestScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Category State
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedParent, setSelectedParent] = useState<any>(null);
    const [selectedSub, setSelectedSub] = useState<any>(null);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [location, setLocation] = useState<LocationData | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationName, setLocationName] = useState<string>('');

    useEffect(() => {
        fetchCategories();
        detectLocation();
    }, []);

    const detectLocation = async () => {
        setLocationLoading(true);
        try {
            const loc = await LocationService.getCurrentLocation();
            if (loc) {
                setLocation(loc);
                // The backend will reverse geocode if we don't have a name, 
                // but we could also do it here if we want immediate UI feedback.
                // For now, let's just use the coordinates.
                setLocationName("Current Location Detected");
            }
        } catch (error) {
            console.error('Failed to detect location:', error);
        } finally {
            setLocationLoading(false);
        }
    };

    const fetchCategories = async () => {
        setIsLoadingCategories(true);
        try {
            const response = await api.get('/services/categories');
            setCategories(response.data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const pickImage = async () => {
        if (images.length >= 2) {
            Alert.alert('Limit Reached', 'You can only upload up to 2 photos.');
            return;
        }

        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.7,
        });

        if (result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            uploadImage(asset);
        }
    };

    const uploadImage = async (asset: any) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
                type: asset.type,
                name: asset.fileName || 'request.jpg',
            } as any);

            const response = await api.post('/bunny/upload?folder=service-requests', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setImages(prev => [...prev, response.data.url]);
        } catch (error) {
            console.error('Upload failed', error);
            Alert.alert('Upload Failed', 'Could not upload photo.');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!selectedSub) {
            Alert.alert('Error', 'Please select a subcategory');
            return;
        }

        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title for your request');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/services/requests', {
                title,
                description,
                categoryId: selectedSub.id,
                images,
                latitude: location?.latitude,
                longitude: location?.longitude
            });
            Alert.alert('Success', 'Your service request has been posted!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Submit request error', error);
            Alert.alert('Error', 'Failed to post request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Category Processing Logic
    const parentCategories = categories.filter(c => !c.parent_id);
    const mainCategories = parentCategories.slice(0, 15);
    const otherCategories = parentCategories.slice(15);

    const getSubCategories = (parentId: string) => {
        return categories.filter(c => c.parent_id === parentId);
    };

    const filteredResults = searchTerm ? categories.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="chevron-left" size={28} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post a Request</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>What do you need?</Text>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Photos ({images.length}/2)</Text>
                        <View style={styles.imageGrid}>
                            {images.map((img, index) => (
                                <View key={index} style={styles.imageWrapper}>
                                    <Image source={{ uri: img }} style={styles.image} />
                                    <TouchableOpacity
                                        style={styles.removeBtn}
                                        onPress={() => removeImage(index)}
                                    >
                                        <Icon name="close-circle" size={20} color="#FF4757" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {images.length < 2 && (
                                <TouchableOpacity
                                    style={styles.uploadPlaceholder}
                                    onPress={pickImage}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <ActivityIndicator color="#FF4757" />
                                    ) : (
                                        <>
                                            <Icon name="camera-plus-outline" size={32} color="#CCC" />
                                            <Text style={styles.uploadText}>Add Photo</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Category</Text>
                        <TouchableOpacity
                            style={styles.categoryTrigger}
                            onPress={() => setShowCategoryModal(true)}
                        >
                            <View style={styles.categoryTriggerContent}>
                                <Icon name="tag-outline" size={20} color="#FF4757" style={{ marginRight: 10 }} />
                                <Text style={styles.categorySelectedText}>
                                    {selectedParent ? `${selectedParent.name}${selectedSub ? ` > ${selectedSub.name}` : ''}` : 'Select Category'}
                                </Text>
                            </View>
                            <Icon name="chevron-right" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Request Title</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g. Need urgent plumbing fix"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Details (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Describe what you need in detail..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Service Location</Text>
                        <View style={styles.locationContainer}>
                            <Icon name="map-marker" size={20} color="#FF4757" />
                            <Text style={styles.locationText}>
                                {locationLoading ? 'Detecting...' : (locationName || 'Location not detected')}
                            </Text>
                            <TouchableOpacity onPress={detectLocation} disabled={locationLoading}>
                                <Text style={styles.retryText}>{locationName ? 'Retry' : 'Detect'}</Text>
                            </TouchableOpacity>
                        </View>
                        {!location && !locationLoading && (
                            <Text style={styles.locationHint}>Detected location ensures you find the nearest providers.</Text>
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.submitBtnText}>Post Request</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* Category Modal */}
            <Modal
                visible={showCategoryModal}
                transparent
                animationType="slide"
                onRequestClose={() => { setShowCategoryModal(false); setSearchTerm(''); setSelectedParent(null); }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.bottomSheet}>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Select Category</Text>
                            <TouchableOpacity onPress={() => { setShowCategoryModal(false); setSearchTerm(''); setSelectedParent(null); }}>
                                <Icon name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View style={styles.searchBarWrapper}>
                            <Icon name="magnify" size={20} color="#999" />
                            <TextInput
                                style={styles.modalSearchInput}
                                placeholder="Search category..."
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                                placeholderTextColor="#999"
                            />
                            {searchTerm ? (
                                <TouchableOpacity onPress={() => setSearchTerm('')}>
                                    <Icon name="close-circle" size={18} color="#CCC" />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        <ScrollView style={styles.sheetBody}>
                            {searchTerm ? (
                                <View style={styles.searchResultsList}>
                                    {filteredResults.length > 0 ? (
                                        filteredResults.map((item) => (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={styles.searchResultItem}
                                                onPress={() => {
                                                    if (item.parent_id) {
                                                        // It's a subcategory
                                                        const parent = categories.find(c => c.id === item.parent_id);
                                                        setSelectedParent(parent);
                                                        setSelectedSub(item);
                                                    } else {
                                                        // It's a parent
                                                        setSelectedParent(item);
                                                        setSearchTerm(''); // Clear search to show subs
                                                        return;
                                                    }
                                                    setShowCategoryModal(false);
                                                    setSearchTerm('');
                                                }}
                                            >
                                                <View style={styles.searchResultIcon}>
                                                    <Text>{item.icon || (item.parent_id ? '🔹' : '📁')}</Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.searchResultName}>{item.name}</Text>
                                                    {item.parent && (
                                                        <Text style={styles.searchResultParent}>{item.parent.name}</Text>
                                                    )}
                                                </View>
                                                <Icon name="chevron-right" size={18} color="#CCC" style={{ marginLeft: 'auto' }} />
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <Text style={styles.noResultsText}>No categories found for "{searchTerm}"</Text>
                                    )}
                                </View>
                            ) : !selectedParent ? (
                                <View>
                                    {/* Main Categories */}
                                    <Text style={styles.groupLabel}>Main Categories</Text>
                                    <View style={styles.categoryGrid}>
                                        {mainCategories.map((cat) => (
                                            <TouchableOpacity
                                                key={cat.id}
                                                style={styles.categoryItem}
                                                onPress={() => setSelectedParent(cat)}
                                            >
                                                <View style={styles.catIconCircle}>
                                                    {getServiceIcon(cat.name) ? (
                                                        <Image
                                                            source={getServiceIcon(cat.name)}
                                                            style={styles.catImageIcon}
                                                            resizeMode="contain"
                                                        />
                                                    ) : (
                                                        <Text style={styles.catIconLarge}>{cat.icon || '🛠️'}</Text>
                                                    )}
                                                </View>
                                                <Text style={styles.catName}>{cat.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Other Categories */}
                                    {otherCategories.length > 0 && (
                                        <>
                                            <Text style={[styles.groupLabel, { marginTop: 20 }]}>Other Categories</Text>
                                            <View style={styles.categoryGrid}>
                                                {otherCategories.map((cat) => (
                                                    <TouchableOpacity
                                                        key={cat.id}
                                                        style={styles.categoryItem}
                                                        onPress={() => setSelectedParent(cat)}
                                                    >
                                                        <View style={styles.catIconCircle}>
                                                            {getServiceIcon(cat.name) ? (
                                                                <Image
                                                                    source={getServiceIcon(cat.name)}
                                                                    style={styles.catImageIcon}
                                                                    resizeMode="contain"
                                                                />
                                                            ) : (
                                                                <Text style={styles.catIconLarge}>{cat.icon || '🛠️'}</Text>
                                                            )}
                                                        </View>
                                                        <Text style={styles.catName}>{cat.name}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </>
                                    )}
                                </View>
                            ) : (
                                <View>
                                    <TouchableOpacity
                                        style={styles.backToParents}
                                        onPress={() => { setSelectedParent(null); setSelectedSub(null); }}
                                    >
                                        <Icon name="arrow-left" size={20} color="#FF4757" />
                                        <Text style={styles.backToParentsText}>Back to all categories</Text>
                                    </TouchableOpacity>

                                    <Text style={styles.subCatHeader}>Available in {selectedParent.name}</Text>
                                    <View style={styles.subCategoryList}>
                                        {getSubCategories(selectedParent.id).map((sub: any) => (
                                            <TouchableOpacity
                                                key={sub.id}
                                                style={[styles.subCategoryItem, selectedSub?.id === sub.id && styles.subCategoryItemActive]}
                                                onPress={() => {
                                                    setSelectedSub(sub);
                                                    setShowCategoryModal(false);
                                                    setSearchTerm('');
                                                }}
                                            >
                                                <Text style={[styles.subCategoryText, selectedSub?.id === sub.id && styles.subCategoryTextActive]}>
                                                    {sub.name}
                                                </Text>
                                                {selectedSub?.id === sub.id && <Icon name="check-circle" size={20} color="#FF4757" />}
                                            </TouchableOpacity>
                                        ))}

                                        {getSubCategories(selectedParent.id).length === 0 && (
                                            <Text style={styles.noResultsText}>No subcategories available</Text>
                                        )}
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#2D3436',
        marginBottom: 20,
    },
    form: {
        marginTop: 10,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#636E72',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#2D3436',
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    categoryTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    categoryTriggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categorySelectedText: {
        fontSize: 15,
        color: '#2D3436',
        fontWeight: '600',
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 5,
    },
    uploadPlaceholder: {
        width: (width - 64) / 2,
        height: (width - 64) / 2,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EFEFEF',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 8,
        fontSize: 12,
        color: '#999',
        fontWeight: '700',
    },
    imageWrapper: {
        width: (width - 64) / 2,
        height: (width - 64) / 2,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    removeBtn: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: '#FFF',
        borderRadius: 12,
    },
    submitBtn: {
        backgroundColor: '#FF4757',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
        shadowColor: '#FF4757',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    submitBtnDisabled: {
        opacity: 0.7,
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    locationText: {
        flex: 1,
        fontSize: 14,
        color: '#1A1A1A',
        marginLeft: 8,
    },
    retryText: {
        color: '#FF4757',
        fontSize: 14,
        fontWeight: '600',
    },
    locationHint: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
        fontStyle: 'italic',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: 40,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2D3436',
    },
    sheetBody: {
        padding: 20,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
        justifyContent: 'space-between',
    },
    categoryItem: {
        width: (width - 70) / 2,
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    catIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#EEE',
        overflow: 'hidden',
    },
    catIconLarge: {
        fontSize: 40,
    },
    catImageIcon: {
        width: '100%',
        height: '100%',
    },
    catName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D3436',
        textAlign: 'center',
    },
    backToParents: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
    },
    backToParentsText: {
        fontSize: 15,
        color: '#FF4757',
        fontWeight: '700',
    },
    subCatHeader: {
        fontSize: 14,
        fontWeight: '700',
        color: '#636E72',
        marginBottom: 12,
    },
    subCategoryList: {
        gap: 10,
    },
    subCategoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    subCategoryItemActive: {
        borderColor: '#FF4757',
        backgroundColor: '#FFF0F1',
    },
    subCategoryText: {
        fontSize: 15,
        color: '#2D3436',
        fontWeight: '600',
    },
    subCategoryTextActive: {
        color: '#FF4757',
        fontWeight: '800',
    },
    searchBarWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F2F6',
        marginHorizontal: 20,
        marginVertical: 10,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    modalSearchInput: {
        flex: 1,
        fontSize: 15,
        color: '#2D3436',
        marginLeft: 8,
    },
    groupLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    searchResultsList: {
        gap: 2,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        marginBottom: 8,
    },
    searchResultIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    searchResultName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2D3436',
    },
    searchResultParent: {
        fontSize: 11,
        color: '#999',
    },
    noResultsText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 40,
        fontSize: 14,
    },
});

export default PostServiceRequestScreen;
