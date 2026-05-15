// src/api/articles.js
import apiClient from './client';

// ── 토픽별 대표 이미지 (기사별 image_url 없을 때 fallback) ───────────────────
export const TOPIC_IMAGES = {
  ai:       'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800',
  economy:  'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=800',
  sports:   'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=800',
  politics: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&q=80&w=800',
  science:  'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=800',
  health:   'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800',
  world:    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
  society:  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800',
  culture:  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800',
  entertain:'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800',
};
export const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800';

/**
 * 기사(뉴스 피드), 검색, 피드백, 북마크 관련 API 호출을 모아둔 모듈입니다.
 */
export const articlesApi = {
  // 1. 메인 뉴스 피드 목록 조회
  getFeed: async (params) => {
    try {
      const response = await apiClient.get('/api/news/feed', { params });

      const raw = response.data?.data ?? {};
      const articles = (raw.articles ?? []).map(a => ({
        ...a,
        // 백엔드 필드명 → 프론트 필드명
        ai_summary: a.summary ?? null,
        ai_insight: a.insight ?? null,
        source: { name: a.source_name, url: a.original_url },
        // 기사별 이미지 우선, 없으면 topic별 대표 이미지로 fallback
        thumbnail_url: a.thumbnail_url || a.image_url || TOPIC_IMAGES[a.topic] || DEFAULT_IMAGE,
      }));
      // has_next는 data.pagination.has_next 하위에 있음
      const has_next = raw.pagination?.has_next ?? raw.has_next ?? false;
      return { data: { articles, has_next } };
    } catch (error) {
      console.error('[feedApi] 요청 실패:', error.response?.status, error.response?.data ?? error.message);
      throw error;
    }
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

  // 4. 북마크 저장/해제 (POST 한 번으로 토글)
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

  // 7. 기사 열람 기록 저장 (체류 시간 — 백엔드 query param: dwell_time_seconds)
  recordView: async (articleId, dwellTimeSeconds = 0) => {
    const response = await apiClient.post(
      `/api/news/${articleId}/view`,
      null,
      { params: { dwell_time_seconds: dwellTimeSeconds } }
    );
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

  // 12. 카테고리 목록
  getCategories: async () => {
    const response = await apiClient.get('/api/news/categories');
    return response.data;
  },

  // 13. 기사 TTS 오디오 (Blob URL 반환)
  getAudio: async (articleId) => {
    const response = await apiClient.get(`/api/news/${articleId}/audio`, { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  },
};
