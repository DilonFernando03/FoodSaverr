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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ShopBag } from '@/types/ShopBag';
import { BagCategory } from '@/types/SurpriseBag';

export default function ShopBagsScreen() {
  const { user } = useAuth();
  const { 
    bags, 
    getActiveBags, 
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
    collectionTime: { start: '18:00', end: '20:00' },
  });

  const shop = user?.userType === 'shop' ? user : null;
  const activeBags = getActiveBags();

  const handleCreateBag = async () => {
    if (!newBag.title.trim() || !newBag.description.trim() || !newBag.originalPrice || !newBag.discountedPrice || !newBag.totalQuantity) {
      Alert.alert('Error', 'Please fill in all fields');
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
        remainingQuantity: totalQuantity,
        collectionTime: newBag.collectionTime,
        collectionDate: new Date().toISOString().split('T')[0],
        images: [],
        tags: [newBag.category],
        isActive: true,
        isAvailable: true,
      });

      setShowCreateModal(false);
      setNewBag({
        title: '',
        description: '',
        category: BagCategory.MEALS,
        originalPrice: '',
        discountedPrice: '',
        totalQuantity: '',
        collectionTime: { start: '18:00', end: '20:00' },
      });
      Alert.alert('Success', 'Bag created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create bag');
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
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.tint }]}
          onPress={() => setShowCreateModal(true)}
        >
          <IconSymbol name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeBags.length > 0 ? (
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
                    style={[styles.actionButton, { backgroundColor: colors.notification }]}
                    onPress={() => handleCancelBag(bag)}
                  >
                    <IconSymbol name="xmark" size={16} color="white" />
                  </TouchableOpacity>
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

      {/* Create Bag Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={[styles.modalCancelText, { color: colors.tint }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Bag</Text>
            <TouchableOpacity onPress={handleCreateBag}>
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
});
