export enum UserType {
  CUSTOMER = 'customer',
  SHOP = 'shop'
}

export interface BaseUser {
  id: string;
  email: string;
  name: string;
  userType: UserType;
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
  avatar?: string;
}

export interface Customer extends BaseUser {
  userType: UserType.CUSTOMER;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    coordinates: {
      lat: number;
      lng: number;
    } | null;
  };
  preferences: {
    favoriteCategories: string[];
    maxDistance: number;
    notifications: boolean;
  };
  orderHistory: string[];
  favoriteShops: string[];
}

export interface Shop extends BaseUser {
  userType: UserType.SHOP;
  businessInfo: {
    businessName: string;
    businessType: string;
    description: string;
    logo?: string;
    coverImage?: string;
    phoneNumber: string;
    website?: string;
  };
  location: {
    address: string;
    city: string;
    postalCode: string;
    coordinates: {
      lat: number;
      lng: number;
    } | null;
  };
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  verificationStatus: {
    isVerified: boolean;
    verifiedAt?: Date;
    documents?: string[];
  };
  rating: {
    average: number;
    totalReviews: number;
  };
  settings: {
    autoPostBags: boolean;
    defaultBagQuantity: number;
    defaultDiscountPercentage: number;
    notificationSettings: {
      newOrders: boolean;
      lowStock: boolean;
      reviews: boolean;
    };
  };
}

export interface AuthState {
  user: Customer | Shop | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  userType: UserType;
  businessInfo?: {
    businessName: string;
    businessType: string;
    phoneNumber: string;
  };
}
