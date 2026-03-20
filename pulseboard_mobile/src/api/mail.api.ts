import client from './client';

export const getMailsByCategory = async (categoryId: number) => {
  try {
    const res = await client.get(`/mails/category/${categoryId}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching mails:", error);
    return [];
  }
};