import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Text } from '../../components/Themed';
import { firestoreService } from '../../services/firestoreService';
import { Deck } from '../../services/firestoreService';

export default function DeckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        if (!id) return;

        const data = await firestoreService.deckService.getDeck(
          String(id)
        );

        setDeck(data);
      } catch (error) {
        console.error('Error loading deck:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeck();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#006156" />
      </View>
    );
  }

  if (!deck) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Deck not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{deck.title}</Text>
      <Text style={styles.subtitle}>{deck.cardsCount} cards</Text>
      <Text style={styles.desc}>{deck.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7faf9',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  desc: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
  },
});