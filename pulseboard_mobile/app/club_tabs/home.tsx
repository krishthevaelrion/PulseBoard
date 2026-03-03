import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    SafeAreaView, StatusBar, ActivityIndicator, Platform, StyleSheet,
    Modal, TextInput, TextInputProps, Alert
} from 'react-native';
import {
    Menu, Calendar, PlayCircle, MapPin, LogOut,
    X, Grid, Siren, Settings, ChevronRight, Plus, ChevronLeft
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { getEventFeed, createEventApi } from '../../src/api/event.api';
import { getUserProfile } from '../../src/api/user.api';
import { getAllClubs } from '../../src/api/club.api';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { MotiView, AnimatePresence } from 'moti';
import { Easing } from 'react-native-reanimated';


const THEME_ACCENT = '#CCF900';

// Utility for RGBA conversion
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

export default function ClubHomeScreen() {
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
        badge: 'UPCOMING', color: '#EAB308'
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [eventDate, setEventDate] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [eventTime, setEventTime] = useState(new Date());

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
        const { title, location, description, timeDisplay } = eventForm;
        if (!title || !location || !description || !timeDisplay) {
            Alert.alert("Error", "All fields are required.");
            return;
        }
        setIsSubmitting(true);
        try {
            await createEventApi({
                ...eventForm,
                clubId: adminClub?.clubId || 1, // Fallback if no club is fully linked yet
                icon: adminClub?.icon || '📅',
                date: eventDate.toISOString(),
            });
            Alert.alert("Success", "Event published!");
            setModalVisible(false);
            loadData();
        } catch (err) { Alert.alert("Error", "Failed to publish event"); }
        finally { setIsSubmitting(false); }
    };

    // On the club portal side, arguably all events can just sort chronologically, or same as user side
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
            <View style={{ flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={THEME_ACCENT} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#050505' }}>
            <StatusBar barStyle="light-content" backgroundColor="#050505" />
            <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? hp('1%') : 0 }}>

                {/* Header */}
                <View style={{ paddingHorizontal: wp('7%'), paddingTop: hp('3%'), paddingBottom: hp('1%'), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                        <Text style={{ color: '#737373', fontWeight: 'bold', fontSize: hp('1.5%'), letterSpacing: 3, textTransform: 'uppercase', marginBottom: hp('0.5%') }}>Club Portal</Text>
                        <Text style={{ color: 'white', fontSize: hp('3.7%'), fontWeight: '900', letterSpacing: -1 }}>{adminClub ? adminClub.name : 'Your Club'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowSidebar(true)} style={{ width: wp('12%'), height: wp('12%'), backgroundColor: '#121212', borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' }}>
                        <Menu color="white" size={hp('2.5%')} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: hp('5%') }}>

                    {/* Feed Content */}
                    <SectionHeader title="Happening Now" icon={PlayCircle} color={THEME_ACCENT} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: wp('6%') }} style={{ marginBottom: hp('5%') }}>
                        {liveEvents.map((event: any) => {
                            const isFollowed = user.following.includes(event.clubId);
                            const cardColor = event.color || THEME_ACCENT;
                            return (
                                <TouchableOpacity key={event._id} activeOpacity={0.8} style={{ width: wp('55%'), backgroundColor: '#121212', borderRadius: 32, marginRight: wp('4%'), padding: wp('5%'), overflow: 'hidden', borderWidth: isFollowed ? 1 : 0, borderColor: isFollowed ? getRgba(cardColor, 0.4) : 'transparent' }}>
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
                                        <Text style={{ color: THEME_ACCENT, fontSize: hp('1.4%'), fontWeight: 'bold' }}>{event.clubName}</Text>
                                        <Text style={{ color: '#52525B', fontSize: hp('1.4%') }}>{event.timeDisplay} @ {event.location}</Text>
                                    </View>
                                    <Text style={{ fontSize: hp('2.2%') }}>{event.icon}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Floating Action Button for POST - integrated into home instead of _layout since home handles the modal state */}
            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.8}
                onPress={() => setModalVisible(true)}
            >
                <Plus color="#000" size={hp('3.5%')} strokeWidth={3} />
            </TouchableOpacity>

            {/* PUBLISH MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', padding: wp('3%') }}>
                    <ScrollView contentContainerStyle={{ backgroundColor: '#0E0E10', padding: wp('6%'), borderRadius: 24, borderWidth: 1, borderColor: '#27272A', width: '100%' }}>
                        <Text style={{ color: 'white', fontSize: hp('2.8%'), fontWeight: '900' }}>Post New Event</Text>
                        <Text style={{ color: THEME_ACCENT, fontSize: hp('1.4%'), marginBottom: hp('2%') }}>Admin: {adminClub?.name || 'Your Club'}</Text>

                        <Label text="Title" /><CustomInput placeholder="Event Name" onChangeText={(t) => setEventForm({ ...eventForm, title: t })} />
                        <Label text="Description" />
                        <CustomInput
                            placeholder="Details..."
                            multiline
                            style={{ minHeight: hp('15%'), textAlignVertical: 'top' }}
                            onChangeText={(t) => setEventForm({ ...eventForm, description: t })}
                        />

                        <View style={{ flexDirection: 'row', gap: wp('2.5%') }}>
                            <View style={{ flex: 1 }}>
                                <Label text="Date (DD-MM-YYYY)" />
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => setShowDatePicker(true)}
                                    style={{ backgroundColor: '#161618', padding: hp('1.5%'), borderRadius: 10, marginTop: hp('0.5%'), borderWidth: 1, borderColor: '#222', justifyContent: 'center' }}
                                >
                                    <Text style={{ color: 'white' }}>
                                        {eventDate.getDate().toString().padStart(2, '0')}-{(eventDate.getMonth() + 1).toString().padStart(2, '0')}-{eventDate.getFullYear()}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Label text="Time" />
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => setShowTimePicker(true)}
                                    style={{ backgroundColor: '#161618', padding: hp('1.5%'), borderRadius: 10, marginTop: hp('0.5%'), borderWidth: 1, borderColor: '#222', justifyContent: 'center' }}
                                >
                                    <Text style={{ color: eventForm.timeDisplay ? 'white' : '#52525B' }}>
                                        {eventForm.timeDisplay || "6:00 PM"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <CustomDatePickerModal
                            visible={showDatePicker}
                            date={eventDate}
                            onCancel={() => setShowDatePicker(false)}
                            onConfirm={(selectedDate: any) => {
                                setShowDatePicker(false);
                                if (selectedDate) setEventDate(selectedDate);
                            }}
                        />

                        <CustomTimePickerModal
                            visible={showTimePicker}
                            time={eventTime}
                            onCancel={() => setShowTimePicker(false)}
                            onConfirm={(selectedDate: any) => {
                                setShowTimePicker(false);
                                if (selectedDate) {
                                    setEventTime(selectedDate);
                                    const hours = selectedDate.getHours();
                                    const minutes = selectedDate.getMinutes();
                                    const ampm = hours >= 12 ? 'PM' : 'AM';
                                    const displayHours = hours % 12 || 12;
                                    const displayMinutes = minutes.toString().padStart(2, '0');
                                    setEventForm({ ...eventForm, timeDisplay: `${displayHours}:${displayMinutes} ${ampm}` });
                                }
                            }}
                        />

                        <Label text="Location" /><CustomInput placeholder="Room/Venue" onChangeText={(t) => setEventForm({ ...eventForm, location: t })} />

                        <TouchableOpacity onPress={handlePublishEvent} disabled={isSubmitting} style={{ backgroundColor: THEME_ACCENT, padding: hp('2%'), borderRadius: 15, alignItems: 'center', marginTop: hp('3%') }}>
                            {isSubmitting ? <ActivityIndicator color="black" /> : <Text style={{ color: 'black', fontWeight: '900' }}>PUBLISH EVENT</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: hp('2%') }}>
                            <Text style={{ color: '#52525B', textAlign: 'center', fontWeight: 'bold' }}>Cancel</Text>
                        </TouchableOpacity>
                    </ScrollView>
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

const Label = ({ text }: { text: string }) => <Text style={{ color: THEME_ACCENT, fontSize: 10, fontWeight: 'bold', marginTop: hp('2%') }}>{text.toUpperCase()}</Text>;
const CustomInput = (props: TextInputProps) => <TextInput {...props} placeholderTextColor="#52525B" style={[{ backgroundColor: '#161618', color: 'white', padding: hp('1.5%'), borderRadius: 10, marginTop: hp('0.5%'), borderWidth: 1, borderColor: '#222' }, props.style]} />;

const CustomDatePickerModal = ({ visible, date, onConfirm, onCancel }: any) => {
    const [currentMonth, setCurrentMonth] = useState(date || new Date());
    const [selectedDate, setSelectedDate] = useState(date || new Date());

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const changeMonth = (delta: number) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + delta);
        setCurrentMonth(newMonth);
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: wp('5%') }}>
                <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '100%', backgroundColor: '#121212', borderRadius: 24, padding: wp('6%'), borderWidth: 1, borderColor: '#27272A' }}>
                    <Text style={{ color: 'white', fontSize: hp('2.2%'), fontWeight: 'bold', marginBottom: hp('2%') }}>Select Date</Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp('2%') }}>
                        <TouchableOpacity onPress={() => changeMonth(-1)} style={{ padding: 5 }}><ChevronLeft color="white" size={hp('2.5%')} /></TouchableOpacity>
                        <Text style={{ color: 'white', fontSize: hp('2%'), fontWeight: 'bold' }}>
                            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </Text>
                        <TouchableOpacity onPress={() => changeMonth(1)} style={{ padding: 5 }}><ChevronRight color="white" size={hp('2.5%')} /></TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <View key={d} style={{ width: '14.28%', alignItems: 'center', marginBottom: hp('1%') }}>
                                <Text style={{ color: '#737373', fontSize: hp('1.4%'), fontWeight: 'bold' }}>{d}</Text>
                            </View>
                        ))}
                        {Array.from({ length: firstDay }).map((_, i) => <View key={`empty-${i}`} style={{ width: '14.28%' }} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear();
                            return (
                                <TouchableOpacity
                                    key={`day-${day}`}
                                    onPress={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                                    style={{
                                        width: '14.28%', alignItems: 'center', justifyContent: 'center', height: wp('10%'),
                                        backgroundColor: isSelected ? THEME_ACCENT : 'transparent', borderRadius: 99
                                    }}
                                >
                                    <Text style={{ color: isSelected ? 'black' : 'white', fontWeight: isSelected ? 'bold' : 'normal', fontSize: hp('1.6%') }}>{day}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: hp('3%'), gap: wp('4%') }}>
                        <TouchableOpacity onPress={onCancel} style={{ paddingVertical: hp('1%'), paddingHorizontal: wp('4%') }}><Text style={{ color: '#A1A1AA', fontWeight: 'bold' }}>Cancel</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => onConfirm(selectedDate)} style={{ paddingVertical: hp('1%'), paddingHorizontal: wp('5%'), backgroundColor: THEME_ACCENT, borderRadius: 12 }}><Text style={{ color: 'black', fontWeight: 'bold' }}>Confirm</Text></TouchableOpacity>
                    </View>
                </MotiView>
            </View>
        </Modal>
    );
};

const CustomTimePickerModal = ({ visible, time, onConfirm, onCancel }: any) => {
    const defaultHour = time ? (time.getHours() % 12 || 12) : 6;
    const defaultMinute = time ? time.getMinutes() : 0;
    const defaultAm = time ? time.getHours() < 12 : false;

    const [selectedHour, setSelectedHour] = useState(defaultHour);
    const [selectedMinute, setSelectedMinute] = useState(defaultMinute);
    const [isAm, setIsAm] = useState(defaultAm);

    const ITEM_HEIGHT = hp('6%');

    const handleConfirm = () => {
        const newTime = new Date();
        newTime.setHours(isAm ? (selectedHour === 12 ? 0 : selectedHour) : (selectedHour === 12 ? 12 : selectedHour + 12));
        newTime.setMinutes(selectedMinute);
        onConfirm(newTime);
    };

    if (!visible) return null;

    const hours = Array.from({ length: 12 }).map((_, i) => i + 1);
    const minutes = Array.from({ length: 60 }).map((_, i) => i);
    const periods = ['AM', 'PM'];

    const renderScrollList = (data: any[], selectedValue: any, onSelect: (val: any) => void, padZero: boolean = true) => (
        <View style={{ height: ITEM_HEIGHT * 3, width: wp('22%'), overflow: 'hidden' }}>
            <View style={{ position: 'absolute', top: ITEM_HEIGHT, width: '100%', height: ITEM_HEIGHT, borderTopWidth: 2, borderBottomWidth: 2, borderColor: THEME_ACCENT }} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                    if (data[index] !== undefined) onSelect(data[index]);
                }}
                contentOffset={{ x: 0, y: Math.max(0, data.indexOf(selectedValue)) * ITEM_HEIGHT }}
            >
                {data.map((item, idx) => {
                    const isSelected = item === selectedValue;
                    return (
                        <View key={idx} style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{
                                color: isSelected ? 'white' : '#52525B',
                                fontSize: isSelected ? hp('3%') : hp('2.2%'),
                                fontWeight: isSelected ? '900' : 'bold'
                            }}>
                                {typeof item === 'number' && padZero ? item.toString().padStart(2, '0') : item}
                            </Text>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: wp('5%') }}>
                <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '100%', backgroundColor: '#121212', borderRadius: 24, padding: wp('6%'), borderWidth: 1, borderColor: '#27272A' }}>
                    <Text style={{ color: 'white', fontSize: hp('2.2%'), fontWeight: 'bold', marginBottom: hp('3%') }}>Set Time</Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                        {renderScrollList(hours, selectedHour, setSelectedHour)}

                        <Text style={{ color: 'white', fontSize: hp('4%'), fontWeight: 'bold', marginHorizontal: wp('2%') }}>:</Text>

                        {renderScrollList(minutes, selectedMinute, setSelectedMinute)}

                        <View style={{ width: wp('4%') }} />

                        {renderScrollList(periods, isAm ? 'AM' : 'PM', (val) => setIsAm(val === 'AM'), false)}
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: hp('5%'), gap: wp('4%') }}>
                        <TouchableOpacity onPress={onCancel} style={{ paddingVertical: hp('1%'), paddingHorizontal: wp('4%') }}><Text style={{ color: '#A1A1AA', fontWeight: 'bold' }}>Cancel</Text></TouchableOpacity>
                        <TouchableOpacity onPress={handleConfirm} style={{ paddingVertical: hp('1%'), paddingHorizontal: wp('5%'), backgroundColor: THEME_ACCENT, borderRadius: 12 }}><Text style={{ color: 'black', fontWeight: 'bold' }}>OK</Text></TouchableOpacity>
                    </View>
                </MotiView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: hp('1%'),
        right: wp('3.5%'),
        backgroundColor: THEME_ACCENT,
        width: hp('7.5%'),
        height: hp('7.5%'),
        borderRadius: hp('3.75%'),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: THEME_ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 2,
        borderColor: '#050505',
        zIndex: 40 // above list below sidebar
    }
});
