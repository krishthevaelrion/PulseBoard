import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Dimensions,
  Modal,
} from "react-native";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Layers,
  MapPin,
  Mail,
  X,
  RefreshCw,
  List,
  LayoutGrid,
} from "lucide-react-native";
import { useFocusEffect, router } from "expo-router";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Easing } from "react-native-reanimated";
import {
  getCalendarEvents,
  getMockCalendarEvents,
  CalendarEvent,
} from "../src/api/calendar.api";

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════
const THEME_ACCENT = "#CCF900";
const SCREEN_WIDTH = Dimensions.get("window").width;
const HOUR_HEIGHT = 72;
const TIMELINE_LEFT = wp("14%");
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const MIN_COL_WIDTH = wp("28%");
const EVENT_AREA_BASE = SCREEN_WIDTH - TIMELINE_LEFT - wp("2%");
const MIN_EVENT_HEIGHT = 50;

const CATEGORY_COLORS: Record<
  string,
  { bg: string; border: string; text: string; gradient: [string, string] }
> = {
  interviews: {
    bg: "rgba(59,130,246,0.15)", border: "#3B82F6", text: "#93C5FD",
    gradient: ["rgba(59,130,246,0.25)", "rgba(59,130,246,0.05)"],
  },
  fests: {
    bg: "rgba(168,85,247,0.15)", border: "#A855F7", text: "#D8B4FE",
    gradient: ["rgba(168,85,247,0.25)", "rgba(168,85,247,0.05)"],
  },
  academics: {
    bg: "rgba(34,197,94,0.15)", border: "#22C55E", text: "#86EFAC",
    gradient: ["rgba(34,197,94,0.25)", "rgba(34,197,94,0.05)"],
  },
  admin: {
    bg: "rgba(249,115,22,0.15)", border: "#F97316", text: "#FDBA74",
    gradient: ["rgba(249,115,22,0.25)", "rgba(249,115,22,0.05)"],
  },
  hostel: {
    bg: "rgba(236,72,153,0.15)", border: "#EC4899", text: "#F9A8D4",
    gradient: ["rgba(236,72,153,0.25)", "rgba(236,72,153,0.05)"],
  },
  clubs: {
    bg: "rgba(20,184,166,0.15)", border: "#14B8A6", text: "#5EEAD4",
    gradient: ["rgba(20,184,166,0.25)", "rgba(20,184,166,0.05)"],
  },
  placements: {
    bg: "rgba(234,179,8,0.15)", border: "#EAB308", text: "#FDE047",
    gradient: ["rgba(234,179,8,0.25)", "rgba(234,179,8,0.05)"],
  },
  miscellaneous: {
    bg: "rgba(161,161,170,0.15)", border: "#A1A1AA", text: "#D4D4D8",
    gradient: ["rgba(161,161,170,0.25)", "rgba(161,161,170,0.05)"],
  },
};

const getCategoryStyle = (cat: string) =>
  CATEGORY_COLORS[cat.toLowerCase()] || CATEGORY_COLORS.miscellaneous;

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════
const formatTime = (d: Date) => {
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m < 10 ? "0" + m : m} ${ap}`;
};

const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const getDayLabel = (date: Date) => {
  const today = new Date();
  const tmr = new Date(today); tmr.setDate(tmr.getDate() + 1);
  const yst = new Date(today); yst.setDate(yst.getDate() - 1);
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, tmr)) return "Tomorrow";
  if (isSameDay(date, yst)) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long" });
};

const getWeekDates = (ref: Date): Date[] => {
  const day = ref.getDay();
  const mon = new Date(ref);
  mon.setDate(ref.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i); return d;
  });
};

const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ═══════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════
const CategoryChip = React.memo(
  ({ category, isActive, onPress }: { category: string; isActive: boolean; onPress: () => void }) => {
    const s = getCategoryStyle(category);
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}
        style={{
          flexDirection: "row", alignItems: "center",
          paddingHorizontal: wp("3.5%"), paddingVertical: hp("0.8%"),
          borderRadius: 20, marginRight: wp("2%"),
          backgroundColor: isActive ? s.bg : "#0A0A0A",
          borderWidth: 1, borderColor: isActive ? s.border : "#1A1A1A",
        }}
      >
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.border, marginRight: wp("2%") }} />
        <Text style={{ color: isActive ? s.text : "#52525B", fontSize: hp("1.3%"), fontWeight: "700", textTransform: "capitalize" }}>
          {category}
        </Text>
      </TouchableOpacity>
    );
  }
);

const DayPill = React.memo(
  ({ date, isSelected, isToday, hasEvents, onPress }: {
    date: Date; isSelected: boolean; isToday: boolean; hasEvents: boolean; onPress: () => void;
  }) => (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress}
      style={{
        flex: 1, alignItems: "center", paddingVertical: hp("1.2%"), borderRadius: 16,
        backgroundColor: isSelected ? THEME_ACCENT : isToday ? "rgba(204,249,0,0.08)" : "transparent",
        borderWidth: isToday && !isSelected ? 1 : 0, borderColor: "rgba(204,249,0,0.2)",
      }}
    >
      <Text style={{ color: isSelected ? "#050505" : "#52525B", fontSize: hp("1.1%"), fontWeight: "900", letterSpacing: 1, marginBottom: 4 }}>
        {DAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1]}
      </Text>
      <Text style={{ color: isSelected ? "#050505" : isToday ? THEME_ACCENT : "white", fontSize: hp("2.2%"), fontWeight: "900" }}>
        {date.getDate()}
      </Text>
      {hasEvents && !isSelected && (
        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: THEME_ACCENT, marginTop: 4 }} />
      )}
    </TouchableOpacity>
  )
);

/** Timeline event block */
const EventBlock = React.memo(
  ({ event, top, height, left, width, index, onPress }: {
    event: CalendarEvent; top: number; height: number;
    left: number; width: number; index: number; onPress: () => void;
  }) => {
    const s = getCategoryStyle(event.category);
    const isShort = height < 55;
    const isNarrow = width < 90;

    return (
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 300, delay: Math.min(index * 30, 250), easing: Easing.out(Easing.quad) }}
        style={{ position: "absolute", top, left, width, height: Math.max(height, MIN_EVENT_HEIGHT), zIndex: 10 }}
      >
        <TouchableOpacity activeOpacity={0.85} onPress={onPress}
          style={{ flex: 1, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: s.border, overflow: "hidden" }}
        >
          <LinearGradient
            colors={s.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{
              flex: 1, padding: isNarrow ? 5 : 8,
              borderWidth: 1, borderLeftWidth: 0, borderColor: `${s.border}33`,
              borderRadius: 12, borderTopLeftRadius: 0, borderBottomLeftRadius: 0,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {!isNarrow && event.icon ? <Text style={{ fontSize: hp("1.2%"), marginRight: 3 }}>{event.icon}</Text> : null}
              <Text numberOfLines={isShort ? 1 : 2}
                style={{ color: s.text, fontSize: isNarrow ? hp("1%") : hp("1.3%"), fontWeight: "800", flex: 1 }}
              >
                {event.title}
              </Text>
            </View>
            {!isShort && !isNarrow && (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                <Clock color={s.border} size={8} />
                <Text style={{ color: `${s.text}AA`, fontSize: hp("0.95%"), marginLeft: 3, fontWeight: "600" }}>
                  {formatTime(new Date(event.start))} – {formatTime(new Date(event.end))}
                </Text>
              </View>
            )}
            {height > 70 && !isNarrow && event.location && event.location !== "TBD" && (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                <MapPin color={s.border} size={8} />
                <Text numberOfLines={1} style={{ color: `${s.text}88`, fontSize: hp("0.9%"), marginLeft: 3, fontWeight: "600" }}>{event.location}</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </MotiView>
    );
  }
);

/** Overflow indicator when more events exist than MAX_COLUMNS */
const OverflowBadge = React.memo(
  ({ count, top, onPress }: { count: number; top: number; onPress: () => void }) => (
    <TouchableOpacity
      activeOpacity={0.7} onPress={onPress}
      style={{
        position: "absolute", top: top + 2,
        right: wp("2%"), zIndex: 15,
        backgroundColor: "rgba(204,249,0,0.15)",
        borderWidth: 1, borderColor: "rgba(204,249,0,0.3)",
        borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4,
      }}
    >
      <Text style={{ color: THEME_ACCENT, fontSize: hp("1.1%"), fontWeight: "900" }}>
        +{count} more
      </Text>
    </TouchableOpacity>
  )
);

/** Event card in the list view below timeline */
const EventCard = React.memo(
  ({ event, index, onPress }: { event: CalendarEvent; index: number; onPress: () => void }) => {
    const s = getCategoryStyle(event.category);
    const startTime = formatTime(new Date(event.start));
    const endTime = formatTime(new Date(event.end));

    return (
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 300, delay: Math.min(index * 50, 400), easing: Easing.out(Easing.quad) }}
      >
        <TouchableOpacity activeOpacity={0.8} onPress={onPress}
          style={{
            backgroundColor: "#0D0D0D", borderRadius: 16,
            marginBottom: hp("1.2%"), overflow: "hidden",
            borderWidth: 1, borderColor: "#1A1A1A",
          }}
        >
          {/* Colored top accent */}
          <View style={{ height: 3, backgroundColor: s.border }} />

          <View style={{ padding: wp("4%") }}>
            {/* Title row */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: hp("0.8%") }}>
              <Text style={{ fontSize: hp("2%"), marginRight: wp("2%") }}>{event.icon || "📅"}</Text>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={{ color: "#fff", fontWeight: "800", fontSize: hp("1.7%") }}>
                  {event.title}
                </Text>
              </View>
              <View style={{
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                backgroundColor: `${s.border}20`, borderWidth: 1, borderColor: `${s.border}40`,
              }}>
                <Text style={{ color: s.border, fontSize: hp("1%"), fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {event.category}
                </Text>
              </View>
            </View>

            {/* Time + Location */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: wp("3%") }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Clock size={hp("1.5%")} color={THEME_ACCENT} />
                <Text style={{ color: THEME_ACCENT, fontSize: hp("1.3%"), fontWeight: "700", marginLeft: 4 }}>
                  {startTime} – {endTime}
                </Text>
              </View>
              {event.location && event.location !== "TBD" && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MapPin size={hp("1.5%")} color="#666" />
                  <Text numberOfLines={1} style={{ color: "#666", fontSize: hp("1.3%"), marginLeft: 4 }}>
                    {event.location}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  }
);

/** Event detail modal */
const EventDetailModal = ({
  event, visible, onClose,
}: { event: CalendarEvent | null; visible: boolean; onClose: () => void }) => {
  if (!event) return null;
  const s = getCategoryStyle(event.category);
  const startTime = formatTime(new Date(event.start));
  const endTime = formatTime(new Date(event.end));
  const dateStr = new Date(event.start).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
        <View style={{
          backgroundColor: "#0A0A0A", borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: wp("6%"), paddingBottom: hp("5%"), borderWidth: 1, borderColor: "#1A1A1A",
        }}>
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: hp("2%") }}>
            <View style={{ flex: 1, marginRight: wp("3%") }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <Text style={{ fontSize: hp("2.5%"), marginRight: 8 }}>{event.icon}</Text>
                <View style={{
                  paddingHorizontal: 8, paddingVertical: 3, backgroundColor: `${s.border}22`,
                  borderRadius: 8, borderWidth: 1, borderColor: `${s.border}44`,
                }}>
                  <Text style={{ color: s.border, fontSize: hp("1.1%"), fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 }}>
                    {event.badge || "UPCOMING"}
                  </Text>
                </View>
              </View>
              <Text style={{ color: "white", fontSize: hp("2.4%"), fontWeight: "900", letterSpacing: -0.3 }}>
                {event.title}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}
              style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center" }}
            >
              <X color="#666" size={18} />
            </TouchableOpacity>
          </View>

          {/* Details */}
          <View style={{ backgroundColor: "#111", borderRadius: 16, padding: wp("4%"), borderWidth: 1, borderColor: "#1E1E1E" }}>
            <DetailRow icon={CalendarIcon} label="Date" value={dateStr} color={s.border} />
            <DetailRow icon={Clock} label="Time" color={s.border}
              value={event.timeDisplay && event.timeDisplay !== "TBD" ? event.timeDisplay : `${startTime} – ${endTime}`}
            />
            {event.location && event.location !== "TBD" && (
              <DetailRow icon={MapPin} label="Location" value={event.location} color={s.border} />
            )}
            {event.sourceFrom ? (
              <DetailRow icon={Mail} label="Source" value={event.sourceFrom} color={s.border} isLast />
            ) : null}
          </View>

          {event.description ? (
            <View style={{ marginTop: hp("2%") }}>
              <Text style={{ color: "#555", fontSize: hp("1.2%"), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                Description
              </Text>
              <Text style={{ color: "#999", fontSize: hp("1.4%"), fontWeight: "500", lineHeight: hp("2.2%") }}>
                {event.description}
              </Text>
            </View>
          ) : null}

          <View style={{ marginTop: hp("2%"), flexDirection: "row" }}>
            <View style={{
              paddingHorizontal: 12, paddingVertical: 6, backgroundColor: s.bg,
              borderRadius: 20, borderWidth: 1, borderColor: s.border,
              flexDirection: "row", alignItems: "center",
            }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.border, marginRight: 6 }} />
              <Text style={{ color: s.text, fontSize: hp("1.2%"), fontWeight: "800", textTransform: "capitalize" }}>
                {event.category}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const DetailRow = ({ icon: Icon, label, value, color, isLast }: {
  icon: any; label: string; value: string; color: string; isLast?: boolean;
}) => (
  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: isLast ? 0 : hp("1.5%") }}>
    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${color}15`, alignItems: "center", justifyContent: "center" }}>
      <Icon color={color} size={16} />
    </View>
    <View style={{ marginLeft: 12, flex: 1 }}>
      <Text style={{ color: "#666", fontSize: hp("1.1%"), fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>{label}</Text>
      <Text numberOfLines={2} style={{ color: "white", fontSize: hp("1.5%"), fontWeight: "700", marginTop: 2 }}>{value}</Text>
    </View>
  </View>
);

// ═══════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════
export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(useCallback(() => { loadEvents(); }, [useMock]));

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = useMock ? await getMockCalendarEvents() : await getCalendarEvents();
      setEvents(data);
    } catch (err) {
      console.error("Failed to load calendar events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = useMock ? await getMockCalendarEvents() : await getCalendarEvents();
      setEvents(data);
    } catch (err) { console.error("Failed to refresh:", err); }
    finally { setRefreshing(false); }
  };

  const handleEventPress = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const eventsForDay = useMemo(() => {
    return events.filter((e) => {
      const ed = new Date(e.start);
      const dayMatch = isSameDay(ed, selectedDate);
      const filterMatch = activeFilters.size === 0 || activeFilters.has(e.category.toLowerCase());
      return dayMatch && filterMatch;
    });
  }, [events, selectedDate, activeFilters]);

  const allCategories = useMemo(() => {
    const cats = new Set(events.map((e) => e.category.toLowerCase()));
    return Array.from(cats);
  }, [events]);

  const dateHasEvents = useCallback(
    (date: Date) => events.some((e) => isSameDay(new Date(e.start), date)),
    [events]
  );

  const toggleFilter = (cat: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const goToPrevWeek = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d); };
  const goToNextWeek = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d); };
  const goToToday = () => setSelectedDate(new Date());

  // ─── Overlap layout (unlimited columns, scrollable) ───
  const { positionedEvents, eventAreaWidth } = useMemo(() => {
    if (eventsForDay.length === 0)
      return { positionedEvents: [] as (CalendarEvent & { column: number; totalColumns: number })[], eventAreaWidth: EVENT_AREA_BASE };

    const sorted = [...eventsForDay].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    type Positioned = CalendarEvent & { column: number; totalColumns: number };
    const columns: CalendarEvent[][] = [];

    for (const event of sorted) {
      const eventStart = new Date(event.start).getTime();
      let placed = false;

      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col][columns[col].length - 1];
        const lastEnd = new Date(lastInCol.end).getTime();
        if (eventStart >= lastEnd) {
          columns[col].push(event);
          placed = true;
          break;
        }
      }

      if (!placed) {
        columns.push([event]);
      }
    }

    const totalColumns = columns.length;
    const result: Positioned[] = [];
    for (let col = 0; col < columns.length; col++) {
      for (const ev of columns[col]) {
        result.push({ ...ev, column: col, totalColumns: Math.max(totalColumns, 1) });
      }
    }

    // Calculate scrollable area width — expand beyond screen when needed
    const colWidth = totalColumns <= 0 ? EVENT_AREA_BASE : Math.max(MIN_COL_WIDTH, EVENT_AREA_BASE / totalColumns);
    const areaWidth = Math.max(EVENT_AREA_BASE, totalColumns * colWidth);

    return { positionedEvents: result, eventAreaWidth: areaWidth };
  }, [eventsForDay]);

  const getEventLayout = (event: CalendarEvent & { column: number; totalColumns: number }) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    const top = (startHour - 6) * HOUR_HEIGHT;
    const height = Math.max((endHour - startHour) * HOUR_HEIGHT, MIN_EVENT_HEIGHT);
    const colWidth = eventAreaWidth / event.totalColumns;
    const left = event.column * colWidth;
    const width = colWidth - 4;

    return { top, height, left, width };
  };

  const now = new Date();
  const currentTimeTop = useMemo(() => {
    const h = now.getHours() + now.getMinutes() / 60;
    return (h - 6) * HOUR_HEIGHT;
  }, []);
  const isToday = isSameDay(selectedDate, now);

  // Auto-scroll timeline to current hour (or first event) on mount / date change
  useEffect(() => {
    if (viewMode === "timeline" && scrollRef.current) {
      const timer = setTimeout(() => {
        if (isToday) {
          // Scroll to current time minus a bit of padding
          const scrollTo = Math.max(currentTimeTop - HOUR_HEIGHT, 0);
          scrollRef.current?.scrollTo({ y: scrollTo, animated: true });
        } else if (sortedDayEvents.length > 0) {
          // Scroll to the first event of the day
          const firstStart = new Date(sortedDayEvents[0].start);
          const firstHour = firstStart.getHours() + firstStart.getMinutes() / 60;
          const scrollTo = Math.max((firstHour - 6) * HOUR_HEIGHT - HOUR_HEIGHT / 2, 0);
          scrollRef.current?.scrollTo({ y: scrollTo, animated: true });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [viewMode, selectedDate, isToday, loading]);

  // Sort events for list view by start time
  const sortedDayEvents = useMemo(
    () => [...eventsForDay].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [eventsForDay]
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#050505" }}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === "android" ? hp("1%") : 0 }}>
        {/* ═══ HEADER ═══ */}
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
        >
          <View style={{ paddingHorizontal: wp("6%"), paddingTop: hp("2%"), paddingBottom: hp("1%") }}>
            {/* Title */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: hp("0.5%") }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity onPress={() => router.back()}
                  style={{
                    width: wp("10%"), height: wp("10%"), backgroundColor: "#121212",
                    borderRadius: 12, alignItems: "center", justifyContent: "center",
                    borderWidth: 1, borderColor: "#222", marginRight: wp("3%"),
                  }}
                >
                  <ArrowLeft color="white" size={hp("2%")} />
                </TouchableOpacity>
                <CalendarIcon color={THEME_ACCENT} size={hp("2.8%")} strokeWidth={2.5} />
                <Text style={{ color: "white", fontSize: hp("2.8%"), fontWeight: "900", letterSpacing: -0.5, marginLeft: wp("2.5%") }}>
                  My Calendar
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity activeOpacity={0.7} onPress={handleRefresh} disabled={refreshing}
                  style={{ padding: hp("0.8%"), backgroundColor: "#121212", borderRadius: 10, marginRight: 8, borderWidth: 1, borderColor: "#222" }}
                >
                  <RefreshCw color={refreshing ? THEME_ACCENT : "#666"} size={hp("1.8%")} />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setUseMock(!useMock)}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    paddingHorizontal: wp("3%"), paddingVertical: hp("0.6%"), borderRadius: 10,
                    backgroundColor: useMock ? "rgba(234,179,8,0.1)" : "rgba(34,197,94,0.1)",
                    borderWidth: 1, borderColor: useMock ? "rgba(234,179,8,0.3)" : "rgba(34,197,94,0.3)",
                  }}
                >
                  <Layers color={useMock ? "#EAB308" : "#22C55E"} size={hp("1.5%")} />
                  <Text style={{ color: useMock ? "#EAB308" : "#22C55E", fontSize: hp("1.1%"), fontWeight: "800", marginLeft: 4, letterSpacing: 0.5 }}>
                    {useMock ? "MOCK" : "LIVE"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Month + Nav */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: hp("0.5%") }}>
              <View>
                <Text style={{ color: "#737373", fontSize: hp("1.3%"), fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
                  {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </Text>
                <Text style={{ color: THEME_ACCENT, fontSize: hp("1.5%"), fontWeight: "800", marginTop: 2 }}>
                  {getDayLabel(selectedDate)} •{" "}
                  {eventsForDay.length === 0 ? "No events" : `${eventsForDay.length} event${eventsForDay.length > 1 ? "s" : ""}`}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity onPress={goToToday}
                  style={{
                    paddingHorizontal: wp("3%"), paddingVertical: hp("0.6%"), borderRadius: 8,
                    backgroundColor: "rgba(204,249,0,0.08)", borderWidth: 1, borderColor: "rgba(204,249,0,0.15)", marginRight: wp("2%"),
                  }}
                >
                  <Text style={{ color: THEME_ACCENT, fontSize: hp("1.1%"), fontWeight: "900", letterSpacing: 1 }}>TODAY</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={goToPrevWeek}
                  style={{ padding: hp("0.8%"), backgroundColor: "#121212", borderRadius: 10, marginRight: 6 }}
                >
                  <ChevronLeft color="#666" size={hp("2%")} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goToNextWeek}
                  style={{ padding: hp("0.8%"), backgroundColor: "#121212", borderRadius: 10 }}
                >
                  <ChevronRight color="#666" size={hp("2%")} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* WEEK STRIP */}
          <View style={{ flexDirection: "row", paddingHorizontal: wp("4%"), paddingVertical: hp("0.8%"), gap: 4 }}>
            {weekDates.map((date, i) => (
              <DayPill key={i} date={date}
                isSelected={isSameDay(date, selectedDate)}
                isToday={isSameDay(date, now)}
                hasEvents={dateHasEvents(date)}
                onPress={() => setSelectedDate(date)}
              />
            ))}
          </View>

          {/* FILTERS + VIEW TOGGLE */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {allCategories.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: wp("4%"), paddingVertical: hp("1%") }}
                style={{ flex: 1 }}
              >
                {allCategories.map((cat) => (
                  <CategoryChip key={cat} category={cat}
                    isActive={activeFilters.size === 0 || activeFilters.has(cat)}
                    onPress={() => toggleFilter(cat)}
                  />
                ))}
              </ScrollView>
            )}
            {/* View toggle */}
            <View style={{ flexDirection: "row", marginRight: wp("4%"), gap: 4 }}>
              <TouchableOpacity
                onPress={() => setViewMode("list")}
                style={{
                  padding: 8, borderRadius: 10,
                  backgroundColor: viewMode === "list" ? "rgba(204,249,0,0.15)" : "#0A0A0A",
                  borderWidth: 1, borderColor: viewMode === "list" ? "rgba(204,249,0,0.3)" : "#1A1A1A",
                }}
              >
                <List color={viewMode === "list" ? THEME_ACCENT : "#52525B"} size={hp("1.8%")} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode("timeline")}
                style={{
                  padding: 8, borderRadius: 10,
                  backgroundColor: viewMode === "timeline" ? "rgba(204,249,0,0.15)" : "#0A0A0A",
                  borderWidth: 1, borderColor: viewMode === "timeline" ? "rgba(204,249,0,0.3)" : "#1A1A1A",
                }}
              >
                <LayoutGrid color={viewMode === "timeline" ? THEME_ACCENT : "#52525B"} size={hp("1.8%")} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.05)" }} />
        </MotiView>

        {/* ═══ CONTENT ═══ */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={THEME_ACCENT} />
            <Text style={{ color: "#444", marginTop: hp("2%"), fontWeight: "600" }}>Loading events...</Text>
          </View>
        ) : viewMode === "list" ? (
          /* ── LIST VIEW ── */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: wp("5%"), paddingTop: hp("2%"), paddingBottom: hp("8%") }}
          >
            {sortedDayEvents.length === 0 ? (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 500 }}
                style={{ alignItems: "center", paddingTop: hp("10%") }}
              >
                <Text style={{ fontSize: 50, marginBottom: 16 }}>📭</Text>
                <Text style={{ color: "#555", fontSize: hp("1.8%"), fontWeight: "800", marginBottom: 6 }}>
                  No events {getDayLabel(selectedDate).toLowerCase()}
                </Text>
                <Text style={{ color: "#333", fontSize: hp("1.3%"), fontWeight: "600", textAlign: "center", lineHeight: hp("2%") }}>
                  {useMock ? "No mock events for this day" : "Events from your emails will\nappear here automatically"}
                </Text>
              </MotiView>
            ) : (
              sortedDayEvents.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={index}
                  onPress={() => handleEventPress(event)}
                />
              ))
            )}
          </ScrollView>
        ) : (
          /* ── TIMELINE VIEW ── */
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: hp("8%") }}
          >
            <View style={{ flexDirection: "row", position: "relative" }}>
              {/* Fixed hour labels column */}
              <View style={{ width: TIMELINE_LEFT, zIndex: 5 }}>
                {HOURS.map((hour) => (
                  <View key={hour} style={{ height: HOUR_HEIGHT, alignItems: "center", justifyContent: "flex-start" }}>
                    <Text style={{ color: "#3A3A3A", fontSize: hp("1.2%"), fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                      {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Horizontally scrollable event area */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                nestedScrollEnabled={true}
                contentContainerStyle={{ width: Math.max(eventAreaWidth, EVENT_AREA_BASE) }}
                style={{ flex: 1 }}
              >
                <View style={{ width: Math.max(eventAreaWidth, EVENT_AREA_BASE), position: "relative" }}>
                  {/* Hour grid lines */}
                  {HOURS.map((hour) => (
                    <View key={hour} style={{ height: HOUR_HEIGHT, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.04)" }} />
                  ))}

                  {/* Event blocks */}
                  {positionedEvents.map((event, idx) => {
                    const layout = getEventLayout(event);
                    return (
                      <EventBlock key={event.id + "-" + idx} event={event}
                        top={layout.top} height={layout.height}
                        left={layout.left} width={layout.width}
                        index={idx} onPress={() => handleEventPress(event)}
                      />
                    );
                  })}

                  {/* Empty state */}
                  {eventsForDay.length === 0 && (
                    <MotiView
                      from={{ opacity: 0, translateY: 20 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ type: "timing", duration: 500 }}
                      style={{ position: "absolute", top: 4 * HOUR_HEIGHT, left: 0, right: 0, alignItems: "center" }}
                    >
                      <View style={{
                        backgroundColor: "#0C0C0C", borderRadius: 20, padding: wp("6%"),
                        alignItems: "center", borderWidth: 1, borderColor: "#1A1A1A", width: wp("70%"),
                      }}>
                        <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
                        <Text style={{ color: "#555", fontSize: hp("1.6%"), fontWeight: "800", marginBottom: 4 }}>
                          No events {getDayLabel(selectedDate).toLowerCase()}
                        </Text>
                        <Text style={{ color: "#333", fontSize: hp("1.2%"), fontWeight: "600", textAlign: "center" }}>
                          {useMock ? "No mock events for this day" : "Events from your emails will appear here automatically"}
                        </Text>
                      </View>
                    </MotiView>
                  )}
                </View>
              </ScrollView>

              {/* Current time indicator — overlays both columns */}
              {isToday && currentTimeTop >= 0 && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute", top: currentTimeTop,
                    left: TIMELINE_LEFT - 6, right: 0, zIndex: 25,
                    flexDirection: "row", alignItems: "center",
                  }}
                >
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#EF4444" }} />
                  <View style={{ flex: 1, height: 2, backgroundColor: "#EF4444", opacity: 0.7 }} />
                </View>
              )}

              {/* Horizontal scroll hint — subtle gradient fade */}
              {eventAreaWidth > EVENT_AREA_BASE && (
                <LinearGradient
                  colors={["transparent", "rgba(5,5,5,0.85)"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  pointerEvents="none"
                  style={{
                    position: "absolute", top: 0, right: 0, bottom: 0,
                    width: wp("6%"), zIndex: 15,
                  }}
                />
              )}
            </View>
          </ScrollView>
        )}

        <EventDetailModal event={selectedEvent} visible={modalVisible}
          onClose={() => { setModalVisible(false); setSelectedEvent(null); }}
        />
      </SafeAreaView>
    </View>
  );
}
