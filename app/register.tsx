import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "The passwords you entered do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setTimeout(() => router.replace('/'), 300);
    } catch (err: any) {
      Alert.alert("Registration Failed", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Top Bar */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>

          <View style={styles.logoCenterWrap}>
            <Text style={styles.logoMainText}>FlashLearn</Text>
            <View style={styles.logoUnderline} />
          </View>

          {/* Titles */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Create Account</Text>
            <Text style={styles.subtitle}>
              Create a new account to get started and enjoy seamless access to our features.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Feather name="user" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#9ca3af"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Create Account</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Sign In here</Text>
                </TouchableOpacity>
              </Link>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fdfc' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 60, flexGrow: 1 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, marginBottom: 24 },
  logoCenterWrap: { alignItems: 'center', marginBottom: 40 },
  logoMainText: { fontSize: 24, fontWeight: 'bold', color: '#006156', letterSpacing: -0.5 },
  logoUnderline: { width: 48, height: 3, backgroundColor: '#5eead4', marginTop: 4, borderRadius: 2 },
  titleSection: { marginBottom: 32 },
  mainTitle: { fontSize: 32, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#6b7280', lineHeight: 24 },
  formContainer: {},
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#4b5563', letterSpacing: 0.5, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#e5e7eb' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#1f2937' },
  loginBtn: { flexDirection: 'row', backgroundColor: '#006156', height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 24, shadowColor: '#006156', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  loginBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: '#4b5563', fontSize: 14 },
  footerLink: { color: '#006156', fontSize: 14, fontWeight: 'bold' }
});
