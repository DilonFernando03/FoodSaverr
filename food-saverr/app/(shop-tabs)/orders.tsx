import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { OrderStatus } from '@/types/ShopBag';

export default function ShopOrdersScreen() {
  const { user } = useAuth();
  const { orders, updateOrderStatus, loading } = useShop();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');

  const shop = user?.userType === 'shop' ? user : null;

  // Filter orders by selected status
  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.orderStatus === selectedStatus);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { updateOrderStatus: updateStatus } = await import('@/lib/supabase');
      const { error } = await updateStatus(orderId, newStatus);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      await updateOrderStatus(orderId, newStatus);
      Alert.alert('Success', 'Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return colors.notification;
      case OrderStatus.CONFIRMED:
        return colors.tint;
      case OrderStatus.READY_FOR_PICKUP:
        return '#FF9500';
      case OrderStatus.COMPLETED:
        return '#34C759';
      case OrderStatus.CANCELLED:
        return colors.destructive;
      default:
        return colors.text;
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'clock.fill';
      case OrderStatus.CONFIRMED:
        return 'checkmark.circle.fill';
      case OrderStatus.READY_FOR_PICKUP:
        return 'bag.fill';
      case OrderStatus.COMPLETED:
        return 'checkmark.circle.fill';
      case OrderStatus.CANCELLED:
        return 'xmark.circle.fill';
      default:
        return 'questionmark.circle.fill';
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case OrderStatus.PENDING:
        return OrderStatus.CONFIRMED;
      case OrderStatus.CONFIRMED:
        return OrderStatus.READY_FOR_PICKUP;
      case OrderStatus.READY_FOR_PICKUP:
        return OrderStatus.COMPLETED;
      default:
        return null;
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
        <Text style={[styles.title, { color: colors.text }]}>Orders</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Manage your customer orders
        </Text>
      </View>

      {/* Status Filter */}
      <View style={styles.statusFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterButtons}>
            {(['all', ...Object.values(OrderStatus)] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  { borderColor: colors.border },
                  selectedStatus === status && { backgroundColor: colors.tint },
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    { color: selectedStatus === status ? 'white' : colors.text },
                  ]}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView style={styles.ordersList}>
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const nextStatus = getNextStatus(order.orderStatus);
            return (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.card }]}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={[styles.customerName, { color: colors.text }]}>
                      {order.customerName}
                    </Text>
                    <Text style={[styles.orderId, { color: colors.text }]}>
                      Order #{order.id}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.orderStatus) }]}>
                    <IconSymbol name={getStatusIcon(order.orderStatus)} size={16} color="white" />
                    <Text style={styles.statusText}>
                      {order.orderStatus.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <IconSymbol name="phone.fill" size={16} color={colors.tint} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      {order.customerPhone}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <IconSymbol name="clock.fill" size={16} color={colors.tint} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      Pickup: {order.collectionTime.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <IconSymbol name="bag.fill" size={16} color={colors.tint} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      Quantity: {order.quantity}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <IconSymbol name="dollarsign.circle.fill" size={16} color={colors.tint} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      Total: LKR {order.totalPrice}
                    </Text>
                  </View>
                </View>

                {order.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={[styles.notesLabel, { color: colors.text }]}>Notes:</Text>
                    <Text style={[styles.notesText, { color: colors.text }]}>{order.notes}</Text>
                  </View>
                )}

                <View style={styles.orderActions}>
                  <Text style={[styles.orderTime, { color: colors.text }]}>
                    Ordered: {order.createdAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  
                  {nextStatus && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.tint }]}
                      onPress={() => handleUpdateOrderStatus(order.id, nextStatus)}
                    >
                      <Text style={styles.actionButtonText}>
                        Mark as {nextStatus.replace('_', ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <IconSymbol name="list.bullet.rectangle" size={64} color={colors.tabIconDefault} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              No Orders Found
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              {selectedStatus === 'all' 
                ? "You don't have any orders yet" 
                : `No orders with status: ${selectedStatus.replace('_', ' ')}`
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  statusFilter: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ordersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  orderCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  notesContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    opacity: 0.8,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
