import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export default function WelcomeScreen() {
  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      // Whenever user is authenticated, redirect them to dashboard.
      if (user) {
        // use short timeout to jump smoothly to the tabs navigator
        setTimeout(() => router.replace('/'), 0);
      }
    });
    return unsub;
  }, []);

  return (
    <View style={styles.mainContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuIconPair}>
            <MaterialIcons name="menu" size={24} color="#006156" />
            <Text style={styles.logoText}>FlashLearn</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.accountIcon}>
            <MaterialIcons name="person" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEyebrow}>UNLOCK YOUR POTENTIAL</Text>
          <Text style={styles.heroTitle}>
            Master Any{'\n'}Subject{' '}
            <Text style={styles.heroTitleHighlight}>with Focus</Text>
          </Text>
          <Text style={styles.heroDesc}>
            Step into a cognitive sanctuary designed for deep learning. Build lasting study habits through editorial-grade flashcards and smart tracking.
          </Text>

          <TouchableOpacity style={styles.getStartedPrimaryBtn} onPress={() => router.push('/register')}>
            <Text style={styles.getStartedPrimaryText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.loginTextBtn} onPress={() => router.push('/login')}>
            <Text style={styles.loginTextBtnText}>Log In</Text>
          </TouchableOpacity>

          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=800' }}
            style={styles.heroImage}
          />
        </View>

        {/* Designed for Retention Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Designed for Retention</Text>
          <Text style={styles.sectionDesc}>
            The tools you need to build mastery, without the noise.
          </Text>

          {/* Cards */}
          <View style={styles.featureCard}>
            <View style={[styles.featureIconWrap, { backgroundColor: '#006156' }]}>
              <FontAwesome5 name="layer-group" size={16} color="white" />
            </View>
            <Text style={styles.featureCardTitle}>Create Decks</Text>
            <Text style={styles.featureCardDesc}>
              Build beautiful, focused flashcard sets in seconds. Add images, hints, and rich text to make your study material memorable.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconWrap, { backgroundColor: '#5eead4' }]}>
              <MaterialIcons name="loop" size={20} color="#0d9488" />
            </View>
            <Text style={styles.featureCardTitle}>Practice Daily</Text>
            <Text style={styles.featureCardDesc}>
              Our spaced repetition algorithm adapts to your pace, ensuring you review exactly what you need at the perfect time.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconWrap, { backgroundColor: '#bbf7d0' }]}>
              <MaterialIcons name="insert-chart" size={20} color="#16a34a" />
            </View>
            <Text style={styles.featureCardTitle}>Track Progress</Text>
            <Text style={styles.featureCardDesc}>
              Visualize your growth with insightful analytics. Monitor your retention rates and celebrate your study streaks.
            </Text>
          </View>
        </View>

        {/* Philosophy Section */}
        <View style={styles.philosophySection}>
          <Text style={styles.heroEyebrow}>OUR PHILOSOPHY</Text>
          <Text style={styles.philosophyTitle}>
            Focus is the cornerstone of modern learning.
          </Text>
          
          <View style={styles.quoteBlock}>
            <Text style={styles.quoteText}>
              "The best tool is the one that disappears. FlashLearn helps you get into the 'flow state' and stay there, making complex subjects feel manageable."
            </Text>
          </View>

          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800' }}
            style={styles.heroImage}
          />
        </View>

        {/* Final CTA Container */}
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaTitle}>Ready to reach your goals?</Text>
          <Text style={styles.ctaDesc}>
            Join thousands of students who have transformed their learning habits with FlashLearn.
          </Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/register')}>
            <Text style={styles.ctaBtnText}>Get Started for Free</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>FlashLearn</Text>
          <Text style={styles.footerTagline}>Study anywhere. Offline access included.</Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLinkText}>Privacy</Text>
            <Text style={styles.footerLinkText}>Terms</Text>
            <Text style={styles.footerLinkText}>Contact</Text>
          </View>
          <Text style={styles.footerCopyright}>© 2024 FlashLearn. Built for Focus.</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6', 
  },
  scrollContent: {
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  menuIconPair: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#006156',
    marginLeft: 8,
  },
  accountIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#006156',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 48,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#006156',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1f2937',
    lineHeight: 44,
    marginBottom: 16,
  },
  heroTitleHighlight: {
    color: '#006156',
  },
  heroDesc: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 32,
  },
  getStartedPrimaryBtn: {
    backgroundColor: '#006156',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  getStartedPrimaryText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loginTextBtn: {
    alignItems: 'center',
    marginBottom: 40,
    paddingVertical: 12,
  },
  loginTextBtnText: {
    color: '#006156',
    fontWeight: 'bold',
    fontSize: 15,
  },
  heroImage: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
  },
  
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 32,
  },
  featureCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  featureCardDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },

  philosophySection: {
    paddingHorizontal: 20,
    marginBottom: 48,
  },
  philosophyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    lineHeight: 34,
    marginBottom: 24,
  },
  quoteBlock: {
    borderLeftWidth: 3,
    borderLeftColor: '#a7f3d0',
    paddingLeft: 16,
    marginBottom: 32,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#4b5563',
    lineHeight: 22,
  },

  ctaContainer: {
    backgroundColor: '#006156',
    marginHorizontal: 20,
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    marginBottom: 48,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  ctaTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaDesc: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 32,
  },
  ctaBtn: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  ctaBtnText: {
    color: '#006156',
    fontWeight: 'bold',
    fontSize: 14,
  },

  footer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingBottom: 60,
  },
  footerLogo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006156',
    marginBottom: 8,
  },
  footerTagline: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 24,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  footerLinkText: {
    fontSize: 12,
    color: '#4b5563',
  },
  footerCopyright: {
    fontSize: 10,
    color: '#9ca3af',
  }
});
