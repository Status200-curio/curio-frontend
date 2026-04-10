// src/api/articles.js
import apiClient from './client';

/**
 * 기사(뉴스 피드), 검색, 피드백, 북마크 관련 API 호출을 모아둔 모듈입니다.
 * 경로 기준: API 명세서 v1.2
 */
export const articlesApi = {
  // 1. 메인 뉴스 피드 목록 조회
  // params 예시: { topics: 'ai,economy', sort: 'relevance', page: 1, limit: 10 }
  getFeed: async (params) => {
    const response = await apiClient.get('/api/news/feed', { params });
    return response.data;
  },

  // 2. 실시간 기사 검색
  searchArticles: async (keyword, page = 1) => {
    const response = await apiClient.get('/api/news/search', { params: { q: keyword, page, limit: 10 } });
    return response.data;
  },

  // 3. 기사 좋아요/싫어요 피드백 (feedback_type: 'like' | 'dislike' | 'cancel')
  sendFeedback: async (articleId, feedbackType) => {
    const response = await apiClient.post(`/api/news/${articleId}/feedback`, { feedback_type: feedbackType });
    return response.data;
  },

  // 4. 북마크 저장/해제 (POST 한 번으로 토글, tags 배열 선택)
  toggleBookmark: async (articleId, tags = []) => {
    const response = await apiClient.post(`/api/news/${articleId}/save`, { tags });
    return response.data;
  },

  // 5. 북마크 목록 조회 (태그 필터링 포함)
  getBookmarks: async (tag = null, page = 1) => {
    const params = { page, limit: 20, ...(tag && tag !== '전체' ? { tag } : {}) };
    const response = await apiClient.get('/api/news/saved', { params });
    return response.data;
  },

  // 6. 북마크 태그 수정 (전체 교체 방식)
  updateBookmarkTags: async (bookmarkId, tags) => {
    const response = await apiClient.patch(`/api/news/saved/${bookmarkId}/tags`, { tags });
    return response.data;
  },

  // 7. 기사 열람 기록 저장 (체류 시간 포함)
  recordView: async (articleId, dwellTimeSeconds) => {
    const response = await apiClient.post(`/api/news/${articleId}/view`, { dwell_time_seconds: dwellTimeSeconds });
    return response.data;
  },

  // 8. 읽은 기사 목록(히스토리) 조회
  getHistory: async (page = 1) => {
    const response = await apiClient.get('/api/user/history', { params: { page, limit: 20 } });
    return response.data;
  },

  // 9. 최근 검색어 목록 조회
  getRecentSearches: async () => {
    const response = await apiClient.get('/api/search/recent', { params: { limit: 10 } });
    return response.data;
  },

  // 10. 최근 검색어 저장
  saveRecentSearch: async (query) => {
    const response = await apiClient.post('/api/search/recent', { query });
    return response.data;
  },

  // 11. 최근 검색어 전체 삭제
  clearRecentSearches: async () => {
    const response = await apiClient.delete('/api/search/recent');
    return response.data;
  },
};