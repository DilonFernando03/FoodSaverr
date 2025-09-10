export interface SurpriseBag {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLogo: string;
  restaurantRating: number;
  category: BagCategory;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  itemsLeft: number;
  collectionTime: {
    start: string;
    end: string;
  };
  collectionDate: string;
  distance: number; // in km
  location: {
    address: string;
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  tags: string[];
  isPopular: boolean;
  isFavorited: boolean;
  isAvailable: boolean;
}

export enum BagCategory {
  MEALS = 'meals',
  BREAD_PASTRIES = 'bread_pastries',
  GROCERIES = 'groceries',
  DESSERTS = 'desserts',
  BEVERAGES = 'beverages',
  SNACKS = 'snacks',
  FRESH_PRODUCE = 'fresh_produce',
  OTHER = 'other'
}

export interface Restaurant {
  id: string;
  name: string;
  logo: string;
  rating: number;
  reviewCount: number;
  categories: string[];
  location: {
    address: string;
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  isVerified: boolean;
  isOpen: boolean;
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
}

export interface UserLocation {
  city: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface FilterOptions {
  category: BagCategory | null;
  maxDistance: number;
  maxPrice: number;
  minRating: number;
  availableOnly: boolean;
}
