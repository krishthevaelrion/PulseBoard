import api from './client';
import client from './client';

export const toggleFollowClubApi = (clubId: number) => {
  return client.post(`/clubs/follow/${clubId}`);
};

export const getClubById = async (clubId: number) => {
  const res = await client.get(`/clubs/${clubId}`);
  return res.data;
};

export const getAllClubs = async () => {
  const res = await client.get('/clubs');
  return res.data;
};
