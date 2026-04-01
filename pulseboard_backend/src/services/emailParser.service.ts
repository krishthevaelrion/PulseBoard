import axios from 'axios';

export type EventCategory = 'clubs' | 'interviews' | 'mess' | 'google_classroom' | 'lost_found' | 'academic' | 'general';

export interface ParsedEvent {
    title: string;
    description: string;
    date: Date;
    timeDisplay: string;
    location: string;
    badge: 'LIVE' | 'UPCOMING';
    icon: string;
    color: string;
    category: EventCategory;
}

/**
 * Uses Groq AI to:
 * 1. Decide if the email is event-worthy for a college student
 * 2. If yes, parse it into structured event data with ACCURATE time extraction
 *
 * Returns null if the email is NOT event-worthy (spam, OTPs, promotions, etc.)
 */
export async function parseEventFromEmail(
    subject: string,
    body: string
): Promise<ParsedEvent | null> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentDateStr = now.toISOString().split('T')[0]; // e.g. "2026-04-01"

    const prompt = `
You are an AI assistant for PulseBoard, a college student productivity app.
Today's date is ${currentDateStr} (${currentYear}).

Analyse this email and decide if it represents something actionable or important for a college student — such as:
- A club event, fest, or cultural activity
- An interview, internship, or placement notice
- A deadline, submission, or academic requirement
- A workshop, hackathon, seminar, or talk
- A scholarship or opportunity with a deadline
- Any campus notice that requires attention or attendance
- A sports event, match, or tournament
- A class, lab session, or lecture

Do NOT treat as events: OTPs, password resets, promotional marketing emails, newsletters with no specific date/deadline, order confirmations, social media notifications, or general spam.

Subject: ${subject}
Body: ${body.slice(0, 3000)}

CRITICAL TIME EXTRACTION RULES:
1. You MUST extract the EXACT time mentioned in the email. Look for patterns like:
   - "at 5:00 PM", "from 2 PM to 4 PM", "starts at 10:30 AM"
   - "6:00 PM - 8:00 PM", "10 AM – 12 PM", "between 3 and 5 PM"
   - "5 PM onwards", "after 2:30 PM", "by 11:59 PM"
   - "morning session 9 AM", "evening 6 PM"
2. For the "date" field, include the EXACT time in the ISO string. Do NOT set it to midnight (00:00).
   Example: If the event is on April 5 at 3:30 PM, return "2026-04-05T15:30:00.000Z"
3. For "timeDisplay", return the human-readable time range exactly as mentioned.
   Examples: "5:00 PM - 7:00 PM", "10:30 AM", "3 PM onwards", "11:59 PM (Deadline)"
4. If the email mentions a DEADLINE (e.g. "last date", "submit by", "deadline", "due by"), 
   set the time to the deadline time. If only a date is given with no time, set to "11:59 PM".
   Set timeDisplay to something like "11:59 PM (Deadline)" or "5:00 PM (Deadline)".
5. If absolutely NO time is mentioned anywhere in the email, set timeDisplay to "TBD" and 
   set the date to 09:00 AM of that day.
6. If the email mentions "tomorrow", "today", "next Monday" etc., resolve it relative to today (${currentDateStr}).
7. If only a date is mentioned without a year, assume ${currentYear}. If the date has already passed this year, assume ${currentYear + 1}.

If this email IS event-worthy, respond with this JSON (no markdown, no extra text):
{
  "isEvent": true,
  "title": "short event title",
  "description": "1-2 sentence description",
  "date": "YYYY-MM-DDTHH:mm:ss.000Z",
  "endDate": "YYYY-MM-DDTHH:mm:ss.000Z",
  "timeDisplay": "exact time range from email e.g. 5:00 PM - 7:00 PM",
  "location": "venue or TBD",
  "badge": "UPCOMING",
  "icon": "single emoji",
  "color": "#hexcode",
  "category": "one of: clubs | interviews | mess | google_classroom | lost_found | academic | general"
}

IMPORTANT for endDate:
- If a time range is given (e.g. "5 PM - 7 PM"), set endDate to the end time.
- If only a start time is given, set endDate to 1 hour after the start.
- If it's a deadline, set endDate to 30 minutes after the deadline time.
- endDate must ALWAYS be after date.

If this email is NOT event-worthy, respond with exactly:
{ "isEvent": false }

Category guide:
- "clubs" — club events, fests, cultural activities, hackathons, workshops by student clubs
- "interviews" — placement drives, internship interviews, HR notices, job opportunities
- "mess" — mess menu, food notices, canteen updates, dining schedules
- "google_classroom" — Google Classroom announcements, assignment deadlines, course notices
- "lost_found" — lost and found notices, missing items
- "academic" — exams, timetables, academic deadlines, faculty notices, lab submissions
- "general" — anything else campus-related that doesn't fit above

Icon guide: 💻 tech/hackathon, 🎤 talk/seminar, 🏆 competition, 🎭 cultural/fest, 📚 academic, 💼 placement/interview, 🛠️ workshop, 🎉 social, 📅 general, ⚽ sports, 🏏 cricket, 🏀 basketball, 🎾 tennis, 🏐 volleyball
Color guide: "#6366F1" tech, "#F59E0B" cultural, "#10B981" sports/health, "#3B82F6" academic, "#EC4899" social, "#F97316" placement/career
`;

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                max_tokens: 600,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            }
        );

        const text = (response.data as any).choices[0].message.content.trim();
        const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(clean);

        if (!parsed.isEvent) return null;

        const validCategories = ['clubs', 'interviews', 'mess', 'google_classroom', 'lost_found', 'academic', 'general'];

        // Parse and validate the date — ensure time is embedded
        let eventDate = new Date(parsed.date);
        if (isNaN(eventDate.getTime())) {
            eventDate = new Date(Date.now() + 86400000); // fallback: tomorrow
        }

        // If the AI returned midnight and there's a timeDisplay, apply the time
        if (eventDate.getHours() === 0 && eventDate.getMinutes() === 0 && parsed.timeDisplay && parsed.timeDisplay !== 'TBD') {
            const appliedDate = applyTimeDisplayToDate(eventDate, parsed.timeDisplay);
            if (appliedDate) eventDate = appliedDate;
        }

        // Build timeDisplay — use endDate if provided for a proper range
        let timeDisplay = parsed.timeDisplay || 'TBD';
        if (parsed.endDate && timeDisplay === 'TBD') {
            const startD = eventDate;
            const endD = new Date(parsed.endDate);
            if (!isNaN(endD.getTime())) {
                timeDisplay = `${formatTime12h(startD)} - ${formatTime12h(endD)}`;
            }
        }
        return {
            title: parsed.title || subject || 'Untitled Event',
            description: parsed.description || '',
            date: eventDate,
            timeDisplay,
            location: parsed.location || 'TBD',
            badge: parsed.badge === 'LIVE' ? 'LIVE' : 'UPCOMING',
            icon: parsed.icon || '📅',
            color: parsed.color || '#CCF900',
            category: validCategories.includes(parsed.category) ? parsed.category : 'general',
        };
    } catch (err) {
        console.error('[EmailParser] Groq failed, using regex fallback:', (err as Error).message);
        return smartRegexParse(subject, body);
    }
}

/**
 * Format a Date into "h:mm AM/PM"
 */
function formatTime12h(d: Date): string {
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m < 10 ? '0' + m : m} ${ampm}`;
}

/**
 * Applies a timeDisplay string (like "5:00 PM" or "3:00 PM - 5:00 PM") to a date.
 * Returns a new Date with the time set, or null on failure.
 */
function applyTimeDisplayToDate(baseDate: Date, timeDisplay: string): Date | null {
    const timeMatch = timeDisplay.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
    if (!timeMatch) return null;

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2] || '0');
    const period = timeMatch[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const result = new Date(baseDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
}

/**
 * Smart regex-based fallback when Groq is unavailable.
 * Now extracts BOTH start and end times, and embeds time into the date.
 * Returns null if the email has no event-like keywords.
 */
function smartRegexParse(subject: string, body: string): ParsedEvent | null {
    const text = `${subject} ${body}`;
    const lc = text.toLowerCase();

    // Must contain at least one event-like keyword
    const eventKeywords = /\b(event|workshop|seminar|webinar|talk|lecture|hackathon|fest|festival|competition|contest|deadline|submission|registration|form|attend|participate|invite|rsvp|club|society|orientation|induction|placement|interview|internship|scholarship|opportunity|campus|notice|reminder|session|bootcamp|training|tournament|match|fixture|game|practice|tryout|meeting|exam|quiz|test|lab)\b/i;
    if (!eventKeywords.test(lc)) return null;

    // --- Extract TIME RANGE (e.g. "5:00 PM - 7:00 PM", "10 AM to 12 PM") ---
    const timeRangeMatch = text.match(
        /(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))\s*[-–—to]+\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))/i
    );

    let timeDisplay = 'TBD';
    let startTimeStr: string | null = null;
    let endTimeStr: string | null = null;

    if (timeRangeMatch) {
        startTimeStr = timeRangeMatch[1].trim();
        endTimeStr = timeRangeMatch[2].trim();
        timeDisplay = `${normalizeTimeStr(startTimeStr)} - ${normalizeTimeStr(endTimeStr)}`;
    } else {
        // --- Extract SINGLE TIME (e.g. "at 5:00 PM", "by 11:59 PM") ---
        const singleTimeMatch = text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))\b/i);
        if (singleTimeMatch) {
            startTimeStr = singleTimeMatch[1].trim();
            timeDisplay = normalizeTimeStr(startTimeStr);

            // Check if this is a deadline — append "(Deadline)" to timeDisplay
            if (/deadline|due|submit|last date|due date|before|by/i.test(lc)) {
                timeDisplay += ' (Deadline)';
            }
        }
    }

    // --- Extract LOCATION ---
    const locationMatch = text.match(
        /(?:at|in|venue[:\s]+|location[:\s]+|room[:\s]+|held at|ground|court)\s+([A-Za-z0-9\s\-,]+?)(?:\.|,|\n|for|on|at \d|$)/i
    ) || text.match(/\b(LT[-\s]?\d+|(?:Lecture|Lab|Hall|Room|Auditorium|Seminar)\s*[-\s]?\w+|SAC|Main Building|OAT|(?:squash|tennis|basketball|volleyball)\s*court|(?:cricket|football|hockey)\s*(?:ground|field))\b/i);
    const location = locationMatch ? locationMatch[1].trim() : 'TBD';

    // --- Extract DATE ---
    const months = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
    const dateMatch = text.match(new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${months}),?\\s*(\\d{4})?`, 'i'))
        || text.match(new RegExp(`(${months})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s*(\\d{4})?`, 'i'))
        || text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);

    let date = new Date(Date.now() + 86400000); // default: tomorrow
    if (dateMatch) {
        const parsed = new Date(dateMatch[0]);
        if (!isNaN(parsed.getTime())) date = parsed;
    }

    // --- Apply extracted time TO the date ---
    if (startTimeStr) {
        const normalized = normalizeTimeStr(startTimeStr);
        const applied = applyTimeDisplayToDate(date, normalized);
        if (applied) date = applied;
    } else {
        // No time found — set to 9 AM by default
        date.setHours(9, 0, 0, 0);
    }

    // --- Pick ICON based on keywords ---
    let icon = '📅';
    if (/hackathon|code|coding|dev|software/i.test(lc)) icon = '💻';
    else if (/fest|festival|cultural|dance|music|sing|perform/i.test(lc)) icon = '🎭';
    else if (/talk|lecture|speaker|seminar|keynote/i.test(lc)) icon = '🎤';
    else if (/competition|compete|contest|prize|award|winner/i.test(lc)) icon = '🏆';
    else if (/cricket/i.test(lc)) icon = '🏏';
    else if (/basketball/i.test(lc)) icon = '🏀';
    else if (/tennis/i.test(lc)) icon = '🎾';
    else if (/football|soccer/i.test(lc)) icon = '⚽';
    else if (/sport|game|tournament|match|fixture/i.test(lc)) icon = '🏆';
    else if (/workshop|learn|training|bootcamp/i.test(lc)) icon = '🛠️';
    else if (/party|celebrat|social|hangout/i.test(lc)) icon = '🎉';
    else if (/interview|placement|intern/i.test(lc)) icon = '💼';
    else if (/exam|quiz|test|assignment|submission|deadline/i.test(lc)) icon = '📚';

    // --- Pick COLOR based on keywords ---
    let color = '#CCF900';
    if (/hackathon|tech|code|dev|software/i.test(lc)) color = '#6366F1';
    else if (/cultural|fest|art|music|dance/i.test(lc)) color = '#F59E0B';
    else if (/sport|game|tournament|match|cricket|football|basketball|tennis/i.test(lc)) color = '#10B981';
    else if (/talk|lecture|seminar|academic|exam|quiz/i.test(lc)) color = '#3B82F6';
    else if (/interview|placement|intern|career/i.test(lc)) color = '#F97316';

    // --- Pick CATEGORY based on keywords ---
    let category: EventCategory = 'general';
    if (/club|society|fest|cultural|hackathon|workshop|induction|orientation/i.test(lc)) category = 'clubs';
    else if (/interview|placement|internship|hr|job|recruit|offer|aptitude/i.test(lc)) category = 'interviews';
    else if (/mess|menu|canteen|food|dining|lunch|dinner|breakfast/i.test(lc)) category = 'mess';
    else if (/classroom\.google|google classroom|assignment|class announcement/i.test(lc)) category = 'google_classroom';
    else if (/lost|found|missing|misplaced/i.test(lc)) category = 'lost_found';
    else if (/exam|timetable|schedule|submission|deadline|lab|academic|faculty|course/i.test(lc)) category = 'academic';

    return {
        title: subject || 'Untitled Event',
        description: body.slice(0, 3000),
        date,
        timeDisplay,
        location,
        badge: 'UPCOMING',
        icon,
        color,
        category,
    };
}

/**
 * Normalizes a time string like "5 PM" to "5:00 PM", "10AM" to "10:00 AM"
 */
function normalizeTimeStr(t: string): string {
    return t
        .replace(/(\d{1,2})\s*(AM|PM)/i, '$1:00 $2')  // "5 PM" → "5:00 PM"
        .replace(/(\d{1,2}):(\d{2})(AM|PM)/i, '$1:$2 $3')  // "5:30PM" → "5:30 PM"
        .trim();
}
