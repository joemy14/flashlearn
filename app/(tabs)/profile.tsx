import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity, ScrollView, StyleSheet, Text, View, Image, Alert, Modal } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';

export default function ProfileScreen() {
  const user = auth.currentUser;
  const [photoUri, setPhotoUri] = useState<string | null>(user?.photoURL || null);
  const [modules, setModules] = useState<any[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      if (auth.currentUser) {
        getDoc(doc(db, "users", auth.currentUser.uid)).then(snap => {
          if (snap.exists() && snap.data().photoBase64) {
             setPhotoUri(snap.data().photoBase64);
          } else {
             setPhotoUri(auth.currentUser?.photoURL || null);
          }
        }).catch(err => {
          setPhotoUri(auth.currentUser?.photoURL || null);
        });
      }
    }, [])
  );

  useEffect(() => {
    if (!user) {
      setModules([]);
      return;
    }
    const q = query(collection(db, 'users', user.uid, 'modules'), orderBy('createdAt', 'desc'), limit(5));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedModules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setModules(fetchedModules);
    });
    return unsub;
  }, [user]);

  const getJoinDate = () => {
    if (!user || !user.metadata.creationTime) return "Joined Recently";
    const date = new Date(user.metadata.creationTime);
    return `Joined ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || "Study Master";

  const handlePickImage = async () => {
    // Request permission natively
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission needed", "Permission to access camera roll is required!");
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      aspect: [1, 1],
      quality: 0.1, // Compress heavily to strictly fit inside auth metadata
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhotoUri(base64Uri); // Fast UI update
      
      // Persist to Firestore DB as a string payload to completely bypass Auth and Storage networking constraints!
      if (user) {
        try {
          await setDoc(doc(db, "users", user.uid), { photoBase64: base64Uri }, { merge: true });
          Alert.alert("Success", "Profile picture synchronized via Firestore database!");
        } catch (error: any) {
          Alert.alert("Error storing profile image payload", error.message);
        }
      }
    }
  };

  const dummyFriends = [
    { id: '1', name: 'Alex Johnson', username: '@alexj' },
    { id: '2', name: 'Sarah Smith', username: '@sarahs' },
    { id: '3', name: 'Mike Chen', username: '@mikec' }
  ];

  return (
    <View style={styles.mainContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* FlashLearn Top Bar Header injected */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={28} color="#006156" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FlashLearn</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity>
             <MaterialIcons name="settings" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrap}>
            {photoUri ? (
               <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
               <View style={styles.avatarPlaceholder}>
                 <MaterialIcons name="person" size={48} color="white" />
               </View>
            )}
            <View style={styles.editBadge}>
              <MaterialIcons name="edit" size={14} color="white" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.joinDate}>{getJoinDate()}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>Top Learner</Text></View>
            <View style={[styles.badge, styles.badgeGray]}><Text style={styles.badgeGrayText}>Quiz Enthusiast</Text></View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>128</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Quiz Generations</Text>
        <View style={styles.quizList}>
          {modules.length === 0 ? (
             <Text style={{color: '#9ca3af', fontStyle: 'italic', marginBottom: 16}}>No recent quiz generations found.</Text>
          ) : (
             modules.map((mod, index) => (
               <TouchableOpacity 
                 key={mod.id} 
                 style={styles.quizItem}
                 onPress={() => router.push({ pathname: '/quiz', params: { incomingQuizData: JSON.stringify(mod.questions) }})}
               >
                  <View style={[styles.quizIconWrap, { backgroundColor: index % 2 === 0 ? '#a7f3d0' : '#e0f2fe' }]}>
                     <MaterialIcons name={index % 2 === 0 ? "science" : "language"} size={24} color={index % 2 === 0 ? "#047857" : "#0284c7"} />
                  </View>
                  <View style={{ flex: 1 }}>
                     <Text style={styles.quizItemTitle} numberOfLines={1}>{mod.title}</Text>
                     <Text style={styles.quizItemSub}>{mod.questionCount || 0} Questions • Generated Recently</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => { setSelectedModule(mod); setShowShareModal(true); }}
                    style={{ padding: 8 }}
                  >
                     <MaterialIcons name="share" size={24} color="#006156" />
                  </TouchableOpacity>
               </TouchableOpacity>
             ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsCard}>
          <View style={styles.achievementsRow}>
            <View style={styles.achievementItem}>
              <View style={styles.achievementIcon}>
                <MaterialIcons name="local-fire-department" size={32} color="#006156" />
              </View>
              <Text style={styles.achievementLabel}>5 Day Streak</Text>
            </View>
            <View style={styles.achievementItem}>
              <View style={[styles.achievementIcon, styles.achievementLocked]}>
                <MaterialIcons name="stars" size={32} color="#9ca3af" />
              </View>
              <Text style={styles.achievementLabelLocked}>Perfect Score</Text>
            </View>
            <View style={styles.achievementItem}>
              <View style={[styles.achievementIcon, styles.achievementLocked]}>
                <MaterialIcons name="school" size={32} color="#9ca3af" />
              </View>
              <Text style={styles.achievementLabelLocked}>Deck Master</Text>
            </View>
          </View>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Share Modal */}
      <Modal visible={showShareModal} transparent={true} animationType="slide">
        <View style={styles.fabModalBg}>
          <TouchableOpacity style={styles.fabDismissArea} onPress={() => setShowShareModal(false)} />
          <View style={styles.fabOptionsContainer}>
            <View style={styles.fabHandle} />
            <Text style={styles.fabOptionsTitle}>Share Dashboard</Text>
            <Text style={{color: '#6b7280', marginBottom: 16}}>Send "{selectedModule?.title}" to a friend</Text>
            
            <ScrollView style={{maxHeight: 300}}>
               {dummyFriends.map(friend => (
                 <View key={friend.id} style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', padding: 16, borderRadius: 16, marginBottom: 12}}>
                    <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center', marginRight: 12}}>
                       <Text style={{color: '#006156', fontWeight: 'bold'}}>{friend.name.charAt(0)}</Text>
                    </View>
                    <View style={{flex: 1}}>
                       <Text style={{fontWeight: 'bold', color: '#1f2937'}}>{friend.name}</Text>
                       <Text style={{color: '#6b7280', fontSize: 12}}>{friend.username}</Text>
                    </View>
                    <TouchableOpacity style={{backgroundColor: '#006156', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12}} onPress={() => {
                        Alert.alert("Sent!", `Quiz successfully sent to ${friend.name}!`);
                        setShowShareModal(false);
                    }}>
                       <Text style={{color: 'white', fontWeight: 'bold', fontSize: 12}}>Send</Text>
                    </TouchableOpacity>
                 </View>
               ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f7faf9',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006156',
    marginLeft: 12,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    backgroundColor: '#006156',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1f2937',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  joinDate: {
    color: '#6b7280',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  badge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeGray: {
    backgroundColor: '#f3f4f6',
  },
  badgeText: {
    color: '#006156',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeGrayText: {
    color: '#4b5563',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#006156',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  quizList: {
    marginBottom: 32,
  },
  quizItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  quizIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quizItemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  quizItemSub: {
    fontSize: 12,
    color: '#6b7280',
  },
  achievementsCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  achievementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  achievementItem: {
    alignItems: 'center',
    flex: 1,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#dcfce7',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  achievementLocked: {
    backgroundColor: '#f3f4f6',
  },
  achievementLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#16a34a',
    textAlign: 'center',
  },
  achievementLabelLocked: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9ca3af',
    textAlign: 'center',
  },
  fabModalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  fabDismissArea: { flex: 1 },
  fabOptionsContainer: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  fabHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 24 },
  fabOptionsTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
});