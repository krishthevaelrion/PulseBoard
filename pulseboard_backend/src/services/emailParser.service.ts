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
 * Uses Gemini AI to:
 * 1. Decide if the email is event-worthy for a college student
 * 2. If yes, parse it into structured event data
 *
 * Returns null if the email is NOT event-worthy (spam, OTPs, promotions, etc.)
 */
export async function parseEventFromEmail(
    subject: string,
    body: string
): Promise<ParsedEvent | null> {
    const prompt = `
You are an AI assistant for PulseBoard, a college student productivity app.

Analyse this email and decide if it represents something actionable or important for a college student — such as:
- A club event, fest, or cultural activity
- An interview, internship, or placement notice
- A deadline, submission, or academic requirement
- A workshop, hackathon, seminar, or talk
- A scholarship or opportunity with a deadline
- Any campus notice that requires attention or attendance

Do NOT treat as events: OTPs, password resets, promotional marketing emails, newsletters with no specific date/deadline, order confirmations, social media notifications, or general spam.

Subject: ${subject}
Body: ${body.slice(0, 2000)}

If this email IS event-worthy, respond with this JSON (no markdown, no extra text):
{
  "isEvent": true,
  "title": "short event title",
  "description": "1-2 sentence description",
  "date": "2026-MM-DDTHH:mm:ss.sssZ",
  "timeDisplay": "6:00 PM or TBD",
  "location": "venue or TBD",
  "badge": "UPCOMING",
  "icon": "single emoji",
  "color": "#hexcode",
  "category": "one of: clubs | interviews | mess | google_classroom | lost_found | academic | general"
}

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

Icon guide: 💻 tech/hackathon, 🎤 talk/seminar, 🏆 competition, 🎭 cultural/fest, 📚 academic, 💼 placement/interview, 🛠️ workshop, 🎉 social, 📅 general
Color guide: "#6366F1" tech, "#F59E0B" cultural, "#10B981" sports/health, "#3B82F6" academic, "#EC4899" social, "#F97316" placement/career
`;

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                max_tokens: 500,
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
        return {
            title: parsed.title || subject || 'Untitled Event',
            description: parsed.description || '',
            date: new Date(parsed.date) || new Date(Date.now() + 86400000),
            timeDisplay: parsed.timeDisplay || 'TBD',
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
 * Smart regex-based fallback when Gemini is unavailable.
 * Returns null if the email has no event-like keywords (filters spam/OTPs/alerts).
 */
function smartRegexParse(subject: string, body: string): ParsedEvent | null {
    const text = `${subject} ${body}`;
    const lc = text.toLowerCase();

    // Must contain at least one event-like keyword to be treated as an event
    const eventKeywords = /\b(event|workshop|seminar|webinar|talk|lecture|hackathon|fest|festival|competition|contest|deadline|submission|registration|form|attend|participate|invite|rsvp|club|society|orientation|induction|placement|interview|internship|scholarship|opportunity|campus|notice|reminder|session|bootcamp|training)\b/i;
    if (!eventKeywords.test(lc)) return null;

    // --- Extract TIME ---
    const timeMatch = text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))\b/);
    const timeDisplay = timeMatch ? timeMatch[1].trim() : 'TBD';

    // --- Extract LOCATION ---
    const locationMatch = text.match(
        /(?:at|in|venue[:\s]+|location[:\s]+|room[:\s]+|held at)\s+([A-Za-z0-9\s\-,]+?)(?:\.|,|\n|for|on|at \d|$)/i
    ) || text.match(/\b(LT[-\s]?\d+|(?:Lecture|Lab|Hall|Room|Auditorium|Seminar)\s*[-\s]?\w+|SAC|Main Building|OAT)\b/i);
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

    // --- Pick ICON based on keywords ---
    let icon = '📅';
    if (/hackathon|code|coding|dev|software/i.test(lc)) icon = '💻';
    else if (/fest|festival|cultural|dance|music|sing|perform/i.test(lc)) icon = '🎭';
    else if (/talk|lecture|speaker|seminar|keynote/i.test(lc)) icon = '🎤';
    else if (/competition|compete|contest|prize|award|winner/i.test(lc)) icon = '🏆';
    else if (/sport|cricket|football|basketball|game|tournament/i.test(lc)) icon = '⚽';
    else if (/workshop|learn|training|bootcamp/i.test(lc)) icon = '🛠️';
    else if (/party|celebrat|social|hangout/i.test(lc)) icon = '🎉';

    // --- Pick COLOR based on keywords ---
    let color = '#CCF900';
    if (/hackathon|tech|code|dev|software/i.test(lc)) color = '#6366F1';
    else if (/cultural|fest|art|music|dance/i.test(lc)) color = '#F59E0B';
    else if (/sport|game|tournament/i.test(lc)) color = '#10B981';
    else if (/talk|lecture|seminar/i.test(lc)) color = '#3B82F6';

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
