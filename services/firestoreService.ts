import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
  Query,
  collectionGroup,
} from 'firebase/firestore';
import { db } from '../firebase';

// Types
export interface Deck {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isPublic: boolean;
  cardsCount: number;
  tags: string[];
  shareCode: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  thumbnail?: string;
}

export interface Card {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  explanation?: string;
  order: number;
  tags?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DeckWithCards extends Deck {
  cards: Card[];
}

// Generate unique share code
function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Deck Service
export const deckService = {
  /**
   * Create a new deck
   */
  async createDeck(
    userId: string,
    title: string,
    description: string = '',
    tags: string[] = []
  ): Promise<string> {
    try {
      if (!title.trim()) {
        throw new Error('Deck title is required');
      }

      const deckRef = await addDoc(collection(db, 'decks'), {
        title: title.trim(),
        description: description.trim(),
        createdBy: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isPublic: false,
        cardsCount: 0,
        tags: tags.filter(t => t.trim()),
        shareCode: generateShareCode(),
        difficulty: 'beginner',
      });

      return deckRef.id;
    } catch (error: any) {
      console.error('Error creating deck:', error);
      throw new Error(error.message || 'Failed to create deck');
    }
  },

  /**
   * Get all decks for a user
   */
  async getUserDecks(userId: string): Promise<Deck[]> {
    try {
      const q = query(
        collection(db, 'decks'),
        where('createdBy', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Deck[];
    } catch (error: any) {
      console.error('Error getting user decks:', error);
      throw new Error(error.message || 'Failed to get decks');
    }
  },

  /**
   * Get a single deck by ID
   */
  async getDeck(deckId: string): Promise<Deck | null> {
    try {
      const docRef = doc(db, 'decks', deckId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data(),
        } as Deck;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting deck:', error);
      throw new Error(error.message || 'Failed to get deck');
    }
  },

  /**
   * Update deck
   */
  async updateDeck(deckId: string, updates: Partial<Deck>): Promise<void> {
    try {
      const docRef = doc(db, 'decks', deckId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error('Error updating deck:', error);
      throw new Error(error.message || 'Failed to update deck');
    }
  },

  /**
   * Delete a deck and all its cards
   */
  async deleteDeck(deckId: string): Promise<void> {
    try {
      // Get all cards in the deck
      const cardsSnapshot = await getDocs(
        collection(db, 'decks', deckId, 'cards')
      );

      // Delete all cards
      for (const cardDoc of cardsSnapshot.docs) {
        await deleteDoc(cardDoc.ref);
      }

      // Delete the deck
      const docRef = doc(db, 'decks', deckId);
      await deleteDoc(docRef);
    } catch (error: any) {
      console.error('Error deleting deck:', error);
      throw new Error(error.message || 'Failed to delete deck');
    }
  },

  /**
   * Get deck by share code
   */
  async getDeckByShareCode(shareCode: string): Promise<Deck | null> {
    try {
      const q = query(
        collection(db, 'decks'),
        where('shareCode', '==', shareCode)
      );
      const snapshot = await getDocs(q);
      if (snapshot.docs.length > 0) {
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
        } as Deck;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting deck by share code:', error);
      throw new Error(error.message || 'Failed to get deck');
    }
  },

  /**
   * Copy a deck to user's collection
   */
  async copyDeck(deckId: string, userId: string): Promise<string> {
    try {
      const deck = await this.getDeck(deckId);
      if (!deck) {
        throw new Error('Deck not found');
      }

      // Create new deck
      const newDeckId = await this.createDeck(
        userId,
        `${deck.title} (Copy)`,
        deck.description,
        deck.tags
      );

      // Get all cards from original deck
      const cards = await cardService.getCards(deckId);

      // Copy all cards
      for (const card of cards) {
        await cardService.createCard(
          newDeckId,
          card.question,
          card.answer,
          card.order,
          card.difficulty,
          card.explanation
        );
      }

      return newDeckId;
    } catch (error: any) {
      console.error('Error copying deck:', error);
      throw new Error(error.message || 'Failed to copy deck');
    }
  },
};

// Card Service
export const cardService = {
  /**
   * Create a new card
   */
  async createCard(
    deckId: string,
    question: string,
    answer: string,
    order: number = 0,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    explanation: string = ''
  ): Promise<string> {
    try {
      if (!question.trim() || !answer.trim()) {
        throw new Error('Question and answer are required');
      }

      const cardRef = await addDoc(
        collection(db, 'decks', deckId, 'cards'),
        {
          question: question.trim(),
          answer: answer.trim(),
          explanation: explanation.trim(),
          order,
          difficulty,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }
      );

      // Update deck cards count
      const deck = await deckService.getDeck(deckId);
      if (deck) {
        await deckService.updateDeck(deckId, {
          cardsCount: (deck.cardsCount || 0) + 1,
        });
      }

      return cardRef.id;
    } catch (error: any) {
      console.error('Error creating card:', error);
      throw new Error(error.message || 'Failed to create card');
    }
  },

  /**
   * Get all cards in a deck
   */
  async getCards(deckId: string): Promise<Card[]> {
    try {
      const snapshot = await getDocs(
        collection(db, 'decks', deckId, 'cards')
      );
      return snapshot.docs
        .map(doc => ({
          id: doc.id,
          deckId,
          ...doc.data(),
        }))
        .sort((a: any, b: any) => a.order - b.order) as Card[];
    } catch (error: any) {
      console.error('Error getting cards:', error);
      throw new Error(error.message || 'Failed to get cards');
    }
  },

  /**
   * Get a single card
   */
  async getCard(deckId: string, cardId: string): Promise<Card | null> {
    try {
      const docRef = doc(db, 'decks', deckId, 'cards', cardId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          deckId,
          ...snapshot.data(),
        } as Card;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting card:', error);
      throw new Error(error.message || 'Failed to get card');
    }
  },

  /**
   * Update a card
   */
  async updateCard(
    deckId: string,
    cardId: string,
    updates: Partial<Card>
  ): Promise<void> {
    try {
      const docRef = doc(db, 'decks', deckId, 'cards', cardId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error('Error updating card:', error);
      throw new Error(error.message || 'Failed to update card');
    }
  },

  /**
   * Delete a card
   */
  async deleteCard(deckId: string, cardId: string): Promise<void> {
    try {
      const docRef = doc(db, 'decks', deckId, 'cards', cardId);
      await deleteDoc(docRef);

      // Update deck cards count
      const deck = await deckService.getDeck(deckId);
      if (deck) {
        await deckService.updateDeck(deckId, {
          cardsCount: Math.max((deck.cardsCount || 1) - 1, 0),
        });
      }
    } catch (error: any) {
      console.error('Error deleting card:', error);
      throw new Error(error.message || 'Failed to delete card');
    }
  },

  /**
   * Reorder cards
   */
  async reorderCards(deckId: string, cardIds: string[]): Promise<void> {
    try {
      for (let i = 0; i < cardIds.length; i++) {
        await this.updateCard(deckId, cardIds[i], { order: i });
      }
    } catch (error: any) {
      console.error('Error reordering cards:', error);
      throw new Error(error.message || 'Failed to reorder cards');
    }
  },
};

export const firestoreService = {
  deckService,
  cardService,
};