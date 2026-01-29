import api from './client'; // Import the file you just fixed above

export const getUserProfile = async () => {
  try {
    // Uses the shared client with the Token logic automatically included
    const response = await api.get('/api/users/me'); 
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};