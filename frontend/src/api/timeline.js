import client from './client';

export const fetchTimeline = async (payload) => {
  const { data } = await client.post('/timeline', payload);
  return data;
};

export const fetchTimelineStory = async (locationId) => {
  const { data } = await client.get(`/timeline/${locationId}/story`);
  return data;
};

export const fetchFilteredEvents = async (locationId, params = {}) => {
  const { data } = await client.get('/events', {
    params: { locationId, ...params },
  });
  return data;
};

export const fetchViewportEvents = async (bbox) => {
  const { data } = await client.get('/events/viewport', {
    params: bbox, // { north, south, east, west }
  });
  return data;
};

export const compareLocations = async (location1, location2) => {
  const { data } = await client.get('/compare', {
    params: { location1, location2 },
  });
  return data;
};

export const fetchTrends = async (locationId) => {
  const { data } = await client.get(`/trends/${locationId}`);
  return data;
};
