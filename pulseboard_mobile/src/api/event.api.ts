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
 */
export const fetchEventsByClub = async (clubId: number) => {
  try {
    const response = await api.get(`/events/club/${clubId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching events for club ${clubId}:`, error);
    return [];
  }
};

/**
 * Create a new event in MongoDB
 * Matches your POST /api/events route
 */
export const createEventApi = async (eventData: any) => {
  try {
    const response = await api.post('/events', eventData);
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};