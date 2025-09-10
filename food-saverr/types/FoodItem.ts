export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  purchaseDate: Date;
  expirationDate: Date;
  quantity: number;
  unit: string;
  location: StorageLocation;
  notes?: string;
  imageUrl?: string;
  isExpired: boolean;
  daysUntilExpiration: number;
}

export enum FoodCategory {
  FRUITS = 'fruits',
  VEGETABLES = 'vegetables',
  DAIRY = 'dairy',
  MEAT = 'meat',
  GRAINS = 'grains',
  BEVERAGES = 'beverages',
  SNACKS = 'snacks',
  CONDIMENTS = 'condiments',
  FROZEN = 'frozen',
  OTHER = 'other'
}

export enum StorageLocation {
  FRIDGE = 'fridge',
  FREEZER = 'freezer',
  PANTRY = 'pantry',
  COUNTER = 'counter',
  OTHER = 'other'
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  tags: string[];
}

export interface ExpirationAlert {
  id: string;
  foodItemId: string;
  daysUntilExpiration: number;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
