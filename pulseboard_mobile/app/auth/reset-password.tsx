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
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Lock, Eye, EyeOff, Zap } from 'lucide-react-native';
import { resetPassword } from '../../src/api/auth.api';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const LN_VOLT = '#CCF900';
const BG_IMAGE = require('../../assets/roll.jpg');

export default function ResetPasswordScreen() {
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Missing Data', 'Please enter and confirm your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ email, otp, newPassword });
      Alert.alert('Success', 'Password has been reset successfully. You can now login.', [
        { text: 'OK', onPress: () => router.replace('/auth/login') }
      ]);
    } catch (error: any) {
      console.log("Reset Password Error:", error);
      const msg = error?.response?.data?.message || 'Failed to reset password. Please try again.';
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
                    Authentication
                  </Text>
                </View>

                <Text
                  className="text-white font-black italic tracking-tighter uppercase"
                  style={{ fontSize: hp('5.5%'), lineHeight: hp('6%'), marginBottom: hp('2%') }}
                >
                  New<Text className="text-[#CCF900]">.</Text>{"\n"}Password
                </Text>

                <Text
                  className="text-neutral-400 font-medium"
                  style={{ fontSize: hp('1.8%'), lineHeight: hp('2.4%'), maxWidth: wp('80%') }}
                >
                  Create a new secure password for your account.
                </Text>
              </View>
            </View>

            <View style={{ marginTop: hp('4%'), gap: hp('2.5%') }}>
              <View>
                <Text
                  className="text-neutral-500 font-bold uppercase"
                  style={{ fontSize: hp('1.2%'), letterSpacing: 2, marginBottom: hp('1%'), marginLeft: wp('1%') }}
                >
                  New Security Key // Password
                </Text>
                <View
                  className={`bg-[#121212]/90 rounded-xl border flex-row items-center px-4 ${focusedInput === 'newPassword' ? 'border-[#CCF900]' : 'border-neutral-800'
                    }`}
                  style={{ height: hp('6.5%') }}
                >
                  <Lock color={focusedInput === 'newPassword' ? LN_VOLT : '#555'} size={hp('2.5%')} style={{ marginRight: wp('3%') }} />
                  <TextInput
                    className="flex-1 text-white font-bold h-full"
                    style={{ fontSize: hp('1.8%') }}
                    placeholder="••••••••"
                    placeholderTextColor="#444"
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    selectionColor={LN_VOLT}
                    onFocus={() => setFocusedInput('newPassword')}
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

              <View>
                <Text
                  className="text-neutral-500 font-bold uppercase"
                  style={{ fontSize: hp('1.2%'), letterSpacing: 2, marginBottom: hp('1%'), marginLeft: wp('1%') }}
                >
                  Confirm Security Key
                </Text>
                <View
                  className={`bg-[#121212]/90 rounded-xl border flex-row items-center px-4 ${focusedInput === 'confirmPassword' ? 'border-[#CCF900]' : 'border-neutral-800'
                    }`}
                  style={{ height: hp('6.5%') }}
                >
                  <Lock color={focusedInput === 'confirmPassword' ? LN_VOLT : '#555'} size={hp('2.5%')} style={{ marginRight: wp('3%') }} />
                  <TextInput
                    className="flex-1 text-white font-bold h-full"
                    style={{ fontSize: hp('1.8%') }}
                    placeholder="••••••••"
                    placeholderTextColor="#444"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    selectionColor={LN_VOLT}
                    onFocus={() => setFocusedInput('confirmPassword')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: wp('2%') }}>
                    {showConfirmPassword ? (
                      <EyeOff color="#555" size={hp('2.5%')} />
                    ) : (
                      <Eye color="#555" size={hp('2.5%')} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                className={`bg-[#CCF900] justify-center items-center group ${loading ? 'opacity-70' : ''}`}
                onPress={handleResetPassword}
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
                      UPDATE PASSWORD
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
