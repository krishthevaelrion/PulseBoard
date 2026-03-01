import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  SafeAreaView, StatusBar, ActivityIndicator, Platform, StyleSheet,
  Modal, TextInput, TextInputProps, Alert 
} from 'react-native';
import { 
  Menu, Calendar, PlayCircle, MapPin, LogOut, 
  X, Grid, Users, Box, Siren, Target, Briefcase, Settings, ChevronRight, Plus, Send
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router'; 
import { getEventFeed, createEventApi } from '../../src/api/event.api'; 
import { getUserProfile } from '../../src/api/user.api';
import { getAllClubs } from '../../src/api/club.api'; 
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { LinearGradient } from 'expo-linear-gradient'; 
import { MotiView, AnimatePresence } from 'moti'; 
import { Easing } from 'react-native-reanimated';

const THEME_ACCENT = '#CCF900'; 

// Utility for RGBA conversion
const getRgba = (hex: string, opacity: number) => {
    if(!hex) return `rgba(255, 255, 255, ${opacity})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const SidebarItem = React.memo(({ icon: Icon, label, color, index, onPress, isAlert }: any) => (
  <MotiView
    from={{ opacity: 0, translateX: 20 }}
    animate={{ opacity: 1, translateX: 0 }}
    transition={{ type: 'timing', duration: 300, delay: index * 30, easing: Easing.out(Easing.quad) }} 
    style={{ marginBottom: hp('1.2%') }}
  >
    <TouchableOpacity 
      activeOpacity={0.6}
      onPress={onPress}
      style={{ 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
        paddingVertical: hp('1.6%'), paddingHorizontal: wp('4%'), backgroundColor: '#0F0F0F', 
        borderRadius: 18, borderWidth: 1, borderColor: isAlert ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.08)'
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ 
            width: wp('10%'), height: wp('10%'), borderRadius: 12, backgroundColor: getRgba(color, 0.1), 
            alignItems: 'center', justifyContent: 'center', marginRight: wp('3.5%'), borderWidth: 1, borderColor: getRgba(color, 0.15)
        }}>
          <Icon color={color} size={hp('2%')} />
        </View>
        <Text style={{ color: isAlert ? '#EF4444' : '#E5E5E5', fontSize: hp('1.7%'), fontWeight: '600' }}>{label}</Text>
      </View>
      {!isAlert && <ChevronRight color="#333" size={hp('1.8%')} />}
    </TouchableOpacity>
  </MotiView>
));

const SectionHeader = React.memo(({ title, icon: Icon, color = "white" }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: wp('6%'), marginBottom: hp('2.5%'), marginTop: hp('1%') }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp('3%') }}>
      {Icon && <Icon color={color} size={hp('2.5%')} />}
      <Text style={{ color: 'white', fontSize: hp('2%'), fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>{title}</Text>
    </View>
  </View>
));

export default function HomeScreen() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>({ name: "Loading...", following: [] });
  
  // --- ADMIN LOGIC ---
  const [adminClub, setAdminClub] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventForm, setEventForm] = useState({ 
    title: '', location: '', timeDisplay: '', description: '', 
    dateInput: '', badge: 'UPCOMING', color: '#EAB308' 
  });

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    try {
      if (events.length === 0) setLoading(true);
      const [userData, eventData, allClubs] = await Promise.all([
        getUserProfile(),
        getEventFeed(),
        getAllClubs()
      ]);

      const profile = userData.data || userData;
      setUser({ name: profile.name, email: profile.email, following: profile.following || [] });
      setEvents(eventData || []);

      const linkedClub = allClubs.find((c: any) => c.email?.toLowerCase() === profile.email?.toLowerCase());
      setAdminClub(linkedClub);
    } catch (err) {
      console.log("Failed to load home data", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishEvent = async () => {
    const { title, location, description, timeDisplay, dateInput } = eventForm;
    if (!title || !location || !description || !timeDisplay || !dateInput) {
      Alert.alert("Error", "All fields are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createEventApi({
        ...eventForm,
        clubId: adminClub.clubId,
        icon: adminClub.icon || '📅', // Using existing club icon
        date: new Date(dateInput).toISOString(),
      });
      Alert.alert("Success", "Event published!");
      setModalVisible(false);
      loadData();
    } catch (err) { Alert.alert("Error", "Check date format (YYYY-MM-DD)"); }
    finally { setIsSubmitting(false); }
  };

  const sortEventsByFollowing = (eventsList: any[]) => {
    return [...eventsList].sort((a, b) => {
      const aFollowed = user.following.includes(a.clubId);
      const bFollowed = user.following.includes(b.clubId);
      if (aFollowed && !bFollowed) return -1;
      if (!aFollowed && bFollowed) return 1;
      return 0;
    });
  };

  const liveEvents = useMemo(() => sortEventsByFollowing(events.filter((e: any) => e.badge === 'LIVE')), [user.following, events]);
  const upcomingEvents = useMemo(() => sortEventsByFollowing(events.filter((e: any) => e.badge === 'UPCOMING')), [user.following, events]);

  if (loading && events.length === 0) {
    return (
      <View className="flex-1 bg-[#050505] justify-center items-center">
        <ActivityIndicator size="large" color={THEME_ACCENT} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#050505]">
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      <SafeAreaView className="flex-1" style={{ paddingTop: Platform.OS === 'android' ? hp('1%') : 0 }}>
        
        {/* Header */}
        <View style={{ paddingHorizontal: wp('7%'), paddingTop: hp('3%'), paddingBottom: hp('1%'), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: '#737373', fontWeight: 'bold', fontSize: hp('1.5%'), letterSpacing: 3, textTransform: 'uppercase', marginBottom: hp('0.5%') }}>Welcome Back</Text>
            <Text style={{ color: 'white', fontSize: hp('3.7%'), fontWeight: '900', letterSpacing: -1 }}>{user.name.split(' ')[0]}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowSidebar(true)} style={{ width: wp('12%'), height: wp('12%'), backgroundColor: '#121212', borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' }}>
            <Menu color="white" size={hp('2.5%')} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingBottom: hp('5%') }}>
          
          {/* --- NEW CREATE POST BAR (VISIBLE TO ADMINS ONLY) --- */}
          {adminClub && (
            <View style={{ paddingHorizontal: wp('6%'), marginTop: hp('2%'), marginBottom: hp('2%') }}>
               <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => setModalVisible(true)}
                style={{ 
                  backgroundColor: '#121212', borderRadius: 24, padding: wp('4.5%'), 
                  flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: getRgba(THEME_ACCENT, 0.2) 
                }}
               >
                 <View style={{ width: wp('10%'), height: wp('10%'), borderRadius: 12, backgroundColor: getRgba(THEME_ACCENT, 0.1), alignItems: 'center', justifyContent: 'center', marginRight: wp('3.5%') }}>
                    <Plus color={THEME_ACCENT} size={hp('2.2%')} />
                 </View>
                 <Text style={{ color: '#A3A3A3', fontSize: hp('1.8%'), fontWeight: '600' }}>Create a post for {adminClub.name}...</Text>
               </TouchableOpacity>
            </View>
          )}

          {/* Feed Content */}
          <SectionHeader title="Happening Now" icon={PlayCircle} color={THEME_ACCENT} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: wp('6%') }} style={{ marginBottom: hp('5%') }}>
            {liveEvents.map((event: any) => {
              const isFollowed = user.following.includes(event.clubId);
              const cardColor = event.color || THEME_ACCENT; 
              return (
                <TouchableOpacity key={event._id} activeOpacity={0.8} style={{ width: wp('55%'), height: hp('32%'), backgroundColor: '#121212', borderRadius: 32, marginRight: wp('4%'), padding: wp('5%'), justifyContent: 'space-between', overflow: 'hidden', borderWidth: isFollowed ? 1 : 0, borderColor: isFollowed ? getRgba(cardColor, 0.4) : 'transparent' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ paddingHorizontal: wp('3%'), paddingVertical: hp('0.5%'), borderRadius: 999, borderWidth: 1, backgroundColor: getRgba(cardColor, 0.2), borderColor: getRgba(cardColor, 0.3) }}>
                      <Text style={{ fontSize: hp('1.2%'), fontWeight: '900', letterSpacing: 2, color: cardColor }}>LIVE</Text>
                    </View>
                    <Text style={{ fontSize: hp('3.5%') }}>{event.icon}</Text>
                  </View>
                  <View>
                    <Text style={{ color: '#737373', fontSize: hp('1.2%'), fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' }}>{event.clubName}</Text>
                    <Text style={{ color: 'white', fontSize: hp('2.8%'), fontWeight: '900' }} numberOfLines={2}>{event.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: hp('0.5%') }}>
                      <MapPin size={hp('1.5%')} color="#666" />
                      <Text style={{ color: '#A3A3A3', fontSize: hp('1.4%'), marginLeft: wp('1%') }}>{event.location}</Text>
                    </View>
                  </View>
                  <View style={{ width: '100%', height: hp('5%'), borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: cardColor }}>
                    <Text style={{ color: 'black', fontWeight: 'bold', fontSize: hp('1.4%'), textTransform: 'uppercase' }}>Join Now</Text>
                  </View>
                </TouchableOpacity>
            )})}
          </ScrollView>

          <SectionHeader title="Coming Up" icon={Calendar} color="#A0A0A0" />
          <View style={{ paddingHorizontal: wp('6%'), gap: hp('1.5%') }}>
            {upcomingEvents.map((event: any) => {
               const isFollowed = user.following.includes(event.clubId);
               const cardColor = event.color || '#fff';
               const dateObj = new Date(event.date);
               return (
                <TouchableOpacity key={event._id} activeOpacity={0.7} style={{ width: '100%', backgroundColor: '#121212', borderRadius: 24, padding: wp('4%'), flexDirection: 'row', alignItems: 'center', borderWidth: isFollowed ? 1 : 0, borderColor: isFollowed ? getRgba(cardColor, 0.3) : 'transparent' }}>
                  <View style={{ width: wp('16%'), height: wp('16%'), borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: wp('4%'), backgroundColor: isFollowed ? getRgba(cardColor, 0.1) : '#1A1A1A' }}>
                    <Text style={{ fontSize: hp('1.2%'), fontWeight: '900', color: isFollowed ? cardColor : '#737373' }}>{dateObj.toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
                    <Text style={{ color: 'white', fontSize: hp('2.5%'), fontWeight: '900' }}>{dateObj.getDate()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontSize: hp('2%'), fontWeight: 'bold' }}>{event.title}</Text>
                    <Text style={{ color: '#52525B', fontSize: hp('1.4%') }}>{event.timeDisplay} @ {event.location}</Text>
                  </View>
                  <Text style={{ fontSize: hp('2.2%') }}>{event.icon}</Text>
                </TouchableOpacity>
            )})}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* PUBLISH MODAL - FULL REQUIREMENTS */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', padding: 20 }}>
          <ScrollView contentContainerStyle={{ backgroundColor: '#0E0E10', padding: 25, borderRadius: 24, borderWidth: 1, borderColor: '#27272A' }}>
            <Text style={{ color: 'white', fontSize: 22, fontWeight: '900' }}>Post New Event</Text>
            <Text style={{ color: THEME_ACCENT, fontSize: 12, marginBottom: 20 }}>Admin: {adminClub?.name}</Text>
            
            <Label text="Title" /><CustomInput placeholder="Event Name" onChangeText={(t) => setEventForm({...eventForm, title: t})} />
            <Label text="Description" /><CustomInput placeholder="Details..." multiline style={{ height: 60 }} onChangeText={(t) => setEventForm({...eventForm, description: t})} />
            
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Label text="Date (YYYY-MM-DD)" /><CustomInput placeholder="2026-03-01" onChangeText={(t) => setEventForm({...eventForm, dateInput: t})} /></View>
              <View style={{ flex: 1 }}><Label text="Time" /><CustomInput placeholder="6:00 PM" onChangeText={(t) => setEventForm({...eventForm, timeDisplay: t})} /></View>
            </View>
            
            <Label text="Location" /><CustomInput placeholder="Room/Venue" onChangeText={(t) => setEventForm({...eventForm, location: t})} />
            
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
               {['LIVE', 'UPCOMING'].map(b => (
                 <TouchableOpacity key={b} onPress={() => setEventForm({...eventForm, badge: b as any})} style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: eventForm.badge === b ? THEME_ACCENT : '#161618', alignItems: 'center' }}>
                    <Text style={{ color: eventForm.badge === b ? 'black' : 'white', fontWeight: 'bold' }}>{b}</Text>
                 </TouchableOpacity>
               ))}
            </View>

            <TouchableOpacity onPress={handlePublishEvent} disabled={isSubmitting} style={{ backgroundColor: THEME_ACCENT, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 25 }}>
              {isSubmitting ? <ActivityIndicator color="black" /> : <Text style={{ color: 'black', fontWeight: '900' }}>PUBLISH EVENT</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 15 }}><Text style={{ color: '#52525B', textAlign: 'center' }}>Cancel</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Original Sidebar Logic */}
      <AnimatePresence>
        {showSidebar && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
            <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowSidebar(false)} />
            </MotiView>
            <MotiView from={{ translateX: wp('100%') }} animate={{ translateX: 0 }} exit={{ translateX: wp('100%') }} transition={{ type: 'timing', duration: 250 }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: wp('82%'), backgroundColor: '#050505', borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
               <SafeAreaView style={{ flex: 1 }}>
                  {/* ... Original Sidebar Content ... */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: wp('6%'), paddingTop: hp('3%') }}>
                    <Text style={{ color: 'white', fontSize: hp('2.8%'), fontWeight: '900' }}>Menu</Text>
                    <TouchableOpacity onPress={() => setShowSidebar(false)}><X color="#fff" size={hp('2.2%')} /></TouchableOpacity>
                  </View>
                  <ScrollView contentContainerStyle={{ padding: wp('6%') }}>
                      <SidebarItem index={1} icon={Grid} label="LHC Heatmap" color="#6366F1" />
                      <SidebarItem index={4} icon={Siren} label="S.O.S Protocol" color="#F87171" isAlert={true} />
                      <SidebarItem index={7} icon={Settings} label="Settings" color="#A1A1AA" />
                  </ScrollView>
                  <TouchableOpacity onPress={() => router.replace('/')} style={{ margin: wp('6%'), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: hp('2%'), borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <LogOut color="#EF4444" size={hp('2%')} /><Text style={{ color: '#EF4444', fontWeight: '700', marginLeft: 10 }}>LOG OUT</Text>
                  </TouchableOpacity>
               </SafeAreaView>
            </MotiView>
          </View>
        )}
      </AnimatePresence>
    </View>
  );
}

const Label = ({ text }: { text: string }) => <Text style={{ color: THEME_ACCENT, fontSize: 10, fontWeight: 'bold', marginTop: 15 }}>{text.toUpperCase()}</Text>;
const CustomInput = (props: TextInputProps) => <TextInput {...props} placeholderTextColor="#52525B" style={[{ backgroundColor: '#161618', color: 'white', padding: 12, borderRadius: 10, marginTop: 5, borderWidth: 1, borderColor: '#222' }, props.style]} />;