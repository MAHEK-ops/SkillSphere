import client from './client';

export const getBookmarks = async (userId) => {
  const { data } = await client.get(`/bookmarks/${userId}`);
  return data;
};

export const saveBookmark = async (payload) => {
  // payload: { userId, locationId, label? }
  const { data } = await client.post('/bookmarks', payload);
  return data;
};

export const deleteBookmark = async (bookmarkId, userId) => {
  const { data } = await client.delete(`/bookmarks/${bookmarkId}`, {
    data: { userId },
  });
  return data;
};
