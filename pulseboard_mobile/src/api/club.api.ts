import client from './client';

export const toggleFollowClubApi = (clubId: number) => {
  return client.post(`/api/clubs/follow/${clubId}`);
};