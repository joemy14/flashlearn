import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';

function TabIcon({ name, focused, isFontAwesome }: { name: any, focused: boolean, isFontAwesome?: boolean }) {
  if (focused) {
    return (
      <View style={styles.activeIconContainer}>
        {isFontAwesome ? (
          <FontAwesome5 name={name} size={20} color="white" />
        ) : (
          <MaterialIcons name={name} size={24} color="white" />
        )}
      </View>
    );
  }
  return isFontAwesome ? (
    <FontAwesome5 name={name} size={20} color="#9ca3af" />
  ) : (
    <MaterialIcons name={name} size={24} color="#9ca3af" />
  );
}

export default function TabLayout() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      // If the user is missing, kick them out of the tab environment instantly
      if (!user) {
        setTimeout(() => router.replace('/welcome'), 0);
      }
    });
    return unsub;
  }, []);

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#006156',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarShowLabel: true,
      tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold', marginTop: 4 },
      tabBarStyle: {
        backgroundColor: '#f7faf9',
        borderTopWidth: 0,
        elevation: 0,
        height: Platform.OS === 'ios' ? 88 : 70,
        paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        paddingTop: 10,
      },
      headerShown: false,
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'DASHBOARD', 
          tabBarIcon: ({ focused }) => <TabIcon name="dashboard" focused={focused} /> 
        }} 
      />
      <Tabs.Screen 
        name="quiz" 
        options={{ 
          href: null,
          title: 'PRACTICE', 
          tabBarIcon: ({ focused }) => <TabIcon name="school" focused={focused} /> 
        }} 
      />
      <Tabs.Screen 
        name="stats" 
        options={{ 
          title: 'STATISTICS', 
          tabBarIcon: ({ focused }) => <TabIcon name="bar-chart" focused={focused} /> 
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'PROFILE', 
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} /> 
        }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconContainer: {
    backgroundColor: '#006156',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8,
  }
});
