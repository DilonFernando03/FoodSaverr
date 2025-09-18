import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { SurpriseBag, Restaurant, UserLocation, FilterOptions, BagCategory } from '@/types/SurpriseBag';

interface SurpriseBagState {
  bags: SurpriseBag[];
  restaurants: Restaurant[];
  userLocation: UserLocation | null;
  filters: FilterOptions;
  favorites: string[];
  loading: boolean;
}

type SurpriseBagAction =
  | { type: 'SET_BAGS'; payload: SurpriseBag[] }
  | { type: 'SET_RESTAURANTS'; payload: Restaurant[] }
  | { type: 'SET_USER_LOCATION'; payload: UserLocation }
  | { type: 'UPDATE_FILTERS'; payload: Partial<FilterOptions> }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

// Sample data for Sri Lankan restaurants and surprise bags
const sampleBags: SurpriseBag[] = [
  {
    id: '1',
    restaurantId: 'rest1',
    restaurantName: 'Subway - Asda Express Mackworth',
    restaurantLogo: 'subway',
    restaurantRating: 4.3,
    category: BagCategory.BREAD_PASTRIES,
    title: 'Bread & Cookies',
    description: 'Fresh bread and cookies that need to go today',
    originalPrice: 600,
    discountedPrice: 220,
    discountPercentage: 63,
    itemsLeft: 1,
    collectionTime: { start: '09:30', end: '10:00' },
    collectionDate: 'tomorrow',
    distance: 0.549,
    location: {
      address: 'Asda Express Mackworth',
      city: 'Colombo',
      coordinates: { lat: 6.9271, lng: 79.8612 },
    },
    images: ['bread.jpg'],
    tags: ['bread', 'cookies', 'bakery'],
    isPopular: false,
    isFavorited: false,
    isAvailable: true,
  },
  {
    id: '2',
    restaurantId: 'rest2',
    restaurantName: 'ALDI - Burton Road',
    restaurantLogo: 'aldi',
    restaurantRating: 4.2,
    category: BagCategory.GROCERIES,
    title: 'Grocery Surprise Bag',
    description: 'Mixed groceries including fresh produce and pantry items',
    originalPrice: 1000,
    discountedPrice: 330,
    discountPercentage: 67,
    itemsLeft: 3,
    collectionTime: { start: '21:25', end: '21:55' },
    collectionDate: 'today',
    distance: 1.7,
    location: {
      address: 'Burton Road, Colombo',
      city: 'Colombo',
      coordinates: { lat: 6.9271, lng: 79.8612 },
    },
    images: ['groceries.jpg'],
    tags: ['groceries', 'fresh', 'produce'],
    isPopular: true,
    isFavorited: false,
    isAvailable: true,
  },
  {
    id: '3',
    restaurantId: 'rest3',
    restaurantName: 'Pizza Hut - Galle Road',
    restaurantLogo: 'pizzahut',
    restaurantRating: 4.5,
    category: BagCategory.MEALS,
    title: 'Pizza & Sides',
    description: 'Leftover pizzas and side dishes from today',
    originalPrice: 800,
    discountedPrice: 320,
    discountPercentage: 60,
    itemsLeft: 2,
    collectionTime: { start: '22:00', end: '22:30' },
    collectionDate: 'today',
    distance: 2.1,
    location: {
      address: 'Galle Road, Colombo',
      city: 'Colombo',
      coordinates: { lat: 6.9271, lng: 79.8612 },
    },
    images: ['pizza.jpg'],
    tags: ['pizza', 'italian', 'fast food'],
    isPopular: true,
    isFavorited: true,
    isAvailable: true,
  },
  {
    id: '4',
    restaurantId: 'rest4',
    restaurantName: 'KFC - Liberty Plaza',
    restaurantLogo: 'kfc',
    restaurantRating: 4.1,
    category: BagCategory.MEALS,
    title: 'Chicken & Sides',
    description: 'Fried chicken and side dishes',
    originalPrice: 750,
    discountedPrice: 300,
    discountPercentage: 60,
    itemsLeft: 1,
    collectionTime: { start: '21:45', end: '22:15' },
    collectionDate: 'today',
    distance: 1.2,
    location: {
      address: 'Liberty Plaza, Colombo',
      city: 'Colombo',
      coordinates: { lat: 6.9271, lng: 79.8612 },
    },
    images: ['chicken.jpg'],
    tags: ['chicken', 'fried', 'fast food'],
    isPopular: false,
    isFavorited: false,
    isAvailable: true,
  },
  {
    id: '5',
    restaurantId: 'rest5',
    restaurantName: 'Cargills Food City',
    restaurantLogo: 'cargills',
    restaurantRating: 4.0,
    category: BagCategory.FRESH_PRODUCE,
    title: 'Fresh Produce Bag',
    description: 'Mixed fresh vegetables and fruits',
    originalPrice: 500,
    discountedPrice: 200,
    discountPercentage: 60,
    itemsLeft: 4,
    collectionTime: { start: '20:00', end: '21:00' },
    collectionDate: 'today',
    distance: 0.8,
    location: {
      address: 'Bambalapitiya, Colombo',
      city: 'Colombo',
      coordinates: { lat: 6.9271, lng: 79.8612 },
    },
    images: ['produce.jpg'],
    tags: ['vegetables', 'fruits', 'fresh'],
    isPopular: false,
    isFavorited: false,
    isAvailable: true,
  },
];

const initialState: SurpriseBagState = {
  bags: sampleBags,
  restaurants: [],
  userLocation: null,
  filters: {
    category: null,
    maxDistance: 10,
    maxPrice: 1000,
    minRating: 0,
    availableOnly: true,
  },
  favorites: [],
  loading: false,
};

function surpriseBagReducer(state: SurpriseBagState, action: SurpriseBagAction): SurpriseBagState {
  switch (action.type) {
    case 'SET_BAGS':
      return {
        ...state,
        bags: action.payload,
      };
    case 'SET_RESTAURANTS':
      return {
        ...state,
        restaurants: action.payload,
      };
    case 'SET_USER_LOCATION':
      return {
        ...state,
        userLocation: action.payload,
      };
    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    case 'TOGGLE_FAVORITE':
      const bagId = action.payload;
      const isFavorited = state.favorites.includes(bagId);
      return {
        ...state,
        favorites: isFavorited
          ? state.favorites.filter(id => id !== bagId)
          : [...state.favorites, bagId],
        bags: state.bags.map(bag =>
          bag.id === bagId ? { ...bag, isFavorited: !isFavorited } : bag
        ),
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
}

interface SurpriseBagContextType {
  state: SurpriseBagState;
  getFilteredBags: () => SurpriseBag[];
  getBagsByCategory: (category: BagCategory) => SurpriseBag[];
  getPopularBags: () => SurpriseBag[];
  getNearbyBags: (maxDistance?: number) => SurpriseBag[];
  toggleFavorite: (bagId: string) => void;
  updateFilters: (filters: Partial<FilterOptions>) => void;
  setUserLocation: (location: UserLocation) => void;
}

const SurpriseBagContext = createContext<SurpriseBagContextType | undefined>(undefined);

export function SurpriseBagProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(surpriseBagReducer, initialState);

  const getFilteredBags = useCallback((): SurpriseBag[] => {
    let filtered = state.bags;

    if (state.filters.category) {
      filtered = filtered.filter(bag => bag.category === state.filters.category);
    }

    if (state.filters.maxDistance && state.userLocation) {
      filtered = filtered.filter(bag => bag.distance <= state.filters.maxDistance);
    }

    if (state.filters.maxPrice) {
      filtered = filtered.filter(bag => bag.discountedPrice <= state.filters.maxPrice);
    }

    if (state.filters.minRating) {
      filtered = filtered.filter(bag => bag.restaurantRating >= state.filters.minRating);
    }

    if (state.filters.availableOnly) {
      filtered = filtered.filter(bag => bag.isAvailable && bag.itemsLeft > 0);
    }

    return filtered;
  }, [state.bags, state.filters, state.userLocation]);

  const getBagsByCategory = useCallback((category: BagCategory): SurpriseBag[] => {
    return state.bags.filter(bag => bag.category === category);
  }, [state.bags]);

  const getPopularBags = useCallback((): SurpriseBag[] => {
    return state.bags.filter(bag => bag.isPopular);
  }, [state.bags]);

  const getNearbyBags = useCallback((maxDistance: number = 5): SurpriseBag[] => {
    return state.bags.filter(bag => bag.distance <= maxDistance);
  }, [state.bags]);

  const toggleFavorite = useCallback((bagId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: bagId });
  }, []);

  const updateFilters = useCallback((filters: Partial<FilterOptions>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  }, []);

  const setUserLocation = useCallback((location: UserLocation) => {
    dispatch({ type: 'SET_USER_LOCATION', payload: location });
  }, []);

  const value: SurpriseBagContextType = {
    state,
    getFilteredBags,
    getBagsByCategory,
    getPopularBags,
    getNearbyBags,
    toggleFavorite,
    updateFilters,
    setUserLocation,
  };

  return <SurpriseBagContext.Provider value={value}>{children}</SurpriseBagContext.Provider>;
}

export function useSurpriseBag() {
  const context = useContext(SurpriseBagContext);
  if (context === undefined) {
    throw new Error('useSurpriseBag must be used within a SurpriseBagProvider');
  }
  return context;
}
