import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Wait a tiny bit and push so UI has time to update
      setTimeout(() => router.replace('/'), 300);
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(
        "Email Required", 
        "Please enter your email address into the input field above so we know where to send the password reset link!"
      );
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Recovery Email Sent", `We've sent password reset instructions to: \n\n${email}`);
    } catch (err: any) {
      Alert.alert("Password Reset Failed", err.message);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <MaterialIcons name="school" size={20} color="white" />
              </View>
              <Text style={styles.logoText}>FlashLearn</Text>
            </View>
            <TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* Titles */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Log in</Text>
            <Text style={styles.subtitle}>
              Enter your email and password to securely access your account and manage your services.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
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
              <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 12, paddingVertical: 4 }} onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Log In</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Sign Up here</Text>
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
  scrollContent: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 60, flexGrow: 1, justifyContent: 'center' },
  header: { position: 'absolute', top: 40, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#006156', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  logoText: { fontSize: 18, fontWeight: 'bold', color: '#006156' },
  titleSection: { alignItems: 'center', marginBottom: 48, marginTop: 80 },
  mainTitle: { fontSize: 32, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  subtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 24, paddingHorizontal: 16 },
  formContainer: {},
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#006156', letterSpacing: 0.5, marginBottom: 8 },
  pwdLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  forgotText: { fontSize: 10, fontWeight: 'bold', color: '#006156' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#e5e7eb' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#1f2937' },
  loginBtn: { flexDirection: 'row', backgroundColor: '#006156', height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 16, shadowColor: '#006156', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  loginBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: '#4b5563', fontSize: 14 },
  footerLink: { color: '#006156', fontSize: 14, fontWeight: 'bold' }
});
