import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, ChevronLeft, Mail, Lock, Zap } from 'lucide-react-native';
import { loginUser, googleLoginUser } from '../../src/services/auth.service';
import api from '../../src/api/client';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useTheme } from '../../src/context/ThemeContext';

// REQUIRED: completes the auth.expo.io handshake and closes the browser tab
WebBrowser.maybeCompleteAuthSession();

// --- Theme Constants ---
const LN_VOLT = '#CCF900';

// --- Load the Image ---
const BG_IMAGE = require('../../assets/roll.jpg');
// Google OAuth config — redirect URI is generated automatically by expo-auth-session
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export default function LoginScreen() {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const colors = {
    bg: isDark ? '#050505' : '#FFFFFF',
    card: isDark ? '#121212' : '#F5F5F7',
    text: isDark ? 'white' : 'black',
    border: isDark ? '#262626' : '#E5E5E5',
    subtext: isDark ? '#A1A1A1' : '#666666',
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);

      const state = Math.random().toString(36).substring(2, 12);
      const nonce = Math.random().toString(36).substring(2, 18);

      const proxyRedirectUri = 'https://auth.expo.io/@ashvr/pulseboard_mobile';
      const returnUrl = Linking.createURL('auth/login');

      const googleAuthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(proxyRedirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('openid profile email https://www.googleapis.com/auth/gmail.readonly')}` +
        `&access_type=offline` +
        `&prompt=${encodeURIComponent('consent select_account')}` +
        `&state=${state}` +
        `&nonce=${nonce}`;

      const startUrl =
        `${proxyRedirectUri}/start?` +
        `authUrl=${encodeURIComponent(googleAuthUrl)}` +
        `&returnUrl=${encodeURIComponent(returnUrl)}`;

      const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);

      if (result.type === 'success' && result.url) {
        const returnedUrl = new URL(result.url);
        const code =
          returnedUrl.searchParams.get('code') ||
          new URLSearchParams(result.url.split('#')[1] || '').get('code');

        if (!code) {
          const err = returnedUrl.searchParams.get('error_description') ||
            returnedUrl.searchParams.get('error') ||
            'No authorization code received from Google.';
          Alert.alert('Google Error', err);
          return;
        }

        const data = await googleLoginUser({ code, redirectUri: proxyRedirectUri });
        if (data.token) {
          // PERSISTENCE: Save token to device
          await AsyncStorage.setItem('token', data.token);

          const pushToken = await AsyncStorage.getItem('expoPushToken');
          if (pushToken) {
            api.post('/users/save-push-token', { expoPushToken: pushToken }).catch(() => {});
          }

          const clubEmails = [
            'quantclub@iitj.ac.in', 'devluplabs@iitj.ac.in', 'raid@iitj.ac.in',
            'inside@iitj.ac.in', 'theproductcub@iitj.ac.in', 'theproductclub@iitj.ac.in',
            'psoc@iitj.ac.in', 'tgt@iitj.ac.in', 'shutterbugs@iitj.ac.in',
            'atelier@iitj.ac.in', 'framex@iitj.ac.in', 'designerds@iitj.ac.in',
            'dramebaaz@iitj.ac.in', 'ecell@iitj.ac.in', 'nexus@iitj.ac.in', 'respawn@iitj.ac.in'
          ];

          const userEmail = data.user?.email || '';
          if (clubEmails.includes(userEmail.toLowerCase().trim())) {
            router.replace('/club_tabs/home');
          } else {
            router.replace('/tabs/home');
          }
        }
      } 
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Google login failed.';
      Alert.alert('Google Error', msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Data', 'Please enter both identifier and security key.');
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser({ email, password });

      if (response.token) {
        await AsyncStorage.setItem('token', response.token);

        const pushToken = await AsyncStorage.getItem('expoPushToken');
        if (pushToken) {
          api.post('/users/save-push-token', { expoPushToken: pushToken }).catch(() => {});
        }

        const clubEmails = [
          'quantclub@iitj.ac.in', 'devluplabs@iitj.ac.in', 'raid@iitj.ac.in',
          'inside@iitj.ac.in', 'theproductcub@iitj.ac.in', 'theproductclub@iitj.ac.in',
          'psoc@iitj.ac.in', 'dancesoc@iitj.ac.in', 'shutterbugs@iitj.ac.in',
          'atelier@iitj.ac.in', 'framex@iitj.ac.in', 'designerds@iitj.ac.in',
          'dramebaaz@iitj.ac.in', 'ecell@iitj.ac.in', 'nexus@iitj.ac.in', 'respawn@iitj.ac.in',
          'quiz@iitj.ac.in'
        ];

        if (clubEmails.includes(email.toLowerCase().trim())) {
          router.replace('/club_tabs/home');
        } else {
          router.replace('/tabs/home');
        }
      } else {
        throw new Error("No token received");
      }
    } catch (error: any) {
      if (error?.response?.status === 403 && error?.response?.data?.requiresVerification) {
        const unverifiedEmail = error?.response?.data?.email || email;
        Alert.alert(
          'Email Not Verified',
          'Please verify your email to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Verify Now', 
              onPress: () => router.push({ pathname: '/auth/verify-otp', params: { email: unverifiedEmail } })
            }
          ]
        );
      } else {
        const msg = error?.response?.data?.message || 'Access Denied. Check credentials.';
        Alert.alert('System Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ImageBackground
        source={BG_IMAGE}
        className="flex-1"
        resizeMode="cover"
        imageStyle={{ opacity: isDark ? 0.35 : 0.08 }}
      >
        <LinearGradient
          colors={isDark 
            ? ['transparent', 'rgba(5, 5, 5, 0.6)', '#050505'] 
            : ['transparent', 'rgba(255, 255, 255, 0.4)', '#FFFFFF']}
          locations={[0, 0.4, 0.8]}
          className="absolute w-full h-full"
        />

        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 justify-between"
            style={{ paddingHorizontal: wp('6%') }}
          >
            <View style={{ marginTop: hp('2%') }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  width: wp('12%'),
                  height: wp('12%'),
                  marginBottom: hp('3%'),
                  backgroundColor: colors.card,
                  borderColor: colors.border
                }}
                className="border rounded-full justify-center items-center"
              >
                <ChevronLeft color={colors.text} size={wp('6%')} />
              </TouchableOpacity>

              <View>
                <View className="flex-row items-center space-x-2 mb-2">
                  <View className="rounded-full animate-pulse" style={{ width: wp('2%'), height: wp('2%'), backgroundColor: '#CCF900' }} />
                  <Text
                    className="text-[#CCF900] font-mono uppercase"
                    style={{ fontSize: hp('1.4%'), letterSpacing: 3 }}
                  >
                    Secure Access
                  </Text>
                </View>

                <Text
                  className="font-black italic tracking-tighter uppercase"
                  style={{ color: colors.text, fontSize: hp('5.5%'), lineHeight: hp('6%'), marginBottom: hp('2%') }}
                >
                  System<Text className="text-[#CCF900]">.</Text>{"\n"}Login
                </Text>

                <Text
                  className="font-medium"
                  style={{ color: colors.subtext, fontSize: hp('1.8%'), lineHeight: hp('2.4%'), maxWidth: wp('80%') }}
                >
                  Enter your credentials to sync with the campus network.
                </Text>
              </View>
            </View>

            <View style={{ marginTop: hp('2%'), gap: hp('2.5%') }}>
              <View>
                <Text
                  className="text-neutral-500 font-bold uppercase"
                  style={{ fontSize: hp('1.2%'), letterSpacing: 2, marginBottom: hp('1%'), marginLeft: wp('1%') }}
                >
                  Identifier // Email
                </Text>
                <View
                  style={{ height: hp('6.5%'), backgroundColor: colors.card, borderColor: focusedInput === 'email' ? LN_VOLT : colors.border }}
                  className="rounded-xl border flex-row items-center px-4"
                >
                  <Mail color={focusedInput === 'email' ? LN_VOLT : '#888'} size={hp('2.5%')} style={{ marginRight: wp('3%') }} />
                  <TextInput
                    className="flex-1 font-bold h-full"
                    style={{ color: colors.text, fontSize: hp('1.8%') }}
                    placeholder="user@iitj.ac.in"
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    selectionColor={LN_VOLT}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              <View>
                <Text
                  className="text-neutral-500 font-bold uppercase"
                  style={{ fontSize: hp('1.2%'), letterSpacing: 2, marginBottom: hp('1%'), marginLeft: wp('1%') }}
                >
                  Security Key // Password
                </Text>
                <View
                  style={{ height: hp('6.5%'), backgroundColor: colors.card, borderColor: focusedInput === 'password' ? LN_VOLT : colors.border }}
                  className="rounded-xl border flex-row items-center px-4"
                >
                  <Lock color={focusedInput === 'password' ? LN_VOLT : '#888'} size={hp('2.5%')} style={{ marginRight: wp('3%') }} />
                  <TextInput
                    className="flex-1 font-bold h-full"
                    style={{ color: colors.text, fontSize: hp('1.8%') }}
                    placeholder="••••••••"
                    placeholderTextColor="#888"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    selectionColor={LN_VOLT}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: wp('2%') }}>
                    <Eye color="#888" size={hp('2.5%')} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={{ alignItems: 'flex-end', marginTop: hp('0.5%') }}
                onPress={() => router.push('/auth/forgot-password')}
              >
                <Text
                  className="font-bold uppercase border-b border-[#CCF900]/50"
                  style={{ color: colors.subtext, fontSize: hp('1.4%'), letterSpacing: 1, paddingBottom: 2 }}
                >
                  Reset Credentials?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`bg-[#CCF900] justify-center items-center group ${loading ? 'opacity-70' : ''}`}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
                style={{ height: hp('6.5%'), marginTop: hp('2%'), transform: [{ skewX: '-12deg' }], borderRadius: 4 }}
              >
                {loading ? (
                  <View style={{ transform: [{ skewX: '12deg' }] }}>
                    <ActivityIndicator color="black" />
                  </View>
                ) : (
                  <View className="flex-row items-center" style={{ transform: [{ skewX: '12deg' }] }}>
                    <Text className="text-black font-black uppercase mr-2" style={{ fontSize: hp('2%'), letterSpacing: 2 }}>
                      INITIATE SESSION
                    </Text>
                    <Zap color="black" size={hp('2.5%')} fill="black" />
                  </View>
                )}
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: hp('1%') }}>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                <Text style={{ color: colors.subtext, fontSize: hp('1.4%'), marginHorizontal: wp('3%'), fontFamily: 'monospace', letterSpacing: 2 }}>
                  OR
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              </View>

              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={googleLoading}
                activeOpacity={0.85}
                style={{
                  height: hp('6.5%'),
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: googleLoading ? colors.border : '#CCF900',
                  borderRadius: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: wp('3%'),
                  opacity: googleLoading ? 0.6 : 1,
                }}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#CCF900" />
                ) : (
                  <>
                    <Text style={{ fontSize: hp('2.2%'), fontWeight: '900', color: '#4285F4', letterSpacing: -1 }}>G</Text>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: hp('1.8%'), letterSpacing: 1, textTransform: 'uppercase' }}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ paddingBottom: hp('4%'), alignItems: 'center' }}>
              <View className="flex-row items-center">
                <Text className="font-medium mr-2" style={{ color: colors.subtext, fontSize: hp('1.6%') }}>
                  New to PulseBoard?
                </Text>
                <TouchableOpacity onPress={() => router.push('/auth/register')}>
                  <Text className="font-black uppercase border-b border-[#CCF900]" style={{ color: colors.text, fontSize: hp('1.6%'), letterSpacing: 1 }}>
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}