import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ImageBackground, Image } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useCallback } from 'react';

export default function ModuleStatsScreen() {
  const [user, setUser] = useState<any>(auth.currentUser);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setUser(auth.currentUser ? { ...auth.currentUser } : null);
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

  return (
    <View style={styles.mainContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Navigation */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
            <MaterialIcons name="arrow-back" size={24} color="#006156" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FlashLearn</Text>
          <View style={{ flex: 1 }} />
          <Image source={{ uri: photoUri || user?.photoURL || 'https://i.pravatar.cc/100?img=11' }} style={styles.avatar} />
        </View>

        {/* Module Title Info */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.moduleTag}>STATISTICS OVERVIEW</Text>
          <Text style={styles.moduleTitle}>Your Progress</Text>
          <Text style={styles.moduleDesc}>
            Review your mastery scores and recent quiz runs generated from the Gemini API.
          </Text>
        </View>

        {/* Mastery Score Badge */}
        <View style={styles.masteryScoreRow}>
          <View style={styles.masteryCircle}>
            <Text style={styles.masteryScoreText}>78%</Text>
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.masteryLabel}>AVERAGE MASTERY</Text>
            <Text style={styles.masteryLevel}>Intermediate</Text>
          </View>
        </View>

        {/* Hero Image Card */}
        <View style={styles.heroCardContainer}>
          <ImageBackground 
            source={{ uri: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=800' }}
            style={styles.heroImage}
            imageStyle={{ borderRadius: 24 }}
          >
            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle}>Highest Performance</Text>
              <Text style={styles.heroSub}>World History Module - 100% Score</Text>
            </View>
          </ImageBackground>
        </View>

        {/* Question Count & History */}
        <View style={styles.historyCard}>
          <View>
            <Text style={styles.historyLabel}>QUESTIONS ANSWERED</Text>
            <Text style={styles.historyCount}>124</Text>
          </View>
          <TouchableOpacity style={styles.reviewBtn}>
            <Text style={styles.reviewBtnText}>Review History</Text>
          </TouchableOpacity>
        </View>

        {/* Curated Questions Section */}
        <View style={styles.curatedHeader}>
          <View>
            <Text style={styles.curatedTitle}>Recent Quiz Runs</Text>
            <Text style={styles.curatedSub}>History of AI Generated Quizzes</Text>
          </View>
        </View>
        
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.addBtn}>
            <MaterialIcons name="add-circle" size={16} color="#1f2937" />
            <Text style={styles.addBtnText}>Add New Question</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.startBtn}>
            <MaterialIcons name="play-arrow" size={16} color="white" />
            <Text style={styles.startBtnText}>Start Quiz</Text>
          </TouchableOpacity>
        </View>

        {/* Question List */}
        <View style={styles.qItem}>
          <View style={styles.qHeaderRow}>
            <View style={styles.statusDotCorrect} />
            <Text style={styles.statusLabelCorrect}>CORRECT 3X</Text>
            <View style={{ flex: 1 }} />
            <MaterialIcons name="more-vert" size={20} color="#9ca3af" />
          </View>
          <Text style={styles.qText}>
            Which organelle is responsible for the process of aerobic respiration in eukaryotic cells?
          </Text>
          <View style={styles.hintWrap}>
            <MaterialIcons name="lightbulb" size={16} color="#006156" />
            <Text style={styles.hintText}>
              <Text style={{ fontWeight: 'bold' }}>Hint:</Text> Think about the "powerhouse" often described in textbook metaphors.
            </Text>
          </View>
        </View>

        <View style={styles.qItem}>
          <View style={styles.qHeaderRow}>
            <View style={styles.statusDotNeedsReview} />
            <Text style={styles.statusLabelNeedsReview}>NEEDS REVIEW</Text>
            <View style={{ flex: 1 }} />
            <MaterialIcons name="more-vert" size={20} color="#9ca3af" />
          </View>
          <Text style={styles.qText}>
            What are the four nucleotide bases found in DNA strands?
          </Text>
        </View>

        <View style={styles.qItem}>
          <View style={styles.qHeaderRow}>
            <View style={styles.statusDotCorrect} />
            <Text style={styles.statusLabelCorrect}>CORRECT 1X</Text>
            <View style={{ flex: 1 }} />
            <MaterialIcons name="more-vert" size={20} color="#9ca3af" />
          </View>
          <Text style={styles.qText}>
            Explain the primary difference between prokaryotic and eukaryotic cells regarding their nucleus.
          </Text>
          <View style={styles.hintWrap}>
            <MaterialIcons name="lightbulb" size={16} color="#006156" />
            <Text style={styles.hintText}>
              <Text style={{ fontWeight: 'bold' }}>Hint:</Text> One has a membrane-bound enclosure for genetic material, while the other does not.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <View style={styles.footerIconWrap}>
            <MaterialIcons name="psychology" size={24} color="#6b7280" />
          </View>
          <Text style={styles.footerTitle}>Grow your knowledge</Text>
          <Text style={styles.footerDesc}>
            Biology is vast. Add more questions to your deck to build broader mastery.
          </Text>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Browse Shared Biology Decks</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <FontAwesome5 name="bolt" size={24} color="white" />
      </TouchableOpacity>
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
    marginBottom: 32,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006156',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1f2937'
  },
  moduleTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#006156',
    letterSpacing: 1,
    marginBottom: 8,
  },
  moduleTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  moduleDesc: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  masteryScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  masteryCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f7faf9',
    borderWidth: 2,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  masteryScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#006156',
  },
  masteryLabel: {
    fontSize: 10,
    color: '#6b7280',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  masteryLevel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  heroCardContainer: {
    height: 240,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 20,
  },
  heroTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  historyCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  historyLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#006156',
    letterSpacing: 0.5,
  },
  historyCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  reviewBtn: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  reviewBtnText: {
    color: '#006156',
    fontWeight: 'bold',
    fontSize: 12,
  },
  curatedHeader: {
    marginBottom: 16,
  },
  curatedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  curatedSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
    paddingVertical: 14,
    borderRadius: 20,
  },
  addBtnText: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: '#1f2937',
    fontSize: 14,
  },
  startBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#006156',
    paddingVertical: 14,
    borderRadius: 20,
  },
  startBtnText: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: 'white',
    fontSize: 14,
  },
  qItem: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  qHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDotCorrect: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginRight: 6,
  },
  statusLabelCorrect: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#16a34a',
    letterSpacing: 0.5,
  },
  statusDotNeedsReview: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc2626',
    marginRight: 6,
  },
  statusLabelNeedsReview: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  qText: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
    marginBottom: 16,
  },
  hintWrap: {
    flexDirection: 'row',
    backgroundColor: '#f7faf9',
    padding: 12,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 18,
    marginLeft: 8,
  },
  footerContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginTop: 16,
  },
  footerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  footerDesc: {
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#006156',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#006156',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  }
});