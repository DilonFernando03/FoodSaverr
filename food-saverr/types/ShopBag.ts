import { BagCategory } from './SurpriseBag';

export interface ShopBag {
  id: string;
  shopId: string;
  category: BagCategory;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  totalQuantity: number;
  remainingQuantity: number;
  collectionTime: {
    start: string;
    end: string;
  };
  collectionDate: string;
  images: string[];
  tags: string[];
  isActive: boolean;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  orders: BagOrder[];
}

export interface BagOrder {
  id: string;
  bagId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  quantity: number;
  totalPrice: number;
  orderStatus: OrderStatus;
  createdAt: Date;
  collectionTime?: Date;
  notes?: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  READY_FOR_PICKUP = 'ready_for_pickup',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface BagAnalytics {
  totalBagsPosted: number;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  popularCategories: {
    category: BagCategory;
    count: number;
    revenue: number;
  }[];
  dailyStats: {
    date: string;
    bagsPosted: number;
    orders: number;
    revenue: number;
  }[];
  weeklyStats: {
    week: string;
    bagsPosted: number;
    orders: number;
    revenue: number;
  }[];
  monthlyStats: {
    month: string;
    bagsPosted: number;
    orders: number;
    revenue: number;
  }[];
}

export interface BagSchedule {
  id: string;
  shopId: string;
  frequency: ScheduleFrequency;
  category: BagCategory;
  defaultTitle: string;
  defaultDescription: string;
  defaultPrice: number;
  defaultDiscountPercentage: number;
  defaultQuantity: number;
  defaultCollectionTime: {
    start: string;
    end: string;
  };
  isActive: boolean;
  nextPostDate: Date;
  createdAt: Date;
}

export enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  CUSTOM = 'custom'
}
