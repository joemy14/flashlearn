import AsyncStorage from '@react-native-async-storage/async-storage';
import { Deck, Card, firestoreService } from './firestoreService';

const STORAGE_KEYS = {
  DECKS: 'flashlearn_decks',
  CARDS: 'flashlearn_cards_',
  PROGRESS: 'flashlearn_progress',
  OFFLINE_QUEUE: 'flashlearn_offline_queue',
  LAST_SYNC: 'flashlearn_last_sync',
};

export interface OfflineChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'deck' | 'card';
  data: any;
  timestamp: number;
  synced: boolean;
}

export const offlineService = {
  /**
   * Cache decks locally
   */
  async cacheDecks(userId: string, decks: Deck[]): Promise<void> {
    try {
      const cacheKey = `${STORAGE_KEYS.DECKS}_${userId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(decks));
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.LAST_SYNC}_decks`,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Error caching decks:', error);
    }
  },

  /**
   * Get cached decks
   */
  async getCachedDecks(userId: string): Promise<Deck[]> {
    try {
      const cacheKey = `${STORAGE_KEYS.DECKS}_${userId}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting cached decks:', error);
      return [];
    }
  },

  /**
   * Cache cards for a deck
   */
  async cacheCards(deckId: string, cards: Card[]): Promise<void> {
    try {
      const cacheKey = `${STORAGE_KEYS.CARDS}${deckId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cards));
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.LAST_SYNC}_cards_${deckId}`,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Error caching cards:', error);
    }
  },

  /**
   * Get cached cards
   */
  async getCachedCards(deckId: string): Promise<Card[]> {
    try {
      const cacheKey = `${STORAGE_KEYS.CARDS}${deckId}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting cached cards:', error);
      return [];
    }
  },

  /**
   * Queue a change for offline sync
   */
  async queueChange(change: Omit<OfflineChange, 'id'>): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const newChange: OfflineChange = {
        ...change,
        id: `${Date.now()}_${Math.random()}`,
        synced: false,
      };
      queue.push(newChange);
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_QUEUE,
        JSON.stringify(queue)
      );
    } catch (error) {
      console.error('Error queuing change:', error);
    }
  },

  /**
   * Get offline queue
   */
  async getOfflineQueue(): Promise<OfflineChange[]> {
    try {
      const queue = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  },

  /**
   * Sync offline changes with Firestore
   */
  async syncOfflineChanges(userId: string): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      if (queue.length === 0) return;

      for (const change of queue) {
        try {
          if (change.entity === 'deck') {
            if (change.type === 'create') {
              await firestoreService.deckService.createDeck(
                userId,
                change.data.title,
                change.data.description,
                change.data.tags
              );
            } else if (change.type === 'update') {
              await firestoreService.deckService.updateDeck(
                change.data.id,
                change.data
              );
            } else if (change.type === 'delete') {
              await firestoreService.deckService.deleteDeck(change.data.id);
            }
          } else if (change.entity === 'card') {
            if (change.type === 'create') {
              await firestoreService.cardService.createCard(
                change.data.deckId,
                change.data.question,
                change.data.answer,
                change.data.order,
                change.data.difficulty
              );
            } else if (change.type === 'update') {
              await firestoreService.cardService.updateCard(
                change.data.deckId,
                change.data.id,
                change.data
              );
            } else if (change.type === 'delete') {
              await firestoreService.cardService.deleteCard(
                change.data.deckId,
                change.data.id
              );
            }
          }

          change.synced = true;
        } catch (error) {
          console.error('Error syncing change:', error);
          // Continue with next change
        }
      }

      // Remove synced changes
      const remainingQueue = queue.filter(c => !c.synced);
      if (remainingQueue.length === 0) {
        await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
      } else {
        await AsyncStorage.setItem(
          STORAGE_KEYS.OFFLINE_QUEUE,
          JSON.stringify(remainingQueue)
        );
      }
    } catch (error) {
      console.error('Error syncing offline changes:', error);
    }
  },

  /**
   * Clear offline cache
   */
  async clearCache(userId?: string): Promise<void> {
    try {
      if (userId) {
        await AsyncStorage.removeItem(`${STORAGE_KEYS.DECKS}_${userId}`);
      } else {
        // Get all keys and remove cache keys
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(
          key =>
            key.startsWith(STORAGE_KEYS.DECKS) ||
            key.startsWith(STORAGE_KEYS.CARDS) ||
            key.startsWith(STORAGE_KEYS.LAST_SYNC)
        );
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  /**
   * Get last sync time
   */
  async getLastSyncTime(entity: string): Promise<Date | null> {
    try {
      const time = await AsyncStorage.getItem(
        `${STORAGE_KEYS.LAST_SYNC}_${entity}`
      );
      return time ? new Date(time) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  },

  /**
   * Check if offline queue has pending changes
   */
  async hasPendingChanges(): Promise<boolean> {
    try {
      const queue = await this.getOfflineQueue();
      return queue.length > 0;
    } catch (error) {
      console.error('Error checking pending changes:', error);
      return false;
    }
  },
};