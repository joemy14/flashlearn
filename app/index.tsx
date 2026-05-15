import { View, Text } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/(tabs)');
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading...</Text>
    </View>
  );
}