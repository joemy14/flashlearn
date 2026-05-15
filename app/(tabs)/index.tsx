import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TextInput,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/Themed';
import { useAuth } from '../../src/context/AuthContext';
import { firestoreService } from '../../services/firestoreService';
import { offlineService } from '../../services/offlineService';
import { Deck } from '../../services/firestoreService';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [decks, setDecks] = useState<Deck[]>([]);
  const [filteredDecks, setFilteredDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated]);

  // Load decks
  const loadDecks = async () => {
    try {
      if (!user) return;

      setError(null);
      setLoading(true);

      // Try to get from Firestore first
      const firestoreDecks = await firestoreService.deckService.getUserDecks(
        user.uid
      );
      setDecks(firestoreDecks);
      
      // Cache decks for offline
      await offlineService.cacheDecks(user.uid, firestoreDecks);

      // Also load from cache in case of connection issues
      if (firestoreDecks.length === 0) {
        const cachedDecks = await offlineService.getCachedDecks(user.uid);
        if (cachedDecks.length > 0) {
          setDecks(cachedDecks);
        }
      }
    } catch (err: any) {
      console.error('Error loading decks:', err);
      setError(err.message || 'Failed to load decks');

      // Try to load from cache on error
      if (user) {
        const cachedDecks = await offlineService.getCachedDecks(user.uid);
        if (cachedDecks.length > 0) {
          setDecks(cachedDecks);
          setError('Using cached decks. Connect to sync.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Load decks on mount
  useFocusEffect(
    useCallback(() => {
      loadDecks();
    }, [user])
  );

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDecks();
    setRefreshing(false);
  };

  // Filter decks by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDecks(decks);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredDecks(
        decks.filter(
          deck =>
            deck.title.toLowerCase().includes(query) ||
            deck.description.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, decks]);

  // Render deck item
  const renderDeckItem = ({ item: deck }: { item: Deck }) => (
    <TouchableOpacity
      style={styles.deckCard}
      onPress={() => router.push(`./deck/${deck.id}`)}
    >
      <View style={styles.deckHeader}>
        <View style={styles.deckIconContainer}>
          <Ionicons name="layers" size={24} color="white" />
        </View>
        <View style={styles.deckInfo}>
          <Text style={styles.deckTitle} numberOfLines={2}>
            {deck.title}
          </Text>
          <Text style={styles.deckCards}>{deck.cardsCount} cards</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
      </View>

      {deck.description ? (
        <Text style={styles.deckDesc} numberOfLines={2}>
          {deck.description}
        </Text>
      ) : null}

      <View style={styles.deckFooter}>
        <View style={styles.difficultyBadge}>
          <Text style={styles.difficultyText}>{deck.difficulty}</Text>
        </View>
        <Text style={styles.lastUpdated}>
          {new Date(deck.updatedAt.toDate()).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.username}>{user?.displayName || 'Learner'}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-circle" size={40} color="#006156" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{decks.length}</Text>
            <Text style={styles.statLabel}>Decks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {decks.reduce((sum, d) => sum + d.cardsCount, 0)}
            </Text>
            <Text style={styles.statLabel}>Cards</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search decks..."
          placeholderTextColor="#d1d5db"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#92400e" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Loading State */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#006156" />
          <Text style={styles.loadingText}>Loading your decks...</Text>
        </View>
      ) : filteredDecks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="layers-outline" size={64} color="#d1d5db" />
          </View>
          <Text style={styles.emptyTitle}>No decks yet</Text>
          <Text style={styles.emptyDesc}>
            {searchQuery
              ? 'No decks match your search'
              : 'Create your first flashcard deck to get started'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push('/create')}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.createBtnText}>Create Deck</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredDecks}
          renderItem={renderDeckItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Floating Action Button */}
      {!loading && decks.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/create')}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7faf9',
  },
  headerSection: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  settingsBtn: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f0fdfa',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006156',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#92400e',
    fontSize: 12,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createBtn: {
    flexDirection: 'row',
    backgroundColor: '#006156',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  createBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100,
  },
  deckCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deckIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#006156',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deckInfo: {
    flex: 1,
  },
  deckTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  deckCards: {
    fontSize: 12,
    color: '#6b7280',
  },
  deckDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  deckFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    backgroundColor: '#f0fdfa',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#006156',
    textTransform: 'capitalize',
  },
  lastUpdated: {
    fontSize: 11,
    color: '#9ca3af',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#006156',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
});