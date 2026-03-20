import client from './client';

/**
 * Fetches all smart inbox categories from MongoDB
 * This will return your 7 categories: Interviews, Club events, etc.
 */
export const getAllCategories = async () => {
  const res = await client.get('/categories');
  return res.data;
};

/**
 * Optional: Fetch a specific category by its ID
 */
export const getCategoryById = async (categoryId: number) => {
  const res = await client.get(`/categories/${categoryId}`);
  return res.data;
};