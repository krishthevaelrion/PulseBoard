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
import { ChevronLeft, Mail, Zap } from 'lucide-react-native';
import { sendForgotPasswordOtp } from '../../src/api/auth.api';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const LN_VOLT = '#CCF900';
const BG_IMAGE = require('../../assets/roll.jpg');

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert('Missing Data', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await sendForgotPasswordOtp({ email });
      Alert.alert('Success', 'Password reset OTP sent to your email.');
      router.push({ pathname: '/auth/verify-reset-otp', params: { email } });
    } catch (error: any) {
      console.log("Forgot Password Error:", error);
      const msg = error?.response?.data?.message || 'Failed to send OTP. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#050505]">
      <StatusBar hidden={true} />
      <ImageBackground
        source={BG_IMAGE}
        className="flex-1"
        resizeMode="cover"
        imageStyle={{ opacity: 0.35 }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(5, 5, 5, 0.6)', '#050505']}
          locations={[0, 0.4, 0.8]}
          className="absolute w-full h-full"
        />

        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
            style={{ paddingHorizontal: wp('6%') }}
          >
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
                    Account Recovery
                  </Text>
                </View>

                <Text
                  className="text-white font-black italic tracking-tighter uppercase"
                  style={{ fontSize: hp('5.5%'), lineHeight: hp('6%'), marginBottom: hp('2%') }}
                >
                  Forgot<Text className="text-[#CCF900]">.</Text>{"\n"}Password
                </Text>

                <Text
                  className="text-neutral-400 font-medium"
                  style={{ fontSize: hp('1.8%'), lineHeight: hp('2.4%'), maxWidth: wp('80%') }}
                >
                  Enter your email to receive a recovery code.
                </Text>
              </View>
            </View>

            <View style={{ marginTop: hp('4%'), gap: hp('2.5%') }}>
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
                  style={{ height: hp('6.5%') }}
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

              <TouchableOpacity
                className={`bg-[#CCF900] justify-center items-center group ${loading ? 'opacity-70' : ''}`}
                onPress={handleSendOtp}
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
                      SEND OTP
                    </Text>
                    <Zap color="black" size={hp('2.5%')} fill="black" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
