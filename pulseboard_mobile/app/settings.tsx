import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { ChevronLeft, User, Bell, Shield, CircleHelp, Info, ChevronRight, UserCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { getUserProfile } from '../src/api/user.api';
import { useTheme } from '../src/context/ThemeContext';

// Theme Constants (Dark Only)
const THEME_BG_DARK = '#050505';
const THEME_CARD_DARK = '#121212';
const THEME_ACCENT = '#CCF900';
const THEME_TEXT_SEC = '#737373';
const THEME_BORDER_DARK = '#1A1A1A';

interface UserData {
  _id: string;
  name: string;
  email: string;
}

export default function SettingsScreen() {
  const { isDark } = useTheme(); // isDark is now always true
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const colors = {
    bg: THEME_BG_DARK,
    card: THEME_CARD_DARK,
    border: THEME_BORDER_DARK,
    text: 'white',
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getUserProfile();
        setUser(userData);
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const SettingItem = ({ icon: Icon, title, value, type = 'chevron', onPress }: any) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderColor: colors.border }]}
      onPress={onPress}
      disabled={type === 'switch'}
      activeOpacity={0.7}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Icon color={THEME_ACCENT} size={18} strokeWidth={2} />
        </View>
        <Text style={[styles.settingItemText, { color: colors.text }]}>{title}</Text>
      </View>
      
      {type === 'chevron' && (
        <View style={styles.settingItemRight}>
          {value && <Text style={styles.settingValueText}>{value}</Text>}
          <ChevronRight color="#333" size={16} />
        </View>
      )}

      {type === 'switch' && (
        <Switch
          trackColor={{ false: '#333', true: THEME_ACCENT + '40' }}
          thumbColor={notificationsEnabled ? THEME_ACCENT : '#f4f3f4'}
          onValueChange={setNotificationsEnabled}
          value={notificationsEnabled}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft color={colors.text} size={20} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>SETTINGS</Text>
        <View style={{ width: 40 }} /> {/* Spacer for centering */}
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingItem 
              icon={UserCircle} 
              title="Profile Information" 
              value={loading ? "Loading..." : (user?.name || "Guest")}
              onPress={() => {}} 
            />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <SettingItem 
              icon={Shield} 
              title="Password & Security" 
              onPress={() => {}} 
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingItem 
              icon={Bell} 
              title="Push Notifications" 
              type="switch" 
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingItem icon={CircleHelp} title="Help Center" onPress={() => {}} />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <SettingItem icon={Info} title="Legal & Privacy" onPress={() => {}} />
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.card, styles.logoutButton, { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: colors.border }]}
            activeOpacity={0.7}
            onPress={async () => {
              const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
              await AsyncStorage.removeItem('token');
              router.replace('/');
            }}
          >
             <Text style={styles.logoutText}>Log Out from System</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>PulseBoard v1.0.0 (Production)</Text>
          <Text style={styles.copyrightText}>© 2026 PulseBoard Technologies</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('5%'),
    paddingTop: hp('1%'),
  },
  section: {
    marginBottom: hp('3%'),
  },
  sectionTitle: {
    color: THEME_TEXT_SEC,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  settingItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    color: THEME_TEXT_SEC,
    fontSize: 13,
    marginRight: 8,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  logoutButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  footer: {
    alignItems: 'center',
    marginTop: hp('2%'),
    paddingVertical: hp('2%'),
  },
  versionText: {
    color: '#404040',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  copyrightText: {
    color: '#262626',
    fontSize: 10,
    fontWeight: '600',
  }
});
