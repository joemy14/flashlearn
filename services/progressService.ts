import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  Timestamp,
  increment,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface CardProgress {
  cardId: string;
  attempts: number;
  correct: number;
  incorrect: number;
  streak: number;
  lastReviewDate: Timestamp;
}

export interface DeckProgress {
  userId: string;
  deckId: string;
  status: 'learning' | 'reviewing' | 'mastered';
  lastReviewed: Timestamp;
  timesReviewed: number;
  cardsStudied: number;
  masteredCards: number;
  cardProgress: { [cardId: string]: CardProgress };
  studyStats: {
    totalTimeSpent: number; // in minutes
    averageAccuracy: number; // 0-100
    longestStreak: number;
  };
}

export interface QuizResult {
  id: string;
  userId: string;
  deckId: string;
  cardId: string;
  question: string;
  answer: string;
  userAnswer?: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
  completedAt: Timestamp;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const progressService = {
  /**
   * Initialize or get deck progress
   */
  async initializeProgress(userId: string, deckId: string): Promise<void> {
    try {
      const docRef = doc(db, 'userProgress', `${userId}_${deckId}`);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          userId,
          deckId,
          status: 'learning',
          lastReviewed: Timestamp.now(),
          timesReviewed: 0,
          cardsStudied: 0,
          masteredCards: 0,
          cardProgress: {},
          studyStats: {
            totalTimeSpent: 0,
            averageAccuracy: 0,
            longestStreak: 0,
          },
        });
      }
    } catch (error: any) {
      console.error('Error initializing progress:', error);
      throw new Error(error.message || 'Failed to initialize progress');
    }
  },

  /**
   * Get deck progress
   */
  async getProgress(
    userId: string,
    deckId: string
  ): Promise<DeckProgress | null> {
    try {
      const docRef = doc(db, 'userProgress', `${userId}_${deckId}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as DeckProgress;
      }

      return null;
    } catch (error: any) {
      console.error('Error getting progress:', error);
      throw new Error(error.message || 'Failed to get progress');
    }
  },

  /**
   * Record a card answer
   */
  async recordCardAnswer(
    userId: string,
    deckId: string,
    cardId: string,
    isCorrect: boolean,
    timeSpent: number = 0
  ): Promise<void> {
    try {
      const docRef = doc(db, 'userProgress', `${userId}_${deckId}`);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await this.initializeProgress(userId, deckId);
      }

      const progress = (await getDoc(docRef)).data() as DeckProgress;
      const cardProgress = progress.cardProgress?.[cardId] || {
        cardId,
        attempts: 0,
        correct: 0,
        incorrect: 0,
        streak: 0,
        lastReviewDate: Timestamp.now(),
      };

      // Update card progress
      const newProgress: CardProgress = {
        ...cardProgress,
        attempts: cardProgress.attempts + 1,
        correct: isCorrect ? cardProgress.correct + 1 : cardProgress.correct,
        incorrect: !isCorrect
          ? cardProgress.incorrect + 1
          : cardProgress.incorrect,
        streak: isCorrect ? cardProgress.streak + 1 : 0,
        lastReviewDate: Timestamp.now(),
      };

      // Calculate accuracy
      const totalCards = Object.keys(progress.cardProgress).length;
      const correctCount = Object.values(progress.cardProgress).reduce(
        (sum: number, card: any) => sum + (card.correct || 0),
        0
      );
      const averageAccuracy =
        totalCards > 0 ? Math.round((correctCount / totalCards) * 100) : 0;

      // Update deck progress
      await updateDoc(docRef, {
        [`cardProgress.${cardId}`]: newProgress,
        lastReviewed: Timestamp.now(),
        timesReviewed: increment(1),
        cardsStudied: (progress.cardsStudied || 0) + 1,
        studyStats: {
          totalTimeSpent: (progress.studyStats?.totalTimeSpent || 0) +
            Math.round(timeSpent / 60),
          averageAccuracy,
          longestStreak: Math.max(
            newProgress.streak,
            progress.studyStats?.longestStreak || 0
          ),
        },
        status: this.getStatus(newProgress.attempts, newProgress.correct),
      });

      // Record quiz result
      await this.recordQuizResult(
        userId,
        deckId,
        cardId,
        isCorrect,
        timeSpent
      );
    } catch (error: any) {
      console.error('Error recording card answer:', error);
      throw new Error(error.message || 'Failed to record answer');
    }
  },

  /**
   * Record a quiz result
   */
  async recordQuizResult(
    userId: string,
    deckId: string,
    cardId: string,
    isCorrect: boolean,
    timeSpent: number
  ): Promise<void> {
    try {
      const resultRef = await addDoc(collection(db, 'quizResults'), {
        userId,
        deckId,
        cardId,
        isCorrect,
        timeSpent,
        completedAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error('Error recording quiz result:', error);
      // Don't throw - this is non-critical
    }
  },

  /**
   * Get user's all progress
   */
  async getUserProgress(userId: string): Promise<DeckProgress[]> {
    try {
      const q = query(
        collection(db, 'userProgress'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => doc.data() as DeckProgress);
    } catch (error: any) {
      console.error('Error getting user progress:', error);
      throw new Error(error.message || 'Failed to get progress');
    }
  },

  /**
   * Get statistics for a deck
   */
  async getDeckStats(userId: string, deckId: string) {
    try {
      const progress = await this.getProgress(userId, deckId);

      if (!progress) {
        return {
          totalCards: 0,
          masteredCards: 0,
          cardsStudied: 0,
          averageAccuracy: 0,
          longestStreak: 0,
          timesReviewed: 0,
          totalTimeSpent: 0,
        };
      }

      const totalCards = Object.keys(progress.cardProgress).length;
      const masteredCards = Object.values(progress.cardProgress).filter(
        (card: any) => card.correct >= 3 && card.streak >= 2
      ).length;

      return {
        totalCards,
        masteredCards,
        cardsStudied: progress.cardsStudied || 0,
        averageAccuracy: progress.studyStats?.averageAccuracy || 0,
        longestStreak: progress.studyStats?.longestStreak || 0,
        timesReviewed: progress.timesReviewed || 0,
        totalTimeSpent: progress.studyStats?.totalTimeSpent || 0,
      };
    } catch (error: any) {
      console.error('Error getting deck stats:', error);
      throw new Error(error.message || 'Failed to get stats');
    }
  },

  /**
   * Get card difficulty based on performance
   */
  getCardDifficulty(attempts: number, correct: number): 'easy' | 'medium' | 'hard' {
    if (attempts === 0) return 'medium';

    const accuracy = correct / attempts;

    if (accuracy >= 0.8) return 'easy';
    if (accuracy <= 0.4) return 'hard';
    return 'medium';
  },

  /**
   * Get learning status
   */
  getStatus(
    attempts: number,
    correct: number
  ): 'learning' | 'reviewing' | 'mastered' {
    if (correct >= 3 && attempts >= 5) return 'mastered';
    if (attempts >= 3) return 'reviewing';
    return 'learning';
  },

  /**
   * Reset progress for a deck
   */
  async resetProgress(userId: string, deckId: string): Promise<void> {
    try {
      const docRef = doc(db, 'userProgress', `${userId}_${deckId}`);
      await setDoc(docRef, {
        userId,
        deckId,
        status: 'learning',
        lastReviewed: Timestamp.now(),
        timesReviewed: 0,
        cardsStudied: 0,
        masteredCards: 0,
        cardProgress: {},
        studyStats: {
          totalTimeSpent: 0,
          averageAccuracy: 0,
          longestStreak: 0,
        },
      });
    } catch (error: any) {
      console.error('Error resetting progress:', error);
      throw new Error(error.message || 'Failed to reset progress');
    }
  },
};

// Helper imports for addDoc
import { addDoc } from 'firebase/firestore';