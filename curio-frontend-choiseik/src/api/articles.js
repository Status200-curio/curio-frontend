// src/api/articles.js
import apiClient from './client';

/**
 * 기사(뉴스 피드), 검색, 피드백, 북마크 관련 API 호출을 모아둔 모듈입니다.
 */
export const articlesApi = {
  // 1. 메인 뉴스 피드 목록 조회 (UC-03)
  // params 예시: { category: 'ai', sort: 'relevance_score', page: 1 }
  getFeed: async (params) => {
    const response = await apiClient.get('/api/articles', { params });
    return response.data;
  },

  // 2. 실시간 기사 검색 (UC-04)
  searchArticles: async (keyword) => {
    const response = await apiClient.get('/api/articles/search', { params: { q: keyword } });
    return response.data;
  },

  // 3. 기사 좋아요/싫어요 피드백 남기기 (UC-06, user_article_interactions 테이블 연동)
  // feedbackType: 'like' | 'dislike' | 'cancel'
  sendFeedback: async (articleId, feedbackType) => {
    const response = await apiClient.post(`/api/articles/${articleId}/feedback`, { type: feedbackType });
    return response.data;
  },

  // 4. 북마크 추가 (UC-05, bookmarks 및 bookmark_tags 테이블 연동)
  addBookmark: async (articleId, tags = []) => {
    const response = await apiClient.post('/api/bookmarks', { article_id: articleId, tags });
    return response.data;
  },

  // 5. 북마크 삭제 (UC-05A)
  removeBookmark: async (bookmarkId) => {
    const response = await apiClient.delete(`/api/bookmarks/${bookmarkId}`);
    return response.data;
  },

  // 6. 북마크 목록 조회 (태그 필터링 포함)
  getBookmarks: async (tag = null) => {
    const params = tag && tag !== '전체' ? { tag } : {};
    const response = await apiClient.get('/api/bookmarks', { params });
    return response.data;
  },

  // 7. 기사 열람 기록 저장 (클릭 패턴 학습 용도, article_view 테이블 연동)
  recordView: async (articleId, dwellTimeSeconds) => {
    const response = await apiClient.post(`/api/articles/${articleId}/view`, { dwell_time_seconds: dwellTimeSeconds });
    return response.data;
  },

  // 8. 읽은 기사 목록(히스토리) 조회 (UC-10)
  getHistory: async () => {
    const response = await apiClient.get('/api/history');
    return response.data;
  }
};