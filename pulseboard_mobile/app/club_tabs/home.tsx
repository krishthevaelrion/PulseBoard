import React, { useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StatusBar, ActivityIndicator, Platform,
    Modal, TextInput, TextInputProps, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    MapPin, LogOut, X, Plus, Mail, ChevronLeft, ChevronRight
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { createEventApi, fetchEventsByClub } from '../../src/api/event.api';
import { getUserProfile } from '../../src/api/user.api';
import { getAllClubs } from '../../src/api/club.api';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { MotiView } from 'moti';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_ACCENT = '#CCF900';

export default function ClubHomeScreen() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [adminClub, setAdminClub] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [emailModalVisible, setEmailModalVisible] = useState(false);
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
            setLoading(true);
            const [userData, allClubs] = await Promise.all([
                getUserProfile(),
                getAllClubs()
            ]);
            const profile = userData.data || userData;
            const linkedClub = allClubs.find((c: any) => c.email?.toLowerCase() === profile.email?.toLowerCase());
            setAdminClub(linkedClub);

            if (linkedClub?.clubId) {
                const clubEvents = await fetchEventsByClub(linkedClub.clubId);
                setEvents(clubEvents || []);
            }
        } catch (err) {
            console.log('Failed to load club data', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePublishEvent = async () => {
        const { title, location, description, timeDisplay } = eventForm;
        if (!title || !location || !description || !timeDisplay) {
            Alert.alert('Error', 'All fields are required.');
            return;
        }
        setIsSubmitting(true);
        try {
            await createEventApi({
                ...eventForm,
                clubId: adminClub?.clubId || 1,
                icon: adminClub?.icon || '📅',
                date: eventDate.toISOString(),
            });
            Alert.alert('Success', 'Event published!');
            setModalVisible(false);
            setEventForm({ title: '', location: '', timeDisplay: '', description: '', badge: 'UPCOMING', color: '#EAB308' });
            loadData();
        } catch (err) {
            Alert.alert('Error', 'Failed to publish event');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        router.replace('/');
    };

    if (loading) {
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
                <View style={{ paddingHorizontal: wp('7%'), paddingTop: hp('3%'), paddingBottom: hp('2%'), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                        <Text style={{ color: '#737373', fontWeight: 'bold', fontSize: hp('1.4%'), letterSpacing: 3, textTransform: 'uppercase', marginBottom: hp('0.4%') }}>Club Portal</Text>
                        <Text style={{ color: 'white', fontSize: hp('3.5%'), fontWeight: '900', letterSpacing: -1 }}>
                            {adminClub ? adminClub.name : 'Your Club'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={{ width: wp('11%'), height: wp('11%'), backgroundColor: '#121212', borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' }}
                    >
                        <LogOut color="#EF4444" size={hp('2.2%')} />
                    </TouchableOpacity>
                </View>

                {/* Publish Event Button */}
                <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400 }}
                    style={{ marginHorizontal: wp('7%'), marginBottom: hp('3%') }}
                >
                    <TouchableOpacity
                        onPress={() => setModalVisible(true)}
                        activeOpacity={0.85}
                        style={{
                            backgroundColor: THEME_ACCENT,
                            borderRadius: 20,
                            paddingVertical: hp('2.2%'),
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: wp('3%'),
                            shadowColor: THEME_ACCENT,
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.35,
                            shadowRadius: 14,
                            elevation: 8,
                        }}
                    >
                        <Plus color="#000" size={hp('2.8%')} strokeWidth={3} />
                        <Text style={{ color: '#000', fontSize: hp('2%'), fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' }}>Publish Event</Text>
                    </TouchableOpacity>
                </MotiView>

                {/* Import from Email Button */}
                <TouchableOpacity
                    onPress={() => setEmailModalVisible(true)}
                    activeOpacity={0.7}
                    style={{
                        marginHorizontal: wp('7%'),
                        marginBottom: hp('3.5%'),
                        backgroundColor: '#0F0F0F',
                        borderRadius: 16,
                        paddingVertical: hp('1.8%'),
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: wp('2.5%'),
                        borderWidth: 1,
                        borderColor: 'rgba(204,249,0,0.25)',
                    }}
                >
                    <Mail color={THEME_ACCENT} size={hp('2.2%')} />
                    <Text style={{ color: THEME_ACCENT, fontSize: hp('1.7%'), fontWeight: '700' }}>Import from Email</Text>
                </TouchableOpacity>

                {/* Your Events Section */}
                <View style={{ paddingHorizontal: wp('7%'), marginBottom: hp('1.5%') }}>
                    <Text style={{ color: 'white', fontSize: hp('2%'), fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>
                        Your Events
                    </Text>
                    <Text style={{ color: '#52525B', fontSize: hp('1.5%'), marginTop: hp('0.3%') }}>
                        {events.length} active event{events.length !== 1 ? 's' : ''}
                    </Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: wp('7%'), paddingBottom: hp('5%'), gap: hp('1.5%') }}>
                    {events.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingTop: hp('8%') }}>
                            <Text style={{ fontSize: hp('4%') }}>📅</Text>
                            <Text style={{ color: '#52525B', fontSize: hp('1.7%'), marginTop: hp('1.5%'), textAlign: 'center' }}>
                                No events yet.{'\n'}Tap Publish Event to create one.
                            </Text>
                        </View>
                    ) : (
                        events.map((event: any) => {
                            const dateObj = new Date(event.date);
                            const cardColor = event.color || THEME_ACCENT;
                            return (
                                <MotiView
                                    key={event._id}
                                    from={{ opacity: 0, translateY: 8 }}
                                    animate={{ opacity: 1, translateY: 0 }}
                                    transition={{ type: 'timing', duration: 300 }}
                                    style={{
                                        backgroundColor: '#0F0F0F',
                                        borderRadius: 20,
                                        padding: wp('5%'),
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.07)',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                >
                                    {/* Date block */}
                                    <View style={{
                                        width: wp('14%'), height: wp('14%'), borderRadius: 14,
                                        backgroundColor: `${cardColor}18`,
                                        alignItems: 'center', justifyContent: 'center',
                                        marginRight: wp('4%'), borderWidth: 1,
                                        borderColor: `${cardColor}30`
                                    }}>
                                        <Text style={{ color: cardColor, fontSize: hp('1.2%'), fontWeight: '900' }}>
                                            {dateObj.toLocaleString('default', { month: 'short' }).toUpperCase()}
                                        </Text>
                                        <Text style={{ color: 'white', fontSize: hp('2.5%'), fontWeight: '900' }}>
                                            {dateObj.getDate()}
                                        </Text>
                                    </View>

                                    {/* Info */}
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp('1.5%'), marginBottom: hp('0.3%') }}>
                                            <Text style={{ fontSize: hp('1.8%') }}>{event.icon}</Text>
                                            <View style={{ paddingHorizontal: wp('2%'), paddingVertical: 2, borderRadius: 999, backgroundColor: event.badge === 'LIVE' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: event.badge === 'LIVE' ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.4)' }}>
                                                <Text style={{ color: event.badge === 'LIVE' ? '#10B981' : '#818CF8', fontSize: hp('1.1%'), fontWeight: '900', letterSpacing: 1.5 }}>{event.badge}</Text>
                                            </View>
                                        </View>
                                        <Text style={{ color: 'white', fontSize: hp('1.9%'), fontWeight: 'bold' }} numberOfLines={1}>{event.title}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: hp('0.3%'), gap: wp('1%') }}>
                                            <MapPin size={hp('1.4%')} color="#52525B" />
                                            <Text style={{ color: '#52525B', fontSize: hp('1.4%') }}>{event.location} · {event.timeDisplay}</Text>
                                        </View>
                                    </View>
                                </MotiView>
                            );
                        })
                    )}
                </ScrollView>
            </SafeAreaView>

            {/* PUBLISH MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', padding: wp('3%') }}>
                    <ScrollView contentContainerStyle={{ backgroundColor: '#0E0E10', padding: wp('6%'), borderRadius: 24, borderWidth: 1, borderColor: '#27272A', width: '100%' }}>
                        <Text style={{ color: 'white', fontSize: hp('2.8%'), fontWeight: '900' }}>Post New Event</Text>
                        <Text style={{ color: THEME_ACCENT, fontSize: hp('1.4%'), marginBottom: hp('2%') }}>Club: {adminClub?.name || 'Your Club'}</Text>

                        <Label text="Title" />
                        <CustomInput placeholder="Event Name" onChangeText={(t) => setEventForm({ ...eventForm, title: t })} value={eventForm.title} />
                        <Label text="Description" />
                        <CustomInput
                            placeholder="Details..."
                            multiline
                            style={{ minHeight: hp('15%'), textAlignVertical: 'top' }}
                            onChangeText={(t) => setEventForm({ ...eventForm, description: t })}
                            value={eventForm.description}
                        />

                        <View style={{ flexDirection: 'row', gap: wp('2.5%') }}>
                            <View style={{ flex: 1 }}>
                                <Label text="Date" />
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
                                        {eventForm.timeDisplay || '6:00 PM'}
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

                        <Label text="Location" />
                        <CustomInput placeholder="Room/Venue" onChangeText={(t) => setEventForm({ ...eventForm, location: t })} value={eventForm.location} />

                        <TouchableOpacity onPress={handlePublishEvent} disabled={isSubmitting} style={{ backgroundColor: THEME_ACCENT, padding: hp('2%'), borderRadius: 15, alignItems: 'center', marginTop: hp('3%') }}>
                            {isSubmitting ? <ActivityIndicator color="black" /> : <Text style={{ color: 'black', fontWeight: '900', fontSize: hp('1.9%') }}>PUBLISH EVENT</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: hp('2%') }}>
                            <Text style={{ color: '#52525B', textAlign: 'center', fontWeight: 'bold' }}>Cancel</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>

            {/* IMPORT FROM EMAIL MODAL */}
            <Modal visible={emailModalVisible} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: '#0E0E10', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: wp('6%'), paddingBottom: hp('5%'), borderWidth: 1, borderColor: '#27272A' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp('2.5%') }}>
                            <View>
                                <Text style={{ color: THEME_ACCENT, fontSize: hp('1.3%'), fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>Auto-Import</Text>
                                <Text style={{ color: 'white', fontSize: hp('2.6%'), fontWeight: '900' }}>Import from Email</Text>
                            </View>
                            <TouchableOpacity onPress={() => setEmailModalVisible(false)} style={{ width: wp('10%'), height: wp('10%'), backgroundColor: '#1A1A1A', borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}>
                                <X color="white" size={hp('2.2%')} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ backgroundColor: '#161618', borderRadius: 16, padding: wp('4.5%'), marginBottom: hp('1.5%'), borderWidth: 1, borderColor: '#222' }}>
                            <Text style={{ color: THEME_ACCENT, fontSize: hp('1.3%'), fontWeight: '900', letterSpacing: 1, marginBottom: hp('0.5%') }}>STEP 1 — REGISTER YOUR EMAIL</Text>
                            <Text style={{ color: '#A0A0A0', fontSize: hp('1.6%'), lineHeight: hp('2.4%') }}>Contact your admin to link your email to your club, or use:</Text>
                            <Text style={{ color: 'white', fontSize: hp('1.5%'), fontWeight: '700', marginTop: hp('0.8%'), fontFamily: 'monospace', backgroundColor: '#0A0A0A', padding: hp('0.8%'), borderRadius: 8 }}>
                                PATCH /api/clubs/{adminClub?.clubId}/email{`\n`}{'{"email": "yourname@example.com"}'}
                            </Text>
                        </View>

                        <View style={{ backgroundColor: '#161618', borderRadius: 16, padding: wp('4.5%'), marginBottom: hp('1.5%'), borderWidth: 1, borderColor: '#222' }}>
                            <Text style={{ color: THEME_ACCENT, fontSize: hp('1.3%'), fontWeight: '900', letterSpacing: 1, marginBottom: hp('0.5%') }}>STEP 2 — SEND ANY EMAIL</Text>
                            <Text style={{ color: '#A0A0A0', fontSize: hp('1.6%'), lineHeight: hp('2.4%') }}>From your registered email, send to:</Text>
                            <Text style={{ color: 'white', fontSize: hp('1.6%'), fontWeight: '700', marginTop: hp('0.8%'), fontFamily: 'monospace', backgroundColor: '#0A0A0A', padding: hp('0.8%'), borderRadius: 8 }}>
                                events@pulseboard.mailgun.org
                            </Text>
                            <Text style={{ color: '#A0A0A0', fontSize: hp('1.5%'), marginTop: hp('1%'), lineHeight: hp('2.2%') }}>
                                AI will read the subject and body to extract event details automatically.
                            </Text>
                        </View>

                        <View style={{ backgroundColor: '#0D1117', borderRadius: 16, padding: wp('4.5%'), borderWidth: 1, borderColor: '#30363D' }}>
                            <Text style={{ color: '#6B7280', fontSize: hp('1.3%'), fontWeight: '700', letterSpacing: 1, marginBottom: hp('0.5%') }}>EXAMPLE EMAIL</Text>
                            <Text style={{ color: '#58A6FF', fontSize: hp('1.5%'), fontWeight: '600' }}>Subject: Final Hack Night — Hackathon Closing Ceremony</Text>
                            <Text style={{ color: '#8B949E', fontSize: hp('1.5%'), marginTop: hp('0.5%'), lineHeight: hp('2.2%') }}>
                                {`Hey team,\nJoin us for the closing ceremony on March 10th at 7 PM in LT-1.\nPrizes will be announced. All teams must attend.`}
                            </Text>
                        </View>

                        <Text style={{ color: '#52525B', fontSize: hp('1.4%'), textAlign: 'center', marginTop: hp('2%') }}>
                            Powered by Groq AI · Events appear within seconds
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const Label = ({ text }: { text: string }) => (
    <Text style={{ color: THEME_ACCENT, fontSize: 10, fontWeight: 'bold', marginTop: hp('2%') }}>{text.toUpperCase()}</Text>
);

const CustomInput = (props: TextInputProps) => (
    <TextInput
        {...props}
        placeholderTextColor="#52525B"
        style={[{ backgroundColor: '#161618', color: 'white', padding: hp('1.5%'), borderRadius: 10, marginTop: hp('0.5%'), borderWidth: 1, borderColor: '#222' }, props.style]}
    />
);

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
                                    style={{ width: '14.28%', alignItems: 'center', justifyContent: 'center', height: wp('10%'), backgroundColor: isSelected ? THEME_ACCENT : 'transparent', borderRadius: 99 }}
                                >
                                    <Text style={{ color: isSelected ? 'black' : 'white', fontWeight: isSelected ? 'bold' : 'normal', fontSize: hp('1.6%') }}>{day}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: hp('3%'), gap: wp('4%') }}>
                        <TouchableOpacity onPress={onCancel} style={{ paddingVertical: hp('1%'), paddingHorizontal: wp('4%') }}>
                            <Text style={{ color: '#A1A1AA', fontWeight: 'bold' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onConfirm(selectedDate)} style={{ paddingVertical: hp('1%'), paddingHorizontal: wp('5%'), backgroundColor: THEME_ACCENT, borderRadius: 12 }}>
                            <Text style={{ color: 'black', fontWeight: 'bold' }}>Confirm</Text>
                        </TouchableOpacity>
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
                            <Text style={{ color: isSelected ? 'white' : '#52525B', fontSize: isSelected ? hp('3%') : hp('2.2%'), fontWeight: isSelected ? '900' : 'bold' }}>
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
                        <TouchableOpacity onPress={onCancel} style={{ paddingVertical: hp('1%'), paddingHorizontal: wp('4%') }}>
                            <Text style={{ color: '#A1A1AA', fontWeight: 'bold' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleConfirm} style={{ paddingVertical: hp('1%'), paddingHorizontal: wp('5%'), backgroundColor: THEME_ACCENT, borderRadius: 12 }}>
                            <Text style={{ color: 'black', fontWeight: 'bold' }}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </MotiView>
            </View>
        </Modal>
    );
};
