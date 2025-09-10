# FoodSaverr 🇱🇰

A cross-platform mobile application built with React Native and Expo to reduce food waste in Sri Lanka by connecting customers with local restaurants and shops offering surprise bags of surplus food at discounted prices.

## Features

### 🔍 Discovery
- Browse surprise bags from well-known brands and local restaurants
- Location-based filtering (Colombo, Sri Lanka)
- Category filtering (Meals, Bread & Pastries, Groceries, etc.)
- Real-time availability and pricing information

### 🛍️ Surprise Bags
- Discounted food items (typically 60% off original price)
- Mixed bags of surplus food from restaurants and shops
- Collection time slots and location details
- Restaurant ratings and reviews

### ❤️ Favorites & Browse
- Save favorite restaurants and surprise bags
- Advanced filtering by category, distance, and price
- Browse all available options in your area
- Quick access to popular and nearby options

### 📱 User Experience
- Clean, intuitive interface with red-white/red-black theme
- Light and dark mode support
- Cross-platform compatibility (iOS, Android, Web)
- Real-time updates on availability

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context API
- **UI Components**: Custom themed components
- **Icons**: SF Symbols (iOS) / Material Icons (Android)
- **Platform Support**: iOS, Android, Web

## Project Structure

```
food-saverr/
├── app/                    # App screens and navigation
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── index.tsx      # Inventory screen
│   │   ├── recipes.tsx    # Recipe suggestions
│   │   ├── alerts.tsx     # Expiration alerts
│   │   └── explore.tsx    # App info and tips
│   └── _layout.tsx        # Root layout with providers
├── components/            # Reusable UI components
├── contexts/              # React Context providers
│   └── FoodContext.tsx    # Food inventory state management
├── types/                 # TypeScript type definitions
│   └── FoodItem.ts        # Food item and recipe types
├── hooks/                 # Custom React hooks
├── constants/             # App constants and themes
└── assets/               # Images, fonts, and other assets
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd food-saverr
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on specific platforms**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## Usage

### Discovering Surprise Bags

1. Navigate to the **Discover** tab
2. Browse surprise bags from well-known brands
3. Use category filters to find specific types of food
4. Tap on any bag to view details and collection information

### Browsing All Options

1. Go to the **Browse** tab
2. Use filters to narrow down by category, distance, or price
3. View all available surprise bags in your area
4. Tap the heart icon to add items to favorites

### Managing Favorites

1. Check the **Favourites** tab to see saved items
2. Remove items from favorites by tapping the heart icon
3. Quick access to your most-liked restaurants and bags

### Profile & Settings

1. Visit the **Profile** tab to:
   - View your order history (coming soon)
   - Manage payment methods (coming soon)
   - Access help and support
   - Learn more about the app

## Data Models

### SurpriseBag
```typescript
interface SurpriseBag {
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
  distance: number;
  location: {
    address: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
  images: string[];
  tags: string[];
  isPopular: boolean;
  isFavorited: boolean;
  isAvailable: boolean;
}
```

### Restaurant
```typescript
interface Restaurant {
  id: string;
  name: string;
  logo: string;
  rating: number;
  reviewCount: number;
  categories: string[];
  location: {
    address: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
  isVerified: boolean;
  isOpen: boolean;
  openingHours: {
    [key: string]: { open: string; close: string };
  };
}
```

## Customization

### Adding New Categories
Edit `types/SurpriseBag.ts` to add new bag categories:
```typescript
export enum BagCategory {
  // ... existing categories
  NEW_CATEGORY = 'new_category'
}
```

### Adding New Restaurants
Add restaurants to the `sampleBags` array in `contexts/SurpriseBagContext.tsx`:
```typescript
const sampleBags: SurpriseBag[] = [
  // ... existing bags
  {
    id: 'new-bag',
    restaurantName: 'New Restaurant',
    // ... other properties
  }
];
```

### Styling
The app uses a Sri Lankan-inspired red-white/red-black color scheme:
- Primary: `#DC2626` (Red-600) / `#EF4444` (Red-500 for dark mode)
- Background: `#FFFFFF` (White) / `#000000` (Black)
- Accent: `#FEE2E2` (Red-100) / `#7F1D1D` (Red-900 for dark mode)
- Warning: `#F59E0B` (Amber-500)
- Success: `#10B981` (Emerald-500)

## Future Enhancements

- [ ] Restaurant partner onboarding system
- [ ] Real-time order placement and payment
- [ ] GPS navigation to collection points
- [ ] Push notifications for new bags and collection reminders
- [ ] User reviews and ratings system
- [ ] Loyalty program and rewards
- [ ] Multi-language support (Sinhala, Tamil)
- [ ] Integration with local payment systems
- [ ] Restaurant analytics dashboard
- [ ] Social sharing of saved food

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Expo](https://expo.dev/)
- Icons from [SF Symbols](https://developer.apple.com/sf-symbols/)
- Inspired by food waste reduction initiatives in Sri Lanka
- Sample data includes popular Sri Lankan restaurants and locations

---

**FoodSaverr** - Reducing food waste in Sri Lanka, one surprise bag at a time! 🇱🇰🌱