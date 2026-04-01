import * as chrono from "chrono-node";

/**
 * Represents a parsed calendar event extracted from an email.
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601 string
  end: string;   // ISO 8601 string
  category: string;
}

/**
 * Maps numeric categoryId to a human-readable category name.
 * Extend this map as you add categories in your DB.
 */
const CATEGORY_ID_MAP: Record<number, string> = {
  101: "interviews",
  102: "fests",
  103: "miscellaneous",
  104: "academics",
  105: "admin",
  106: "hostel",
  107: "clubs",
  108: "placements",
};

/**
 * Takes a raw email body text and its category, then extracts
 * the actual date/time to produce a CalendarEvent object.
 *
 * Uses `chrono-node` for robust NLP date parsing.
 * Fallback: if no end time is found, defaults to startTime + 1 hour.
 * If no date is found at all, returns null.
 *
 * @param emailId   - Unique identifier for the email (e.g. Mongo _id)
 * @param subject   - Email subject line (used as event title)
 * @param body      - Raw email body text
 * @param categoryId - Numeric category from PulseBoard's classifier
 * @param referenceDate - Optional reference date for parsing context (defaults to now)
 * @returns CalendarEvent | null
 */
export function parseEmailToEvent(
  emailId: string,
  subject: string,
  body: string,
  categoryId: number,
  referenceDate?: Date
): CalendarEvent | null {
  const refDate = referenceDate || new Date();
  const textToParse = `${subject} ${body}`;

  // Use chrono to parse all date/time references
  const results = chrono.parse(textToParse, refDate, { forwardDate: true });

  if (results.length === 0) {
    return null; // No date found in the email
  }

  // Take the first (most prominent) parsed result
  const parsed = results[0];

  const startDate = parsed.start.date();

  // Determine end date:
  // 1. If chrono found an explicit end → use it
  // 2. Otherwise → startTime + 1 hour (fallback)
  let endDate: Date;
  if (parsed.end) {
    endDate = parsed.end.date();
  } else {
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour
  }

  // Resolve category name
  const category =
    CATEGORY_ID_MAP[categoryId] ||
    CATEGORY_ID_MAP[103]; // fallback to "miscellaneous"

  return {
    id: emailId,
    title: subject,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    category: category,
  };
}

/**
 * Batch processor: takes an array of mail documents (from MongoDB)
 * and returns a filtered list of CalendarEvents for mails that
 * contain parseable date/time information.
 *
 * @param mails - Array of mail documents from DB 
 *                (each must have: _id, subject, body, categoryId)
 * @param referenceDate - Optional reference date for parsing
 * @returns CalendarEvent[]
 */
export function parseMailsToCalendarEvents(
  mails: Array<{
    _id: string;
    subject: string;
    body: string;
    categoryId: number;
  }>,
  referenceDate?: Date
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const mail of mails) {
    const event = parseEmailToEvent(
      mail._id.toString(),
      mail.subject,
      mail.body,
      mail.categoryId,
      referenceDate
    );

    if (event) {
      events.push(event);
    }
  }

  return events;
}
