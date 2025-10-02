import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { UserType } from '@/types/User';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<UserType>(UserType.CUSTOMER);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signup, error } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSignup = async () => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (userType === UserType.SHOP && (!businessName.trim() || !businessType.trim() || !phoneNumber.trim())) {
      Alert.alert('Error', 'Please fill in all business information');
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        email: email.trim(),
        password,
        name: name.trim(),
        userType,
        businessInfo: userType === UserType.SHOP ? {
          businessName: businessName.trim(),
          businessType: businessType.trim(),
          phoneNumber: phoneNumber.trim(),
        } : undefined,
      });
      // Navigation will be handled by the auth state change
    } catch (error) {
      // Error is handled by the context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Join FoodSaverr and start saving food
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.userTypeContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Account Type</Text>
            <View style={styles.userTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  { borderColor: colors.border },
                  userType === UserType.CUSTOMER && { backgroundColor: colors.tint },
                ]}
                onPress={() => setUserType(UserType.CUSTOMER)}
              >
                <Text
                  style={[
                    styles.userTypeButtonText,
                    { color: userType === UserType.CUSTOMER ? 'white' : colors.text },
                  ]}
                >
                  Customer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  { borderColor: colors.border },
                  userType === UserType.SHOP && { backgroundColor: colors.tint },
                ]}
                onPress={() => setUserType(UserType.SHOP)}
              >
                <Text
                  style={[
                    styles.userTypeButtonText,
                    { color: userType === UserType.SHOP ? 'white' : colors.text },
                  ]}
                >
                  Shop Owner
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              {userType === UserType.SHOP ? 'Business Name' : 'Full Name'} *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder={userType === UserType.SHOP ? 'Enter business name' : 'Enter your full name'}
              placeholderTextColor={colors.tabIconDefault}
              autoCapitalize="words"
            />
          </View>

          {userType === UserType.SHOP && (
            <>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Business Type *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={businessType}
                  onChangeText={setBusinessType}
                  placeholder="e.g., Bakery, Restaurant, Grocery Store"
                  placeholderTextColor={colors.tabIconDefault}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Phone Number *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.tabIconDefault}
                  keyboardType="phone-pad"
                />
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Email *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.tabIconDefault}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Password *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password (min 6 characters)"
              placeholderTextColor={colors.tabIconDefault}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Confirm Password *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              placeholderTextColor={colors.tabIconDefault}
              secureTextEntry
            />
          </View>

          {error && (
            <Text style={[styles.errorText, { color: colors.notification }]}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.signupButton,
              { backgroundColor: colors.tint },
              isLoading && styles.disabledButton,
            ]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.signupButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={[styles.linkText, { color: colors.tint }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  userTypeContainer: {
    marginBottom: 24,
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  userTypeButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  userTypeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  signupButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
