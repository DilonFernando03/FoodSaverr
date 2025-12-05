import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ShopBag } from '@/types/ShopBag';
import { BagCategory } from '@/types/SurpriseBag';
import * as ImagePicker from 'expo-image-picker';

export default function ShopBagsScreen() {
  const { user } = useAuth();
  const { 
    bags, 
    getActiveBags, 
    getExpiredBags,
    getCancelledBags,
    createBag, 
    updateBag, 
    deleteBag, 
    cancelBag,
    loading 
  } = useShop();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBag, setEditingBag] = useState<ShopBag | null>(null);
  const [newBag, setNewBag] = useState({
    title: '',
    description: '',
    category: BagCategory.MEALS,
    originalPrice: '',
    discountedPrice: '',
    totalQuantity: '',
    collectionDate: new Date().toISOString().split('T')[0],
    collectionTime: { start: '18:00', end: '20:00' },
    images: [] as string[],
  });

  const shop = user?.userType === 'shop' ? user : null;
  const activeBags = getActiveBags();
  const expiredBags = getExpiredBags();
  const cancelledBags = getCancelledBags();
  const [viewMode, setViewMode] = useState<'active' | 'expired' | 'cancelled'>('active');

  const resetForm = () => {
    setEditingBag(null);
    setNewBag({
      title: '',
      description: '',
      category: BagCategory.MEALS,
      originalPrice: '',
      discountedPrice: '',
      totalQuantity: '',
      collectionDate: new Date().toISOString().split('T')[0],
      collectionTime: { start: '18:00', end: '20:00' },
      images: [],
    });
  };

  const openEditModal = (bag: ShopBag) => {
    setEditingBag(bag);
    setNewBag({
      title: bag.title,
      description: bag.description,
      category: bag.category,
      originalPrice: bag.originalPrice.toString(),
      discountedPrice: bag.discountedPrice.toString(),
      totalQuantity: bag.totalQuantity.toString(),
      collectionDate: bag.collectionDate,
      collectionTime: bag.collectionTime,
      images: bag.images || [],
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      setNewBag({ ...newBag, images: [...newBag.images, imageUri] });
    }
  };

  const removeImage = (index: number) => {
    const newImages = newBag.images.filter((_, i) => i !== index);
    setNewBag({ ...newBag, images: newImages });
  };

  const handleCreateBag = async () => {
    if (!newBag.title.trim() || !newBag.description.trim() || !newBag.originalPrice || !newBag.discountedPrice || !newBag.totalQuantity || !newBag.collectionTime.start || !newBag.collectionTime.end) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const originalPrice = parseFloat(newBag.originalPrice);
    const discountedPrice = parseFloat(newBag.discountedPrice);
    const totalQuantity = parseInt(newBag.totalQuantity);
    const discountPercentage = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);

    try {
      await createBag({
        shopId: shop?.id || '',
        category: newBag.category,
        title: newBag.title.trim(),
        description: newBag.description.trim(),
        originalPrice,
        discountedPrice,
        discountPercentage,
        totalQuantity,
        remainingQuantity: editingBag ? editingBag.remainingQuantity : totalQuantity,
        collectionTime: newBag.collectionTime,
        collectionDate: newBag.collectionDate,
        images: newBag.images,
        tags: [newBag.category],
        isActive: true,
        isAvailable: true,
      });

      closeModal();
      Alert.alert('Success', 'Bag created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create bag');
    }
  };

  const handleUpdateBag = async () => {
    if (!editingBag) return;
    
    if (!newBag.title.trim() || !newBag.description.trim() || !newBag.originalPrice || !newBag.discountedPrice || !newBag.totalQuantity || !newBag.collectionTime.start || !newBag.collectionTime.end) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const originalPrice = parseFloat(newBag.originalPrice);
    const discountedPrice = parseFloat(newBag.discountedPrice);
    const totalQuantity = parseInt(newBag.totalQuantity);
    const discountPercentage = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);

    try {
      const updatedBag: ShopBag = {
        ...editingBag,
        category: newBag.category,
        title: newBag.title.trim(),
        description: newBag.description.trim(),
        originalPrice,
        discountedPrice,
        discountPercentage,
        totalQuantity,
        collectionTime: newBag.collectionTime,
        collectionDate: newBag.collectionDate,
        images: newBag.images,
        tags: [newBag.category],
      };

      await updateBag(updatedBag);
      closeModal();
      Alert.alert('Success', 'Bag updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update bag');
    }
  };

  const handleSave = () => {
    if (editingBag) {
      handleUpdateBag();
    } else {
      handleCreateBag();
    }
  };

  const handleCancelBag = (bag: ShopBag) => {
    Alert.alert(
      'Cancel Bag',
      'Are you sure you want to cancel this bag? This action cannot be undone.',
      [
        { text: 'Keep Active', style: 'cancel' },
        { 
          text: 'Cancel Bag', 
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBag(bag.id);
              Alert.alert('Success', 'Bag cancelled successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel bag');
            }
          }
        },
      ]
    );
  };

  const handleDeleteBag = (bag: ShopBag) => {
    Alert.alert(
      'Delete Bag',
      'Are you sure you want to delete this bag? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBag(bag.id);
              Alert.alert('Success', 'Bag deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete bag');
            }
          }
        },
      ]
    );
  };

  const getCategoryIcon = (category: BagCategory) => {
    switch (category) {
      case BagCategory.MEALS: return 'fork.knife';
      case BagCategory.BREAD_PASTRIES: return 'birthday.cake';
      case BagCategory.GROCERIES: return 'cart.fill';
      case BagCategory.FRESH_PRODUCE: return 'leaf.fill';
      case BagCategory.DESSERTS: return 'heart.fill';
      case BagCategory.BEVERAGES: return 'cup.and.saucer.fill';
      case BagCategory.SNACKS: return 'popcorn.fill';
      default: return 'bag.fill';
    }
  };

  if (!shop) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Shop account required
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Bags</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.tint }]}
            onPress={() => setShowCreateModal(true)}
          >
            <IconSymbol name="plus" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* View Mode Tabs */}
      <View style={styles.viewModeTabs}>
        <TouchableOpacity
          style={[
            styles.viewModeTab,
            { borderColor: colors.border },
            viewMode === 'active' && { backgroundColor: colors.tint },
          ]}
          onPress={() => setViewMode('active')}
        >
          <Text
            style={[
              styles.viewModeTabText,
              { color: viewMode === 'active' ? 'white' : colors.text },
            ]}
          >
            Active ({activeBags.length})
          </Text>
        </TouchableOpacity>
        {expiredBags.length > 0 && (
          <TouchableOpacity
            style={[
              styles.viewModeTab,
              { borderColor: colors.border },
              viewMode === 'expired' && { backgroundColor: colors.notification },
            ]}
            onPress={() => setViewMode('expired')}
          >
            <IconSymbol 
              name="clock.fill" 
              size={14} 
              color={viewMode === 'expired' ? 'white' : colors.notification} 
            />
            <Text
              style={[
                styles.viewModeTabText,
                { color: viewMode === 'expired' ? 'white' : colors.text },
              ]}
            >
              Expired ({expiredBags.length})
            </Text>
          </TouchableOpacity>
        )}
        {cancelledBags.length > 0 && (
          <TouchableOpacity
            style={[
              styles.viewModeTab,
              { borderColor: colors.border },
              viewMode === 'cancelled' && { backgroundColor: colors.destructive },
            ]}
            onPress={() => setViewMode('cancelled')}
          >
            <IconSymbol 
              name="xmark.circle.fill" 
              size={14} 
              color={viewMode === 'cancelled' ? 'white' : colors.destructive} 
            />
            <Text
              style={[
                styles.viewModeTabText,
                { color: viewMode === 'cancelled' ? 'white' : colors.text },
              ]}
            >
              Cancelled ({cancelledBags.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {viewMode === 'expired' ? (
          // Show expired bags
          expiredBags.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <IconSymbol name="clock.fill" size={20} color={colors.notification} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Expired Bags ({expiredBags.length})
                </Text>
              </View>
              {expiredBags.map((bag) => (
                <View key={bag.id} style={[styles.bagCard, styles.expiredBagCard, { backgroundColor: colors.card }]}>
                  <View style={styles.bagHeader}>
                    <View style={styles.bagInfo}>
                      <View style={[styles.categoryIcon, styles.expiredIcon]}>
                        <IconSymbol 
                          name={getCategoryIcon(bag.category)} 
                          size={24} 
                          color={colors.notification} 
                        />
                      </View>
                      <View style={styles.bagDetails}>
                        <View style={styles.bagTitleRow}>
                          <Text style={[styles.bagTitle, { color: colors.text }]}>
                            {bag.title}
                          </Text>
                          <View style={[styles.expiredBadge, { backgroundColor: colors.notification }]}>
                            <Text style={styles.expiredBadgeText}>EXPIRED</Text>
                          </View>
                        </View>
                        <Text style={[styles.bagCategory, { color: colors.text }]}>
                          {bag.category.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.bagActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.destructive }]}
                        onPress={() => handleDeleteBag(bag)}
                      >
                        <IconSymbol name="trash" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.bagDescription, { color: colors.text }]}>
                    {bag.description}
                  </Text>

                  <View style={styles.bagStats}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {bag.remainingQuantity} / {bag.totalQuantity}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.text }]}>
                        Sold
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        LKR {bag.discountedPrice}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.text }]}>
                        Price
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {bag.discountPercentage}%
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.text }]}>
                        Discount
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {bag.collectionDate}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.text }]}>
                        Date
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <IconSymbol name="checkmark.circle" size={64} color={colors.tabIconDefault} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                No Expired Bags
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.text }]}>
                All your bags are currently active
              </Text>
            </View>
          )
        ) : viewMode === 'cancelled' ? (
          // Show cancelled bags
          cancelledBags.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <IconSymbol name="xmark.circle.fill" size={20} color={colors.destructive} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Cancelled Bags ({cancelledBags.length})
                </Text>
              </View>
              {cancelledBags.map((bag) => (
                <View key={bag.id} style={[styles.bagCard, styles.cancelledBagCard, { backgroundColor: colors.card }]}>
                  <View style={styles.bagHeader}>
                    <View style={styles.bagInfo}>
                      <View style={[styles.categoryIcon, styles.cancelledIcon]}>
                        <IconSymbol 
                          name={getCategoryIcon(bag.category)} 
                          size={24} 
                          color={colors.destructive} 
                        />
                      </View>
                      <View style={styles.bagDetails}>
                        <View style={styles.bagTitleRow}>
                          <Text style={[styles.bagTitle, { color: colors.text }]}>
                            {bag.title}
                          </Text>
                          <View style={[styles.cancelledBadge, { backgroundColor: colors.destructive }]}>
                            <Text style={styles.cancelledBadgeText}>CANCELLED</Text>
                          </View>
                        </View>
                        <Text style={[styles.bagCategory, { color: colors.text }]}>
                          {bag.category.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.bagActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.destructive }]}
                        onPress={() => handleDeleteBag(bag)}
                      >
                        <IconSymbol name="trash" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.bagDescription, { color: colors.text }]}>
                    {bag.description}
                  </Text>

                  <View style={styles.bagStats}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {bag.remainingQuantity} / {bag.totalQuantity}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.text }]}>
                        Sold
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        LKR {bag.discountedPrice}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.text }]}>
                        Price
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {bag.discountPercentage}%
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.text }]}>
                        Discount
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {bag.collectionDate}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.text }]}>
                        Date
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <IconSymbol name="checkmark.circle" size={64} color={colors.tabIconDefault} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                No Cancelled Bags
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.text }]}>
                You haven't cancelled any bags yet
              </Text>
            </View>
          )
        ) : viewMode === 'active' && activeBags.length > 0 ? (
          // Show active bags
          activeBags.map((bag) => (
            <View key={bag.id} style={[styles.bagCard, { backgroundColor: colors.card }]}>
              <View style={styles.bagHeader}>
                <View style={styles.bagInfo}>
                  <View style={styles.categoryIcon}>
                    <IconSymbol 
                      name={getCategoryIcon(bag.category)} 
                      size={24} 
                      color={colors.tint} 
                    />
                  </View>
                  <View style={styles.bagDetails}>
                    <Text style={[styles.bagTitle, { color: colors.text }]}>
                      {bag.title}
                    </Text>
                    <Text style={[styles.bagCategory, { color: colors.text }]}>
                      {bag.category.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.bagActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.tint }]}
                    onPress={() => openEditModal(bag)}
                  >
                    <IconSymbol name="pencil" size={16} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.destructive }]}
                    onPress={() => handleCancelBag(bag)}
                  >
                    <IconSymbol name="xmark.circle.fill" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.bagDescription, { color: colors.text }]}>
                {bag.description}
              </Text>

              <View style={styles.bagStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.tint }]}>
                    {bag.remainingQuantity}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>
                    Left
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.tint }]}>
                    LKR {bag.discountedPrice}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>
                    Price
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.tint }]}>
                    {bag.discountPercentage}%
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>
                    Discount
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.tint }]}>
                    {bag.collectionTime.start} - {bag.collectionTime.end}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>
                    Pickup
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <IconSymbol name="bag" size={64} color={colors.tabIconDefault} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              No Active Bags
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              Create your first surprise bag to start selling
            </Text>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: colors.tint }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.emptyStateButtonText}>Create Bag</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Create/Edit Bag Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={[styles.modalCancelText, { color: colors.tint }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingBag ? 'Edit Bag' : 'Create Bag'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.modalSaveText, { color: colors.tint }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={newBag.title}
                onChangeText={(text) => setNewBag({ ...newBag, title: text })}
                placeholder="Enter bag title"
                placeholderTextColor={colors.tabIconDefault}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Description *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
                value={newBag.description}
                onChangeText={(text) => setNewBag({ ...newBag, description: text })}
                placeholder="Describe what's in the bag"
                placeholderTextColor={colors.tabIconDefault}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {Object.values(BagCategory).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: newBag.category === category ? colors.tint : colors.card,
                        borderColor: colors.tint,
                      },
                    ]}
                    onPress={() => setNewBag({ ...newBag, category })}
                  >
                    <IconSymbol
                      name={getCategoryIcon(category)}
                      size={16}
                      color={newBag.category === category ? 'white' : colors.tint}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        {
                          color: newBag.category === category ? 'white' : colors.text,
                        },
                      ]}
                    >
                      {category.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Original Price (LKR) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={newBag.originalPrice}
                  onChangeText={(text) => setNewBag({ ...newBag, originalPrice: text })}
                  placeholder="500"
                  placeholderTextColor={colors.tabIconDefault}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Discounted Price (LKR) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={newBag.discountedPrice}
                  onChangeText={(text) => setNewBag({ ...newBag, discountedPrice: text })}
                  placeholder="200"
                  placeholderTextColor={colors.tabIconDefault}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Quantity *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={newBag.totalQuantity}
                onChangeText={(text) => setNewBag({ ...newBag, totalQuantity: text })}
                placeholder="5"
                placeholderTextColor={colors.tabIconDefault}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Collection Date *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={newBag.collectionDate}
                onChangeText={(text) => setNewBag({ ...newBag, collectionDate: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.tabIconDefault}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Pickup Start Time *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={newBag.collectionTime.start}
                  onChangeText={(text) => setNewBag({ 
                    ...newBag, 
                    collectionTime: { ...newBag.collectionTime, start: text } 
                  })}
                  placeholder="18:00"
                  placeholderTextColor={colors.tabIconDefault}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Pickup End Time *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={newBag.collectionTime.end}
                  onChangeText={(text) => setNewBag({ 
                    ...newBag, 
                    collectionTime: { ...newBag.collectionTime, end: text } 
                  })}
                  placeholder="20:00"
                  placeholderTextColor={colors.tabIconDefault}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Bag Images</Text>
              <TouchableOpacity
                style={[styles.imagePickerButton, { backgroundColor: colors.card, borderColor: colors.tint }]}
                onPress={pickImage}
              >
                <IconSymbol name="camera.fill" size={20} color={colors.tint} />
                <Text style={[styles.imagePickerText, { color: colors.tint }]}>Add Image</Text>
              </TouchableOpacity>
              {newBag.images.length > 0 && (
                <View style={styles.imagePreviewContainer}>
                  {newBag.images.map((uri, index) => (
                    <View key={index} style={styles.imagePreviewWrapper}>
                      <Image source={{ uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={[styles.removeImageButton, { backgroundColor: colors.destructive }]}
                        onPress={() => removeImage(index)}
                      >
                        <IconSymbol name="xmark" size={12} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewModeTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  viewModeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  viewModeTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  expiredBagCard: {
    opacity: 0.8,
  },
  expiredIcon: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  cancelledBagCard: {
    opacity: 0.8,
  },
  cancelledIcon: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  bagTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  expiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  expiredBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cancelledBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cancelledBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bagCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  bagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bagDetails: {
    flex: 1,
  },
  bagTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  bagCategory: {
    fontSize: 12,
    opacity: 0.7,
  },
  bagActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bagDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 16,
    lineHeight: 20,
  },
  bagStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalCancelText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  imagePreviewWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
