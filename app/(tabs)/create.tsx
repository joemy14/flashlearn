import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/Themed';
import { useAuth } from '../../src/context/AuthContext';
import { firestoreService } from '../../services/firestoreService';
import { cstyles } from '../../components/styles/create.styles';


export default function CreateScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<
  'beginner' | 'intermediate' | 'advanced'
>('beginner');

  const handleCreateDeck = async () => {
    try {
      if (!user) return;

      setLoading(true);

      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);

      const deckId = await firestoreService.deckService.createDeck(
        user.uid,
        title,
        description,
        tagsArray
      );

      router.replace(`/deck/${deckId}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create deck');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={cstyles.container}>

      <Text style={cstyles.header}>Create New Deck</Text>

      <View style={cstyles.card}>

        <Text style={cstyles.label}>Deck Name</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter deck name"
          placeholderTextColor="#9ca3af"
          style={cstyles.input}
        />

        <Text style={cstyles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Optional description"
          placeholderTextColor="#9ca3af"
          style={[cstyles.input, cstyles.textArea]}
          multiline
        />

        <Text style={cstyles.label}>Difficulty</Text>
        <View style={cstyles.row}>
          {['beginner', 'intermediate', 'advanced'].map(level => (
            <TouchableOpacity
              key={level}
              onPress={() =>
  setDifficulty(level as 'beginner' | 'intermediate' | 'advanced')
}
              style={[
                cstyles.difficultyBtn,
                difficulty === level && cstyles.activeDifficulty,
              ]}
            >
              <Text
                style={[
                  cstyles.difficultyText,
                  difficulty === level && cstyles.activeText,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={cstyles.createBtn}
          onPress={handleCreateDeck}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="add" size={20} color="white" />
              <Text style={cstyles.createText}>Create Deck</Text>
            </>
          )}
        </TouchableOpacity>

      </View>
    </View>
  );
}