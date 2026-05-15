import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Text } from '../../components/Themed';
import { useAuth } from '../../src/context/AuthContext';
import { Stack } from 'expo-router';

export default function SignupScreen() {
  const router = useRouter();
  const { signup, loading, error, clearError } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldError, setFieldError] = useState('');

  const validateForm = (): boolean => {
    setFieldError('');

    if (!displayName.trim()) {
      setFieldError('Display name is required');
      return false;
    }

    if (!email.trim()) {
      setFieldError('Email is required');
      return false;
    }

    if (!email.includes('@')) {
      setFieldError('Please enter a valid email');
      return false;
    }

    if (!password) {
      setFieldError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setFieldError('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setFieldError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    try {
      if (!validateForm()) return;

      clearError();
      await signup(email.trim(), password, displayName.trim());
      router.replace('../');
    } catch (err: any) {
      setFieldError(err.message || 'Failed to sign up');
    }
  };

  const displayedError = fieldError || error;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join FlashLearn to start learning</Text>
        </View>

        {/* Error Message */}
        {displayedError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{displayedError}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#9ca3af"
              value={displayName}
              onChangeText={setDisplayName}
              editable={!loading}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
              secureTextEntry
            />
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Sign In Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '500',
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  button: {
    backgroundColor: '#006156',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    paddingHorizontal: 12,
    color: '#9ca3af',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  linkText: {
    color: '#006156',
    fontSize: 14,
    fontWeight: '600',
  },
});