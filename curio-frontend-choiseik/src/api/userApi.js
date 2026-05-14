// src/api/userApi.js
import apiClient from './client';

export const userApi = {
  // 내 정보 조회 (preferences 포함)
  getMe: async () => {
    const response = await apiClient.get('/api/user/me');
    return response.data;
  },

  // 읽기 통계 조회
  getStats: async () => {
    const response = await apiClient.get('/api/user/stats');
    return response.data;
  },

  // 읽은 기사 히스토리
  getHistory: async (page = 1) => {
    const response = await apiClient.get('/api/user/history', { params: { page, limit: 20 } });
    return response.data;
  },

  // 관심사(preferences) 업데이트
  updatePreferences: async (data) => {
    const response = await apiClient.put('/api/user/preferences', data);
    return response.data;
  },

  // 출석 기록
  recordAttendance: async () => {
    const response = await apiClient.post('/api/user/attendance');
    return response.data;
  },

  // 주제 추천
  getRecommendations: async () => {
    const response = await apiClient.get('/api/user/recommendations');
    return response.data;
  },

  // 이번 주 많이 읽은 기사 TOP 3
  getTopReads: async () => {
    const response = await apiClient.get('/api/user/top-reads');
    return response.data;
  },
};
