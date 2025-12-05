import { ShopBag } from '@/types/ShopBag';

/**
 * Checks if a bag has expired based on its collection date and end time
 * A bag is considered expired if the current date/time is past the collection date + end time
 */
export function isBagExpired(bag: ShopBag): boolean {
  try {
    // Parse collection date (format: YYYY-MM-DD)
    const collectionDate = new Date(bag.collectionDate);
    
    // Parse collection end time (format: HH:MM)
    const [hours, minutes] = bag.collectionTime.end.split(':').map(Number);
    
    // Create expiration datetime by combining date and end time
    const expirationDateTime = new Date(collectionDate);
    expirationDateTime.setHours(hours, minutes, 0, 0);
    
    // Get current datetime
    const now = new Date();
    
    // Bag is expired if current time is past the expiration datetime
    return now > expirationDateTime;
  } catch (error) {
    console.error('Error checking bag expiration:', error);
    // If there's an error parsing, consider it not expired to be safe
    return false;
  }
}

/**
 * Checks if a bag was cancelled (manually deactivated before expiration)
 * A bag is considered cancelled if it's inactive but hasn't expired yet
 */
export function isBagCancelled(bag: ShopBag): boolean {
  // Bag is cancelled if it's inactive/not available but hasn't expired
  // This means it was manually cancelled by the shop
  return (!bag.isActive || !bag.isAvailable) && !isBagExpired(bag);
}

/**
 * Gets the expiration datetime for a bag
 */
export function getBagExpirationDateTime(bag: ShopBag): Date {
  const collectionDate = new Date(bag.collectionDate);
  const [hours, minutes] = bag.collectionTime.end.split(':').map(Number);
  const expirationDateTime = new Date(collectionDate);
  expirationDateTime.setHours(hours, minutes, 0, 0);
  return expirationDateTime;
}

