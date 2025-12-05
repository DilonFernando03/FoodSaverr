import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { SurpriseBag, Restaurant, UserLocation, FilterOptions, BagCategory } from '@/types/SurpriseBag';
import { getAvailableSurpriseBags } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { parsePostGISCoordinates } from '@/lib/coordinateParser';

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

// Remove sample data; bags will be loaded from Supabase

const initialState: SurpriseBagState = {
  bags: [],
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
  const { user } = useAuth();

  // Compute Haversine distance in km
  const computeDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round((R * c) * 1000) / 1000; // round to meters precision
  };

  // Load bags from Supabase whenever filters or location change
  useEffect(() => {
    const load = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Use customer's maxDistance preference if available, otherwise use filter default
        const customerMaxDistance = user?.userType === 'customer' 
          ? (user as any).preferences?.maxDistance 
          : undefined;
        const maxDistance = customerMaxDistance || state.filters.maxDistance;

        console.log('Loading bags with filters:', {
          category: state.filters.category,
          maxDistance,
          hasUserLocation: !!state.userLocation,
          userLocation: state.userLocation?.coordinates,
        });

        // Always fetch bags, even without location (distance filtering will be applied if location exists)
        const { bags, error } = await getAvailableSurpriseBags({
          category: state.filters.category || undefined,
          maxPrice: state.filters.maxPrice || undefined,
          minRating: state.filters.minRating || undefined,
          // Only apply distance filter if user location is available
          maxDistance: state.userLocation ? maxDistance : undefined,
          userLocation: state.userLocation ? { lat: state.userLocation.coordinates.lat, lng: state.userLocation.coordinates.lng } : undefined,
        } as any);

        if (error) {
          console.error('Error loading bags:', error);
          dispatch({ type: 'SET_BAGS', payload: [] });
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        console.log(`Loaded ${bags?.length || 0} bags from database`);

        const mapped: SurpriseBag[] = (bags || []).map((row: any) => {
          const shop = row.shop_profiles || {};
          const coords = shop.coordinates as any;
          
          // Extract coordinates from PostGIS geography point using utility function
          let shopLat: number | null = null;
          let shopLng: number | null = null;
          
          const parsedCoords = parsePostGISCoordinates(coords);
          if (parsedCoords) {
            shopLng = parsedCoords.lng;
            shopLat = parsedCoords.lat;
          }
          
          let distance = 0;
          if (state.userLocation && shopLat != null && shopLng != null) {
            distance = computeDistanceKm(
              state.userLocation.coordinates.lat,
              state.userLocation.coordinates.lng,
              shopLat,
              shopLng
            );
          }
          const itemsLeft = row.remaining_quantity ?? row.total_quantity ?? 0;
          const discountedPrice = row.discounted_price ?? 0;
          const originalPrice = row.original_price ?? discountedPrice;
          const discountPercentage = originalPrice ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) : 0;
          return {
            id: row.id,
            restaurantId: row.shop_id,
            restaurantName: shop.business_name || 'Shop',
            restaurantLogo: shop.logo_url || '',
            restaurantRating: shop.average_rating || 0,
            category: row.category as BagCategory,
            title: row.title,
            description: row.description || '',
            originalPrice,
            discountedPrice,
            discountPercentage,
            itemsLeft,
            collectionTime: { start: row.collection_start_time || '', end: row.collection_end_time || '' },
            collectionDate: row.collection_date || '',
            distance,
            location: {
              address: shop.address || '',
              city: shop.city || '',
              coordinates: { lat: shopLat ?? 0, lng: shopLng ?? 0 },
            },
            images: row.images || [],
            tags: row.tags || [],
            isPopular: false,
            isFavorited: false,
            isAvailable: row.is_available ?? true,
          } as SurpriseBag;
        });

        console.log(`Mapped ${mapped.length} bags for display`);
        dispatch({ type: 'SET_BAGS', payload: mapped });
      } catch (error) {
        console.error('Error in load bags:', error);
        dispatch({ type: 'SET_BAGS', payload: [] });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    load();
  }, [state.filters.category, state.filters.maxPrice, state.filters.minRating, state.filters.maxDistance, state.userLocation, user]);

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
