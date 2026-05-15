import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/Themed';
import { useAuth } from '../../src/context/AuthContext';
import { firestoreService } from '../../services/firestoreService';
import { Deck } from '../../services/firestoreService';

export default function QuizScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load decks
  useEffect(() => {
    const load = async () => {
      try {
        if (!user) return;

        setLoading(true);
        setError(null);

        const data = await firestoreService.deckService.getUserDecks(user.uid);
        setDecks(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  // Navigate to quiz session
  const startQuiz = (deckId: string) => {
    router.push(`/quiz/${deckId}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#006156" />
        <Text style={styles.loadingText}>Loading quizzes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={40} color="#dc2626" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Practice Quiz</Text>
        <Text style={styles.subtitle}>
          Choose a deck to start practicing
        </Text>
      </View>

      {/* Deck List */}
      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => startQuiz(item.id)}
          >
            <View style={styles.cardLeft}>
              <Ionicons name="school" size={28} color="#006156" />
            </View>

            <View style={styles.cardCenter}>
              <Text style={styles.deckTitle}>{item.title}</Text>
              <Text style={styles.deckInfo}>
                {item.cardsCount} cards • {item.difficulty}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      />

      {/* Empty State */}
      {decks.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="library-outline" size={60} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No decks found</Text>
          <Text style={styles.emptyText}>
            Create a deck first before starting a quiz
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7faf9',
  },

  header: {
    padding: 20,
    paddingBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },

  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },

  list: {
    padding: 16,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },

  cardLeft: {
    marginRight: 12,
  },

  cardCenter: {
    flex: 1,
  },

  deckTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },

  deckInfo: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: '#6b7280',
  },

  errorText: {
    marginTop: 10,
    color: '#dc2626',
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    color: '#1f2937',
  },

  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 5,
    textAlign: 'center',
  },
});