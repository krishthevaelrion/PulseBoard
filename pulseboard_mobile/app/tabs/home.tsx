import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, Platform, StyleSheet,
  Modal, TextInput, TextInputProps, Alert, Image
} from 'react-native';
import {
  Menu, Calendar, PlayCircle, MapPin, LogOut,
  X, Grid, Siren, Settings, ChevronRight, Plus, RefreshCw,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { getEventFeed, createEventApi, getPersonalEvents } from '../../src/api/event.api';
import { getUserProfile } from '../../src/api/user.api';
import { getAllClubs } from '../../src/api/club.api';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { MotiView, AnimatePresence } from 'moti';
import { Easing } from 'react-native-reanimated';

const THEME_ACCENT = '#CCF900';

const getRgba = (hex: string, opacity: number) => {
  if (!hex) return `rgba(255, 255, 255, ${opacity})`;
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
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [interviewEvents, setInterviewEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>({ name: "Loading...", following: [] });

  // --- SMART INBOX STATES ---
  const [categories, setCategories] = useState<any[]>([]);
  const [activeMailCategory, setActiveMailCategory] = useState<number | null>(null);
  const [mails, setMails] = useState<any[]>([]);
  const [loadingMails, setLoadingMails] = useState(false);

  // --- EVENT DETAILS STATE ---
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const openEventModal = (event: any) => {
    setSelectedEvent(event);
    setEventModalVisible(true);
  };

  const closeEventModal = () => {
    setEventModalVisible(false);
    setSelectedEvent(null);
  };

  // --- ADMIN LOGIC ---
  const [adminClub, setAdminClub] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '', location: '', timeDisplay: '', description: '',
    dateInput: '', badge: 'UPCOMING', color: '#EAB308'
  });

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadData = async () => {
    try {
      if (events.length === 0) setLoading(true);
      const [userData, eventData, allClubs, personalData] = await Promise.all([
        getUserProfile(),
        getEventFeed(),
        getAllClubs(),
        getPersonalEvents(),
      ]);

      const profile = userData.data || userData;
      setUser({ name: profile.name, email: profile.email, following: profile.following || [] });
      setEvents(eventData || []);
      setInterviewEvents((personalData || []).filter((e: any) => e.category === 'interviews'));

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
      const formData = new FormData();
      formData.append('title', eventForm.title);
      formData.append('location', eventForm.location);
      formData.append('description', eventForm.description);
      formData.append('timeDisplay', eventForm.timeDisplay);
      formData.append('date', new Date(dateInput).toISOString());
      formData.append('badge', eventForm.badge);
      formData.append('color', eventForm.color);
      formData.append('clubId', String(adminClub.clubId));
      formData.append('icon', adminClub.icon || '📅');

      await createEventApi(formData);
      Alert.alert("Success", "Event published!");
      setModalVisible(false);
      loadData();
    } catch (err) { Alert.alert("Error", "Check date format (YYYY-MM-DD)"); }
    finally { setIsSubmitting(false); }
  };

  const liveEvents = useMemo(() =>
    events.filter((e: any) => e.badge === 'LIVE' && user.following.includes(e.clubId)),
    [user.following, events]
  );
  const upcomingEvents = useMemo(() => {
    const clubEvents = events.filter((e: any) => e.badge === 'UPCOMING' && user.following.includes(e.clubId));
    const interviews = interviewEvents.filter((e: any) => e.category === 'interviews');
    return [...clubEvents, ...interviews].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [user.following, events, interviewEvents]);

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

          {/* Happening Now */}
          <SectionHeader title="Happening Now" icon={PlayCircle} color={THEME_ACCENT} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: wp('6%') }} style={{ marginBottom: hp('5%') }}>
            {liveEvents.length === 0 ? (
              <View style={{ width: wp('88%'), backgroundColor: '#0F0F0F', borderRadius: 24, padding: wp('6%'), alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1A1A1A', minHeight: hp('16%') }}>
                <Text style={{ fontSize: hp('3%'), marginBottom: hp('1%') }}>⚡</Text>
                <Text style={{ color: '#52525B', fontSize: hp('1.6%'), fontWeight: '600', textAlign: 'center' }}>No live events right now</Text>
                <Text style={{ color: '#333', fontSize: hp('1.4%'), textAlign: 'center', marginTop: hp('0.5%') }}>Follow clubs to see their events here</Text>
              </View>
            ) : liveEvents.map((event: any) => {
              const isFollowed = true;
              const cardColor = event.color || THEME_ACCENT;
              return (
                <TouchableOpacity key={event._id} onPress={() => openEventModal(event)} activeOpacity={0.8} style={{ width: wp('55%'), backgroundColor: '#121212', borderRadius: 32, marginRight: wp('4%'), padding: wp('5%'), overflow: 'hidden', borderWidth: isFollowed ? 1 : 0, borderColor: isFollowed ? getRgba(cardColor, 0.4) : 'transparent' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: hp('2%') }}>
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
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {/* Coming Up */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: wp('6%'), marginBottom: hp('2.5%'), marginTop: hp('1%') }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp('3%') }}>
              <Calendar color="#A0A0A0" size={hp('2.5%')} />
              <Text style={{ color: 'white', fontSize: hp('2%'), fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>Coming Up</Text>
            </View>
            <TouchableOpacity onPress={handleRefresh} style={{ padding: wp('2%') }}>
              <RefreshCw color={refreshing ? THEME_ACCENT : '#555'} size={hp('2.2%')} />
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: wp('6%'), gap: hp('1.5%'), marginBottom: hp('4%') }}>
            {upcomingEvents.length === 0 ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/tabs/clubs')}
                style={{ backgroundColor: '#0F0F0F', borderRadius: 20, padding: wp('6%'), alignItems: 'center', borderWidth: 1, borderColor: '#1A1A1A' }}
              >
                <Text style={{ fontSize: hp('3.5%'), marginBottom: hp('1.5%') }}>🏛️</Text>
                <Text style={{ color: 'white', fontSize: hp('1.9%'), fontWeight: '800', textAlign: 'center' }}>No upcoming events</Text>
                <Text style={{ color: '#52525B', fontSize: hp('1.5%'), textAlign: 'center', marginTop: hp('0.5%'), lineHeight: hp('2.2%') }}>
                  Follow clubs to see their events here
                </Text>
                <View style={{ marginTop: hp('2%'), backgroundColor: THEME_ACCENT, paddingHorizontal: wp('6%'), paddingVertical: hp('1.2%'), borderRadius: 999 }}>
                  <Text style={{ color: '#000', fontWeight: '900', fontSize: hp('1.5%'), letterSpacing: 1 }}>BROWSE CLUBS →</Text>
                </View>
              </TouchableOpacity>
            ) : upcomingEvents.map((event: any) => {
              const isFollowed = true;
              const cardColor = event.color || '#fff';
              const dateObj = new Date(event.date);
              return (
                <TouchableOpacity key={event._id} onPress={() => openEventModal(event)} activeOpacity={0.7} style={{ width: '100%', backgroundColor: '#121212', borderRadius: 24, padding: wp('4%'), flexDirection: 'row', alignItems: 'center', borderWidth: isFollowed ? 1 : 0, borderColor: isFollowed ? getRgba(cardColor, 0.3) : 'transparent' }}>
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
              )
            })}
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* PUBLISH MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', padding: wp('5%') }}>
          <ScrollView contentContainerStyle={{ backgroundColor: '#0E0E10', padding: wp('6%'), borderRadius: 24, borderWidth: 1, borderColor: '#27272A' }}>
            <Text style={{ color: 'white', fontSize: hp('2.8%'), fontWeight: '900' }}>Post New Event</Text>
            <Text style={{ color: THEME_ACCENT, fontSize: hp('1.4%'), marginBottom: hp('2%') }}>Admin: {adminClub?.name}</Text>
            <Label text="Title" /><CustomInput placeholder="Event Name" onChangeText={(t) => setEventForm({ ...eventForm, title: t })} />
            <Label text="Description" /><CustomInput placeholder="Details..." multiline style={{ height: hp('8%') }} onChangeText={(t) => setEventForm({ ...eventForm, description: t })} />
            <View style={{ flexDirection: 'row', gap: wp('2.5%') }}>
              <View style={{ flex: 1 }}><Label text="Date (YYYY-MM-DD)" /><CustomInput placeholder="2026-03-01" onChangeText={(t) => setEventForm({ ...eventForm, dateInput: t })} /></View>
              <View style={{ flex: 1 }}><Label text="Time" /><CustomInput placeholder="6:00 PM" onChangeText={(t) => setEventForm({ ...eventForm, timeDisplay: t })} /></View>
            </View>
            <Label text="Location" /><CustomInput placeholder="Room/Venue" onChangeText={(t) => setEventForm({ ...eventForm, location: t })} />
            <View style={{ flexDirection: 'row', gap: wp('2.5%'), marginTop: hp('2%') }}>
              {['LIVE', 'UPCOMING'].map(b => (
                <TouchableOpacity key={b} onPress={() => setEventForm({ ...eventForm, badge: b as any })} style={{ flex: 1, padding: hp('1.5%'), borderRadius: 12, backgroundColor: eventForm.badge === b ? THEME_ACCENT : '#161618', alignItems: 'center' }}>
                  <Text style={{ color: eventForm.badge === b ? 'black' : 'white', fontWeight: 'bold' }}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={handlePublishEvent} disabled={isSubmitting} style={{ backgroundColor: THEME_ACCENT, padding: hp('2%'), borderRadius: 15, alignItems: 'center', marginTop: hp('3%') }}>
              {isSubmitting ? <ActivityIndicator color="black" /> : <Text style={{ color: 'black', fontWeight: '900' }}>PUBLISH EVENT</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: hp('2%') }}><Text style={{ color: '#52525B', textAlign: 'center', fontWeight: 'bold' }}>Cancel</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Event Details Modal */}
      <Modal
        visible={eventModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEventModal}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: '#0D0D0D',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderWidth: 1,
            borderColor: '#1E1E1E',
            maxHeight: hp('85%'),
          }}>
            {selectedEvent && (
              <>
                <View style={{ height: 4, backgroundColor: selectedEvent.color || THEME_ACCENT, borderTopLeftRadius: 24, borderTopRightRadius: 24 }} />

                <ScrollView contentContainerStyle={{ padding: wp('6%') }} showsVerticalScrollIndicator={false}>
                  {/* Close */}
                  <TouchableOpacity
                    onPress={closeEventModal}
                    style={{ alignSelf: 'flex-end', width: wp('8%'), height: wp('8%'), backgroundColor: '#1A1A1A', borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginBottom: hp('1.5%') }}
                  >
                    <X color="#666" size={hp('2%')} />
                  </TouchableOpacity>

                  {/* Image */}
                  {selectedEvent.imageUrl ? (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => setFullScreenImage(selectedEvent.imageUrl)}>
                      <Image 
                        source={{ uri: selectedEvent.imageUrl }}
                        style={{ width: '100%', height: hp('20%'), borderRadius: 16, marginBottom: hp('2%') }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : null}

                  {/* Icon + Title */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: wp('3%'), marginBottom: hp('2%') }}>
                    {!selectedEvent.imageUrl ? <Text style={{ fontSize: hp('5%') }}>{selectedEvent.icon}</Text> : null}
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: THEME_ACCENT, fontSize: hp('1.4%'), fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: hp('0.5%') }}>{selectedEvent.clubName}</Text>
                      <Text style={{ color: '#fff', fontWeight: '900', fontSize: hp('2.5%'), lineHeight: hp('3.2%') }}>
                        {selectedEvent.title}
                      </Text>
                      {selectedEvent.badge === 'LIVE' && (
                        <View style={{ backgroundColor: 'rgba(239,68,68,0.15)', alignSelf: 'flex-start', paddingHorizontal: wp('2.5%'), paddingVertical: 4, borderRadius: 6, marginTop: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' }}>
                          <Text style={{ color: '#EF4444', fontSize: hp('1.3%'), fontWeight: '900', letterSpacing: 1 }}>● LIVE NOW</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {selectedEvent.description ? (
                    <Text style={{ color: '#999', fontSize: hp('1.7%'), lineHeight: hp('2.6%'), marginBottom: hp('2.5%') }}>
                      {selectedEvent.description}
                    </Text>
                  ) : null}

                  <View style={{ height: 1, backgroundColor: '#1E1E1E', marginBottom: hp('2.5%') }} />

                  {/* Date */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp('3%'), marginBottom: hp('2%') }}>
                    <View style={{ width: wp('9%'), height: wp('9%'), borderRadius: 12, backgroundColor: '#161616', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={hp('2%')} color={selectedEvent.color || THEME_ACCENT} />
                    </View>
                    <View>
                      <Text style={{ color: '#555', fontSize: hp('1.2%'), marginBottom: 2 }}>DATE & TIME</Text>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: hp('1.8%') }}>
                        {new Date(selectedEvent.date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                      </Text>
                      <Text style={{ color: selectedEvent.color || THEME_ACCENT, fontSize: hp('1.5%'), marginTop: 2 }}>
                        {selectedEvent.timeDisplay}
                      </Text>
                    </View>
                  </View>

                  {/* Location */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp('3%') }}>
                    <View style={{ width: wp('9%'), height: wp('9%'), borderRadius: 12, backgroundColor: '#161616', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={hp('2%')} color={selectedEvent.color || THEME_ACCENT} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#555', fontSize: hp('1.2%'), marginBottom: 2 }}>LOCATION</Text>
                      <Text style={{ color: selectedEvent.location && selectedEvent.location !== 'TBD' ? '#fff' : '#444', fontWeight: '600', fontSize: hp('1.8%') }}>
                        {selectedEvent.location || 'TBD'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ height: hp('3%') }} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Full Screen Image Modal */}
      <Modal visible={!!fullScreenImage} transparent={true} animationType="fade" onRequestClose={() => setFullScreenImage(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
              <TouchableOpacity style={{ position: 'absolute', top: hp('5%'), right: wp('5%'), zIndex: 10, padding: wp('3%') }} onPress={() => setFullScreenImage(null)}>
                  <X color="white" size={hp('3.5%')} />
              </TouchableOpacity>
              {fullScreenImage && (
                  <Image 
                      source={{ uri: fullScreenImage }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="contain"
                  />
              )}
          </View>
      </Modal>

      {/* Sidebar Logic */}
      <AnimatePresence>
        {showSidebar && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
            <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowSidebar(false)} />
            </MotiView>
            <MotiView from={{ translateX: wp('100%') }} animate={{ translateX: 0 }} exit={{ translateX: wp('100%') }} transition={{ type: 'timing', duration: 250 }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: wp('82%'), backgroundColor: '#050505', borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <SafeAreaView style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: wp('6%'), paddingTop: hp('3%') }}>
                  <Text style={{ color: 'white', fontSize: hp('2.8%'), fontWeight: '900' }}>Menu</Text>
                  <TouchableOpacity onPress={() => setShowSidebar(false)}><X color="#fff" size={hp('2.2%')} /></TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ padding: wp('6%') }}>
                  {adminClub && (
                    <SidebarItem index={0} icon={Plus} label="Publish Event" color={THEME_ACCENT} onPress={() => { setShowSidebar(false); setModalVisible(true); }} />
                  )}
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

const Label = ({ text }: { text: string }) => <Text style={{ color: THEME_ACCENT, fontSize: hp('1.2%'), fontWeight: 'bold', marginTop: hp('2%') }}>{text.toUpperCase()}</Text>;
const CustomInput = (props: TextInputProps) => <TextInput {...props} placeholderTextColor="#52525B" style={[{ backgroundColor: '#161618', color: 'white', padding: hp('1.5%'), borderRadius: 10, marginTop: hp('0.5%'), borderWidth: 1, borderColor: '#222' }, props.style]} />;