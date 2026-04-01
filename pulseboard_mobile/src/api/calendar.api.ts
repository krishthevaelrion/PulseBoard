import client from "./client";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  category: string;
  location: string;
  timeDisplay: string;
  icon: string;
  color: string;
  badge: "LIVE" | "UPCOMING";
  sourceFrom: string;
  sourceSubject: string;
}

/**
 * Fetches real calendar events parsed from the user's classified emails.
 * Requires authentication (JWT token).
 * Optionally filter by category name or date range.
 */
export const getCalendarEvents = async (
  category?: string,
  from?: string,
  to?: string
): Promise<CalendarEvent[]> => {
  try {
    const params: Record<string, string> = {};
    if (category) params.category = category;
    if (from) params.from = from;
    if (to) params.to = to;

    const res = await client.get("/calendar/events", { params });
    return res.data;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return [];
  }
};

/**
 * Fetches mock calendar events for UI testing.
 * Does not require authentication.
 */
export const getMockCalendarEvents = async (): Promise<CalendarEvent[]> => {
  try {
    const res = await client.get("/calendar/mock");
    return res.data;
  } catch (error) {
    console.error("Error fetching mock calendar events:", error);
    return [];
  }
};
