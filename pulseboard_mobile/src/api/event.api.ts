import api from './client';

/**
 * Get the global feed of all LIVE and UPCOMING events
 */
export const getEventFeed = async () => {
  try {
    const response = await api.get('/events/feed');
    return response.data;
  } catch (error) {
    console.error('Error fetching event feed:', error);
    throw error;
  }
};

/**
 * Get events specifically for one club
 * Matches the backend route: GET /api/events/club/:clubId
 */
export const fetchEventsByClub = async (clubId: number) => {
  try {
    // We use the 'api' client which already handles your base URL and headers
    const response = await api.get(`/events/club/${clubId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching events for club ${clubId}:`, error);
    // Return an empty array so the UI doesn't crash
    return [];
  }
};