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
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// REQUIRED: completes the auth.expo.io handshake and closes the browser tab
WebBrowser.maybeCompleteAuthSession();





// --- Theme Constants ---
const LN_VOLT = '#CCF900';

// --- Load the Image ---
const BG_IMAGE = require('../../assets/roll.jpg');
// Google OAuth config — redirect URI is generated automatically by expo-auth-session
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // ── Google OAuth via auth.expo.io Proxy (Manual Implementation) ──────────
  // In expo-auth-session v7, useProxy was removed from types but SessionUrlProvider
  // still exists in the JS runtime. We manually build the proxy flow:
  // 1. Build the Google OAuth URL
  // 2. Get the local exp:// return URL (what the app listens on)
  // 3. Wrap it in the auth.expo.io /start URL (this registers the session)
  // 4. openAuthSessionAsync watches for the returnUrl (exp://) to close the browser
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);

      const state = Math.random().toString(36).substring(2, 12);
      const nonce = Math.random().toString(36).substring(2, 18);

      // ① What Google redirects TO (must be in Google Cloud Console Authorized Redirect URIs)
      const proxyRedirectUri = 'https://auth.expo.io/@ashvr/pulseboard_mobile';

      // ② What auth.expo.io relays back TO (the local Expo Go deep-link)
      //    Linking.createURL() → "exp://10.23.x.x:8081/--/auth/login" in Expo Go
      const returnUrl = Linking.createURL('auth/login');

      // ③ Raw Google OAuth URL (sends user to Google, redirect back to auth.expo.io)
      const googleAuthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(proxyRedirectUri)}` +
        `&response_type=id_token` +
        `&scope=${encodeURIComponent('openid profile email')}` +
        `&state=${state}` +
        `&nonce=${nonce}` +
        `&prompt=${encodeURIComponent('consent select_account')}`;

      // ④ auth.expo.io /start URL — registers the session so the proxy knows where to relay
      //    Flow: /start → Google → auth.expo.io → returnUrl (exp://)
      const startUrl =
        `${proxyRedirectUri}/start?` +
        `authUrl=${encodeURIComponent(googleAuthUrl)}` +
        `&returnUrl=${encodeURIComponent(returnUrl)}`;

      // ⑤ openAuthSessionAsync watches for navigation to returnUrl (exp://) to close browser
      const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);

      if (result.type === 'success' && result.url) {
        // auth.expo.io appends the token params to the exp:// URL as query params
        // Use extremely fast Regex to prevent single-threaded Hermes/JSC bottlenecks parsing Polyfills
        const idTokenMatch = result.url.match(/id_token=([^&]+)/);
        const idToken = idTokenMatch ? idTokenMatch[1] : null;

        if (!idToken) {
          const errMatch = result.url.match(/error_description=([^&]+)/) || result.url.match(/error=([^&]+)/);
          const err = errMatch ? decodeURIComponent(errMatch[1]) : 'No id_token received from Google.';
          Alert.alert('Google Error', err);
          return;
        }

        const data = await googleLoginUser(idToken);
        if (data.token) {
          // Club portal routing logic
          const clubEmails = [
            'quantclub@iitj.ac.in', 'devluplabs@iitj.ac.in', 'raid@iitj.ac.in',
            'inside@iitj.ac.in', 'theproductcub@iitj.ac.in', 'theproductclub@iitj.ac.in',
            'psoc@iitj.ac.in', 'tgt@iitj.ac.in', 'shutterbugs@iitj.ac.in',
            'atelier@iitj.ac.in', 'framex@iitj.ac.in', 'designerds@iitj.ac.in',
            'dramebaaz@iitj.ac.in', 'ecell@iitj.ac.in', 'nexus@iitj.ac.in', 'respawn@iitj.ac.in'
          ];

          const userEmail = data.user?.email || '';

          // Small delay to let the browser tab fully close before navigating.
          // On Android, navigating while the Custom Chrome Tab is still dismissing
          // can cause Expo Router to show an unmatched route screen.
          // (Delay removed: Bug fixed via valid returnUrl)
          if (clubEmails.includes(userEmail.toLowerCase().trim())) {
            router.replace('/club_tabs/home');
          } else {
            router.replace('/tabs/home');
          }
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // user cancelled — do nothing
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Google login failed.';
      Alert.alert('Google Error', msg);
    } finally {
      setGoogleLoading(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────


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

        // Club portal routing logic
        const clubEmails = [
          'quantclub@iitj.ac.in', 'devluplabs@iitj.ac.in', 'raid@iitj.ac.in',
          'inside@iitj.ac.in', 'theproductcub@iitj.ac.in', 'theproductclub@iitj.ac.in',
          'psoc@iitj.ac.in', 'tgt@iitj.ac.in', 'shutterbugs@iitj.ac.in',
          'atelier@iitj.ac.in', 'framex@iitj.ac.in', 'designerds@iitj.ac.in',
          'dramebaaz@iitj.ac.in', 'ecell@iitj.ac.in', 'nexus@iitj.ac.in', 'respawn@iitj.ac.in'
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
      console.log("Login Error Full:", error);
      if (error.message === 'Network Error') {
        Alert.alert(
          'Connection Failed',
          'Cannot reach the server. \n\n1. Check if backend is running.\n2. Ensure API_URL uses your IP (not localhost).'
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
    <View className="flex-1 bg-[#050505]">
      {/* HIDE STATUS BAR */}
      <StatusBar hidden={true} />

      {/* LAYER 1: The Image (Lion) */}
      <ImageBackground
        source={BG_IMAGE}
        className="flex-1"
        resizeMode="cover"
        imageStyle={{ opacity: 0.35 }}
      >

        {/* LAYER 2: The Gradient Mask */}
        <LinearGradient
          colors={['transparent', 'rgba(5, 5, 5, 0.6)', '#050505']}
          locations={[0, 0.4, 0.8]}
          className="absolute w-full h-full"
        />

        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 justify-between"
            style={{ paddingHorizontal: wp('6%') }}
          >
            {/* --- Header Section --- */}
            <View style={{ marginTop: hp('2%') }}>
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-[#121212]/80 border border-neutral-800 rounded-full justify-center items-center"
                style={{
                  width: wp('12%'),
                  height: wp('12%'),
                  marginBottom: hp('3%')
                }}
              >
                <ChevronLeft color="white" size={wp('6%')} />
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
                  className="text-white font-black italic tracking-tighter uppercase"
                  style={{ fontSize: hp('5.5%'), lineHeight: hp('6%'), marginBottom: hp('2%') }}
                >
                  System<Text className="text-[#CCF900]">.</Text>{"\n"}Login
                </Text>

                <Text
                  className="text-neutral-400 font-medium"
                  style={{ fontSize: hp('1.8%'), lineHeight: hp('2.4%'), maxWidth: wp('80%') }}
                >
                  Enter your credentials to sync with the campus network.
                </Text>
              </View>
            </View>

            {/* --- Form Section --- */}
            <View style={{ marginTop: hp('2%'), gap: hp('2.5%') }}>

              {/* Email Input */}
              <View>
                <Text
                  className="text-neutral-500 font-bold uppercase"
                  style={{ fontSize: hp('1.2%'), letterSpacing: 2, marginBottom: hp('1%'), marginLeft: wp('1%') }}
                >
                  Identifier // Email
                </Text>
                <View
                  className={`bg-[#121212]/90 rounded-xl border flex-row items-center px-4 ${focusedInput === 'email' ? 'border-[#CCF900]' : 'border-neutral-800'
                    }`}
                  style={{ height: hp('6.5%') }} // Adjusted Height
                >
                  <Mail color={focusedInput === 'email' ? LN_VOLT : '#555'} size={hp('2.5%')} style={{ marginRight: wp('3%') }} />
                  <TextInput
                    className="flex-1 text-white font-bold h-full"
                    style={{ fontSize: hp('1.8%') }}
                    placeholder="user@iitj.ac.in"
                    placeholderTextColor="#444"
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

              {/* Password Input */}
              <View>
                <Text
                  className="text-neutral-500 font-bold uppercase"
                  style={{ fontSize: hp('1.2%'), letterSpacing: 2, marginBottom: hp('1%'), marginLeft: wp('1%') }}
                >
                  Security Key // Password
                </Text>
                <View
                  className={`bg-[#121212]/90 rounded-xl border flex-row items-center px-4 ${focusedInput === 'password' ? 'border-[#CCF900]' : 'border-neutral-800'
                    }`}
                  style={{ height: hp('6.5%') }} // Adjusted Height
                >
                  <Lock color={focusedInput === 'password' ? LN_VOLT : '#555'} size={hp('2.5%')} style={{ marginRight: wp('3%') }} />
                  <TextInput
                    className="flex-1 text-white font-bold h-full"
                    style={{ fontSize: hp('1.8%') }}
                    placeholder="••••••••"
                    placeholderTextColor="#444"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    selectionColor={LN_VOLT}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: wp('2%') }}>
                    {showPassword ? (
                      <EyeOff color="#555" size={hp('2.5%')} />
                    ) : (
                      <Eye color="#555" size={hp('2.5%')} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity style={{ alignItems: 'flex-end', marginTop: hp('0.5%') }}>
                <Text
                  className="text-neutral-400 font-bold uppercase border-b border-[#CCF900]/50"
                  style={{ fontSize: hp('1.4%'), letterSpacing: 1, paddingBottom: 2 }}
                >
                  Reset Credentials?
                </Text>
              </TouchableOpacity>

              {/* Main Action Button */}
              <TouchableOpacity
                className={`bg-[#CCF900] justify-center items-center group ${loading ? 'opacity-70' : ''}`}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
                style={{
                  height: hp('6.5%'),
                  marginTop: hp('2%'),
                  transform: [{ skewX: '-12deg' }],
                  borderRadius: 4
                }}
              >
                {loading ? (
                  <View style={{ transform: [{ skewX: '12deg' }] }}>
                    <ActivityIndicator color="black" />
                  </View>
                ) : (
                  <View className="flex-row items-center" style={{ transform: [{ skewX: '12deg' }] }}>
                    <Text
                      className="text-black font-black uppercase mr-2"
                      style={{ fontSize: hp('2%'), letterSpacing: 2 }}
                    >
                      INITIATE SESSION
                    </Text>
                    <Zap color="black" size={hp('2.5%')} fill="black" />
                  </View>
                )}
              </TouchableOpacity>

              {/* ── Divider ── */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: hp('1%') }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#2a2a2a' }} />
                <Text style={{ color: '#444', fontSize: hp('1.4%'), marginHorizontal: wp('3%'), fontFamily: 'monospace', letterSpacing: 2 }}>
                  OR
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#2a2a2a' }} />
              </View>

              {/* ── Google Sign-In Button ── */}
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={googleLoading}
                activeOpacity={0.85}
                style={{
                  height: hp('6.5%'),
                  backgroundColor: '#121212',
                  borderWidth: 1,
                  borderColor: googleLoading ? '#333' : '#CCF900',
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
                    {/* Google 'G' logo as coloured text */}
                    <Text style={{ fontSize: hp('2.2%'), fontWeight: '900', color: '#4285F4', letterSpacing: -1 }}>
                      G
                    </Text>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: hp('1.8%'), letterSpacing: 1, textTransform: 'uppercase' }}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

            </View>

            {/* --- Footer --- */}
            <View style={{ paddingBottom: hp('4%'), alignItems: 'center' }}>
              <View className="flex-row items-center">
                <Text
                  className="text-neutral-400 font-medium mr-2"
                  style={{ fontSize: hp('1.6%') }}
                >
                  New to PulseBoard?
                </Text>
                <TouchableOpacity onPress={() => router.push('/auth/register')}>
                  <Text
                    className="text-white font-black uppercase border-b border-[#CCF900]"
                    style={{ fontSize: hp('1.6%'), letterSpacing: 1 }}
                  >
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