import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Link, router, useFocusEffect } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebase';
import { DocumentParser } from '../../services/documentParser';
import { GeminiService } from '../../services/gemini';

export default function DashboardScreen() {
  const [showMenu, setShowMenu] = useState(false);
  const [showFabOptions, setShowFabOptions] = useState(false);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [showModuleOptions, setShowModuleOptions] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);

  const [user, setUser] = useState<any>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setModules([]);
      return;
    }
    const q = query(collection(db, 'users', user.uid, 'modules'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedModules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setModules(fetchedModules);
    });
    return unsub;
  }, [user]);

  const saveModuleToFirestore = async (quizData: any, titleText: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'modules'), {
        title: titleText,
        questionCount: quizData.length || 0,
        questions: quizData,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Failed saving module:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (auth.currentUser) {
        setUser({ ...auth.currentUser });
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

  const handleLogout = () => {
    signOut(auth).then(() => {
      setShowMenu(false);
      Alert.alert('Logged Out', 'You have been successfully logged out.');
    }).catch((error) => {
      Alert.alert('Logout Error', error.message);
    });
  };

  const handleImportFile = async () => {
    try {
      // 1. Native Document Picker locking to specific natively supported extensions
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/plain',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-powerpoint'
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileAsset = result.assets[0];

        setShowFabOptions(false);
        setIsGenerating(true);

        let generatedQuiz;

        // 2. Direct AI translation pipeline skipping the non-existent Flask Server
        if (fileAsset.mimeType === 'application/pdf') {
          const pdfBase64 = await DocumentParser.resolveBase64(fileAsset.uri);
          generatedQuiz = await GeminiService.generateQuizFromDocument("", pdfBase64, quizLength);
        } else if (fileAsset.mimeType === 'text/plain') {
          const text = await DocumentParser.parseTextFile(fileAsset.uri);
          generatedQuiz = await GeminiService.generateQuizFromDocument(text, null, quizLength);
        } else if (fileAsset.name.endsWith('.pptx')) {
          const text = await DocumentParser.parsePptx(fileAsset.uri);
          generatedQuiz = await GeminiService.generateQuizFromDocument(text, null, quizLength);
        } else if (fileAsset.name.endsWith('.docx') || fileAsset.name.endsWith('.doc')) {
          const text = await DocumentParser.parseDocx(fileAsset.uri);
          generatedQuiz = await GeminiService.generateQuizFromDocument(text, null, quizLength);
        } else {
          throw new Error("Unsupported or unrecognized file format strictly. Please upload PPTX, DOCX, PDF, or TXT.");
        }

        // Dynamically load into the quiz arena!
        await saveModuleToFirestore(generatedQuiz, fileAsset.name);
        router.push({
          pathname: '/quiz',
          params: { incomingQuizData: JSON.stringify(generatedQuiz) }
        });
      }
    } catch (err: any) {
      Alert.alert('Document Parsing Error', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [quizLength, setQuizLength] = useState(5);

  const handleGatherOnline = async (topic: string) => {
    setShowOnlineModal(false);
    setIsGenerating(true);

    try {
      // 1. Direct integration with our internal Gemini Service block, using dynamic length
      const generatedQuiz = await GeminiService.generateQuizFromTopic(topic, quizLength);

      // 2. We dynamically load into the Quiz Screen and inject our new data!
      await saveModuleToFirestore(generatedQuiz, topic);
      router.push({
        pathname: '/quiz',
        params: { incomingQuizData: JSON.stringify(generatedQuiz) }
      });

    } catch (err: any) {
      Alert.alert('Gemini Error', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowMenu(true)}>
            <MaterialIcons name="menu" size={28} color="#006156" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FlashLearn</Text>
          <View style={{ flex: 1 }} />
          <Link href="/profile" asChild>
            <TouchableOpacity>
              <Image
                source={{ uri: photoUri || user?.photoURL || 'https://i.pravatar.cc/100?img=11' }}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </Link>
        </View>

        {/* Momentum */}
        <View style={styles.momentumContainer}>
          <Text style={styles.momentumLabel}>DAILY MOMENTUM</Text>
          <Text style={styles.momentumTitle}>
            {user ? `Hello ${user.email?.split('@')[0]}!` : '5 Day Streak!'}
          </Text>
          <Text style={styles.momentumSubtitle}>
            You're in the flow. Keep the cognitive fire burning with a quick session.
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color="#9ca3af" />
          <TextInput
            placeholder="Search for topics, modules, or que"
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />
        </View>

        {/* Modules Header */}
        <View style={styles.modulesHeader}>
          <Text style={styles.modulesTitle}>Your Modules</Text>
        </View>

        {/* Dynamic Modules List */}
        {modules.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 32, backgroundColor: 'white', borderRadius: 24, marginTop: 16 }}>
            <MaterialIcons name="inventory-2" size={48} color="#e5e7eb" style={{ marginBottom: 16 }} />
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#4b5563' }}>No Modules Yet!</Text>
            <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>Tap the + button to import a document or search Gemini for topics.</Text>
          </View>
        ) : (
          modules.map((mod) => (
            <TouchableOpacity
              key={mod.id}
              style={styles.moduleCard}
              onPress={() => {
                setSelectedModule(mod);
                setShowModuleOptions(true);
              }}
            >
              <View style={[styles.badge, { backgroundColor: '#e0f2fe' }]}>
                <Text style={[styles.badgeText, { color: '#0369a1' }]}>GENERATED</Text>
              </View>
              <Text style={styles.cardTitle}>{mod.title}</Text>
              <Text style={styles.cardDesc}>
                Personalized generated quiz module ready for practice!
              </Text>
              <View style={styles.cardBottomRow}>
                <View style={styles.questionCountWrap}>
                  <MaterialCommunityIcons name="layers-outline" size={18} color="#1f2937" />
                  <Text style={styles.questionCountText}>{mod.questionCount || 0} Questions</Text>
                </View>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={() => {
                    // Seamlessly reload saved quiz into memory!
                    router.push({
                      pathname: '/quiz',
                      params: { incomingQuizData: JSON.stringify(mod.questions) }
                    });
                  }}
                >
                  <MaterialIcons name="play-arrow" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Spacer for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowFabOptions(true)}>
        <MaterialIcons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Sidebar Menu Modal */}
      <Modal visible={showMenu} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Menu</Text>
              <TouchableOpacity onPress={() => setShowMenu(false)}>
                <MaterialIcons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            <View style={styles.authBox}>
              {user ? (
                <>
                  <View style={styles.authInfoRow}>
                    <MaterialIcons name="person" size={24} color="#006156" />
                    <Text style={styles.authInfoText}>{user.email}</Text>
                  </View>
                  <TouchableOpacity style={styles.loginBtn} onPress={handleLogout}>
                    <MaterialIcons name="logout" size={20} color="#dc2626" style={{ marginRight: 8 }} />
                    <Text style={[styles.loginBtnText, { color: '#dc2626' }]}>Log Out</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={() => {
                    setShowMenu(false);
                    router.push('/login');
                  }}
                >
                  <MaterialCommunityIcons name="login" size={20} color="#006156" style={{ marginRight: 8 }} />
                  <Text style={styles.loginBtnText}>Log In</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sidebarSection}>Your Modules</Text>
            <ScrollView>
              {modules.length === 0 ? (
                <View style={[styles.topicItem, { borderBottomWidth: 0 }]}><Text style={styles.topicItemText}>No modules yet!</Text></View>
              ) : (
                modules.map((mod) => (
                  <TouchableOpacity
                    key={mod.id}
                    style={styles.topicItem}
                    onPress={() => {
                      setShowMenu(false);
                      router.push({
                        pathname: '/quiz',
                        params: { incomingQuizData: JSON.stringify(mod.questions) }
                      });
                    }}
                  >
                    <Text style={styles.topicItemText} numberOfLines={1}>{mod.title}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
          <TouchableOpacity style={styles.modalDismissArea} onPress={() => setShowMenu(false)} />
        </View>
      </Modal>

      {/* FAB Options Modal */}
      <Modal visible={showFabOptions} transparent={true} animationType="slide">
        <View style={styles.fabModalBg}>
          <TouchableOpacity style={styles.fabDismissArea} onPress={() => setShowFabOptions(false)} />
          <View style={styles.fabOptionsContainer}>
            <View style={styles.fabHandle} />

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontWeight: 'bold', color: '#4b5563', marginBottom: 12, fontSize: 12, letterSpacing: 1 }}>HOW MANY QUESTIONS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => setQuizLength(num)}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16,
                      backgroundColor: quizLength === num ? '#006156' : '#f3f4f6'
                    }}
                  >
                    <Text style={{
                      fontWeight: 'bold', fontSize: 14,
                      color: quizLength === num ? 'white' : '#4b5563'
                    }}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.fabOptionsTitle}>Add New Content</Text>

            <TouchableOpacity
              style={styles.fabOptionItem}
              onPress={() => {
                setShowFabOptions(false);
                setShowOnlineModal(true);
              }}
            >
              <View style={[styles.fabIcon, { backgroundColor: '#e0f2fe' }]}>
                <MaterialIcons name="cloud-download" size={24} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fabOptionLabel}>Gather Quizzes Online</Text>
                <Text style={styles.fabOptionSub}>Search web databases via API</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fabOptionItem} onPress={handleImportFile}>
              <View style={[styles.fabIcon, { backgroundColor: '#a7f3d0' }]}>
                <MaterialCommunityIcons name="file-import" size={24} color="#047857" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fabOptionLabel}>Import Document to Quiz</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Online Options Selection Modal */}
      <Modal visible={showOnlineModal} transparent={true} animationType="fade">
        <View style={styles.fabModalBg}>
          <TouchableOpacity style={styles.fabDismissArea} onPress={() => setShowOnlineModal(false)} />
          <View style={styles.fabOptionsContainer}>
            <View style={styles.fabHandle} />
            <Text style={styles.fabOptionsTitle}>Select Category to Query</Text>

            <ScrollView style={{ maxHeight: 220 }}>
              {["Computer Science", "Mathematics", "Biology", "World History", "Foreign Languages", "Literature"].map((topic, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.topicSelectBtn}
                  onPress={() => handleGatherOnline(topic)}
                >
                  <MaterialIcons name="bookmark-border" size={20} color="#006156" />
                  <Text style={styles.topicSelectText}>{topic}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Loading Gemini Modal */}
      <Modal visible={isGenerating} transparent={true} animationType="fade">
        <View style={[styles.modalBg, { justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ backgroundColor: 'white', padding: 32, borderRadius: 24, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#006156" />
            <Text style={{ marginTop: 16, fontWeight: 'bold', color: '#1f2937' }}>Asking Gemini...</Text>
          </View>
        </View>
      </Modal>

      {/* Module Options Bottom Sheet */}
      <Modal visible={showModuleOptions} transparent={true} animationType="slide">
        <View style={styles.fabModalBg}>
          <TouchableOpacity style={styles.fabDismissArea} onPress={() => setShowModuleOptions(false)} />
          <View style={styles.fabOptionsContainer}>
            <View style={styles.fabHandle} />
            <Text style={styles.fabOptionsTitle}>Module Actions</Text>
            <Text style={{ color: '#6b7280', marginBottom: 24, fontSize: 16 }}>{selectedModule?.title}</Text>

            <TouchableOpacity
              style={styles.fabOptionItem}
              onPress={() => {
                setShowModuleOptions(false);
                router.push({ pathname: '/quiz', params: { incomingQuizData: JSON.stringify(selectedModule?.questions) } });
              }}
            >
              <View style={[styles.fabIcon, { backgroundColor: '#dcfce7' }]}>
                <MaterialIcons name="play-arrow" size={24} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fabOptionLabel}>Start Quiz</Text>
                <Text style={styles.fabOptionSub}>Begin your practice session</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fabOptionItem} onPress={() => { Alert.alert('Edit', 'Edit features coming soon.'); setShowModuleOptions(false); }}>
              <View style={[styles.fabIcon, { backgroundColor: '#e0f2fe' }]}>
                <MaterialIcons name="edit" size={24} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fabOptionLabel}>Edit Deck</Text>
                <Text style={styles.fabOptionSub}>Modify the questions inside</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fabOptionItem} onPress={async () => {
              try {
                await deleteDoc(doc(db, 'users', user.uid, 'modules', selectedModule.id));
                setShowModuleOptions(false);
                Alert.alert("Deleted", "Module was successfully removed.");
              } catch (e: any) { Alert.alert("Error deleting", e.message); }
            }}>
              <View style={[styles.fabIcon, { backgroundColor: '#fee2e2' }]}>
                <MaterialIcons name="delete" size={24} color="#dc2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fabOptionLabel}>Delete Deck</Text>
                <Text style={styles.fabOptionSub}>Permanently erase this module</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f7faf9' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#006156', marginLeft: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1f2937' },
  momentumContainer: { marginBottom: 24 },
  momentumLabel: { fontSize: 12, fontWeight: 'bold', color: '#006156', letterSpacing: 1, marginBottom: 8 },
  momentumTitle: { fontSize: 32, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  momentumSubtitle: { fontSize: 15, color: '#4b5563', lineHeight: 22 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 16, paddingHorizontal: 16, height: 50, marginBottom: 32 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: '#1f2937' },
  modulesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modulesTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  viewAllBtn: { fontSize: 14, fontWeight: 'bold', color: '#006156' },
  moduleCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 16 },
  badgeText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  iconBadge: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#6b7280', lineHeight: 20, marginBottom: 24 },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  questionCountWrap: { flexDirection: 'row', alignItems: 'center' },
  questionCountText: { fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginLeft: 8 },
  playBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#006156', alignItems: 'center', justifyContent: 'center' },
  cardProgressRow: { flexDirection: 'row', alignItems: 'center' },
  progressText: { fontSize: 10, fontWeight: 'bold', color: '#006156', marginRight: 12 },
  progressBarBg: { flex: 1, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2 },
  progressBarFill: { height: '100%', backgroundColor: '#006156', borderRadius: 2 },
  cardSimpleRow: { flexDirection: 'row', alignItems: 'center' },
  simpleRowText: { fontSize: 10, fontWeight: 'bold', color: '#4b5563', marginLeft: 6 },

  fab: { position: 'absolute', bottom: 24, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: '#006156', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 },

  // Modals
  modalBg: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalDismissArea: { flex: 1 },
  sidebar: { width: '75%', backgroundColor: '#f7faf9', padding: 24, paddingTop: 60, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  sidebarTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  authBox: { backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 32 },
  authInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  authInfoText: { marginLeft: 8, fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  loginBtn: { flexDirection: 'row', backgroundColor: '#e5e7eb', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  loginBtnText: { fontWeight: 'bold', color: '#1f2937' },
  sidebarSection: { fontSize: 12, fontWeight: 'bold', color: '#9ca3af', marginBottom: 16, letterSpacing: 1 },
  topicItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  topicItemText: { color: '#4b5563', fontSize: 15 },

  fabModalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  fabDismissArea: { flex: 1 },
  fabOptionsContainer: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  fabHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 24 },
  fabOptionsTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 24 },
  fabOptionItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#f9fafb', padding: 16, borderRadius: 16 },
  fabIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  fabOptionLabel: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  fabOptionSub: { fontSize: 12, color: '#6b7280' },
  topicSelectBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  topicSelectText: { marginLeft: 12, fontSize: 16, color: '#1f2937', fontWeight: 'bold' }
});