import { Request, Response } from "express";
import PersonalEvent from "../models/PersonalEvent.model";

/**
 * Shape returned to the calendar frontend.
 */
export interface CalendarEventDTO {
  id: string;
  title: string;
  description: string;
  start: string;      // ISO 8601
  end: string;        // ISO 8601
  category: string;   // mapped from color/icon
  location: string;
  timeDisplay: string;
  icon: string;
  color: string;
  badge: "LIVE" | "UPCOMING";
  sourceFrom: string;
  sourceSubject: string;
}

/**
 * Maps a PersonalEvent's color hex to a calendar category name.
 */
function colorToCategory(color: string, title: string): string {
  const lc = title.toLowerCase();

  if (/interview|intern|placement|career|job|recruit/i.test(lc)) return "interviews";
  if (/fest|cultural|dance|music|perform|art/i.test(lc)) return "fests";
  if (/academic|quiz|exam|assignment|deadline|submission|lecture|class/i.test(lc)) return "academics";
  if (/admin|maintenance|office|notice|circular/i.test(lc)) return "admin";
  if (/hostel|mess|laundry|warden|room/i.test(lc)) return "hostel";
  if (/club|society|committee|member|council/i.test(lc)) return "clubs";
  if (/hackathon|code|coding|workshop|seminar|talk|bootcamp|training/i.test(lc)) return "placements";

  const colorMap: Record<string, string> = {
    "#6366F1": "placements",
    "#F59E0B": "fests",
    "#10B981": "clubs",
    "#3B82F6": "academics",
    "#EC4899": "fests",
    "#F97316": "interviews",
    "#CCF900": "miscellaneous",
  };

  return colorMap[color?.toUpperCase()] || "miscellaneous";
}

/**
 * Parses a time string like "6:00 PM" and applies it to a base date.
 * Returns new Date with that time, or null on failure.
 */
function parseTimeString(timeStr: string, baseDate: Date): Date | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  const result = new Date(baseDate);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Extracts start and end times from a PersonalEvent.
 *
 * The PersonalEvent.date might be stored at midnight (00:00) while the
 * actual time lives in timeDisplay (e.g. "6:00 PM", "10 AM - 12 PM", "TBD").
 * This function parses timeDisplay to set proper calendar block times.
 * Now also handles deadline annotations like "11:59 PM (Deadline)".
 */
function computeStartEnd(
  eventDate: Date,
  timeDisplay: string | undefined
): { start: Date; end: Date } {
  const baseDate = new Date(eventDate);
  const rawTd = (timeDisplay || "").trim();

  // Strip annotations like "(Deadline)", "(Due)", etc. before parsing
  const isDeadline = /\(deadline\)/i.test(rawTd);
  const td = rawTd.replace(/\s*\((?:deadline|due|submission)\)/gi, "").trim();

  // Default duration: 30min for deadlines, 1hr for normal events
  const defaultDuration = isDeadline ? 30 * 60 * 1000 : 60 * 60 * 1000;

  // Normalize "6 PM" -> "6:00 PM", "5:30PM" -> "5:30 PM"
  const normalizeTime = (t: string) =>
    t.replace(/^(\d{1,2})\s*(AM|PM)/i, "$1:00 $2")
     .replace(/(\d{1,2}):(\d{2})(AM|PM)/i, "$1:$2 $3");

  // 1. Try to match a time RANGE like "6:00 PM - 8:00 PM" or "10 AM – 12 PM"
  const rangeMatch = td.match(
    /(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*[-–—to]+\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i
  );
  if (rangeMatch) {
    const startParsed = parseTimeString(normalizeTime(rangeMatch[1].trim()), baseDate);
    const endParsed = parseTimeString(normalizeTime(rangeMatch[2].trim()), baseDate);

    if (startParsed && endParsed) {
      // Handle overnight ranges (e.g. 11 PM - 1 AM)
      if (endParsed <= startParsed) {
        endParsed.setDate(endParsed.getDate() + 1);
      }
      return { start: startParsed, end: endParsed };
    }
    if (startParsed) {
      return { start: startParsed, end: new Date(startParsed.getTime() + defaultDuration) };
    }
  }

  // 2. Try to match a SINGLE time like "6:00 PM" or "10 AM"
  const singleMatch = td.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i);
  if (singleMatch) {
    const startParsed = parseTimeString(normalizeTime(singleMatch[1].trim()), baseDate);
    if (startParsed) {
      return {
        start: startParsed,
        end: new Date(startParsed.getTime() + defaultDuration),
      };
    }
  }

  // 3. Check if the stored date already has a meaningful time (not midnight)
  const hours = baseDate.getHours();
  const minutes = baseDate.getMinutes();
  if (hours !== 0 || minutes !== 0) {
    // Date already has time embedded (AI set it)
    return {
      start: baseDate,
      end: new Date(baseDate.getTime() + defaultDuration),
    };
  }

  // 4. Fallback: TBD or unparseable → place at 9 AM
  const fallbackStart = new Date(baseDate);
  fallbackStart.setHours(9, 0, 0, 0);
  return {
    start: fallbackStart,
    end: new Date(fallbackStart.getTime() + defaultDuration),
  };
}

/**
 * GET /api/calendar/events
 */
export const getCalendarEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { category, from, to } = req.query;

    const filter: Record<string, any> = { userId };

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from as string);
      if (to) filter.date.$lte = new Date(to as string);
    }

    const personalEvents = await PersonalEvent.find(filter)
      .sort({ date: 1 })
      .limit(200)
      .lean();

    let calendarEvents: CalendarEventDTO[] = personalEvents.map((pe) => {
      const { start, end } = computeStartEnd(new Date(pe.date), pe.timeDisplay);
      const eventCategory = colorToCategory(pe.color || "#CCF900", pe.title);

      return {
        id: pe._id.toString(),
        title: pe.title,
        description: pe.description || "",
        start: start.toISOString(),
        end: end.toISOString(),
        category: eventCategory,
        location: pe.location || "TBD",
        timeDisplay: pe.timeDisplay || "TBD",
        icon: pe.icon || "📅",
        color: pe.color || "#CCF900",
        badge: pe.badge || "UPCOMING",
        sourceFrom: pe.sourceFrom || "",
        sourceSubject: pe.sourceSubject || "",
      };
    });

    if (category) {
      const catFilter = (category as string).toLowerCase();
      calendarEvents = calendarEvents.filter(
        (e) => e.category.toLowerCase() === catFilter
      );
    }

    console.log(
      `📅 Calendar: Returning ${calendarEvents.length} events for user ${userId}`
    );

    res.status(200).json(calendarEvents);
  } catch (error: any) {
    console.error("❌ Calendar Controller Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/calendar/mock
 */
export const getMockCalendarEvents = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const mockEvents: CalendarEventDTO[] = [
    {
      id: "mock-1",
      title: "DSA Round 2 — Google Interview",
      description: "Technical interview round with focus on data structures.",
      start: new Date(today.getTime() + 10 * 60 * 60 * 1000).toISOString(),
      end: new Date(today.getTime() + 11.5 * 60 * 60 * 1000).toISOString(),
      category: "interviews",
      location: "Online — Google Meet",
      timeDisplay: "10:00 AM - 11:30 AM",
      icon: "💼",
      color: "#F97316",
      badge: "UPCOMING",
      sourceFrom: "placement.cell@college.edu",
      sourceSubject: "Google Interview Schedule",
    },
    {
      id: "mock-2",
      title: "Techfest Core Committee Meeting",
      description: "Planning meeting for upcoming tech fest.",
      start: new Date(today.getTime() + 14 * 60 * 60 * 1000).toISOString(),
      end: new Date(today.getTime() + 15.5 * 60 * 60 * 1000).toISOString(),
      category: "fests",
      location: "Seminar Hall 2",
      timeDisplay: "2:00 PM - 3:30 PM",
      icon: "🎭",
      color: "#F59E0B",
      badge: "UPCOMING",
      sourceFrom: "techfest@college.edu",
      sourceSubject: "Committee Meeting Notice",
    },
    {
      id: "mock-3",
      title: "Machine Learning Quiz — Prof. Kumar",
      description: "Mid-semester surprise quiz on neural networks.",
      start: new Date(today.getTime() + 11 * 60 * 60 * 1000).toISOString(),
      end: new Date(today.getTime() + 12 * 60 * 60 * 1000).toISOString(),
      category: "academics",
      location: "LT-301",
      timeDisplay: "11:00 AM - 12:00 PM",
      icon: "📚",
      color: "#3B82F6",
      badge: "UPCOMING",
      sourceFrom: "prof.kumar@college.edu",
      sourceSubject: "ML Quiz Notice",
    },
    {
      id: "mock-4",
      title: "Hostel Maintenance — Water Supply",
      description: "Scheduled water supply maintenance in Block B.",
      start: new Date(today.getTime() + 16 * 60 * 60 * 1000).toISOString(),
      end: new Date(today.getTime() + 17 * 60 * 60 * 1000).toISOString(),
      category: "admin",
      location: "Hostel Block B",
      timeDisplay: "4:00 PM - 5:00 PM",
      icon: "🏠",
      color: "#F97316",
      badge: "UPCOMING",
      sourceFrom: "admin@college.edu",
      sourceSubject: "Maintenance Schedule",
    },
  ];

  res.status(200).json(mockEvents);
};
