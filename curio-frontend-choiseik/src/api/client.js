// src/api/client.js
import axios from 'axios';

// API 명세서에 명시된 Base URL (FastAPI 백엔드 개발 환경)
const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// [요청 인터셉터] 모든 API 요청을 보낼 때 로컬 스토리지의 토큰을 헤더에 자동 추가
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('curio_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// [응답 인터셉터] 401(토큰 만료) 에러 발생 시 토큰 자동 갱신
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고, 재시도한 적이 없는 요청일 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('curio_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post('http://localhost:8000/api/auth/refresh', {
            refresh_token: refreshToken,
          });
          
          const newAccessToken = res.data.data.access_token;
          localStorage.setItem('curio_access_token', newAccessToken);
          
          // 새 토큰으로 헤더 교체 후 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // 리프레시 토큰 만료 시 강제 로그아웃
          localStorage.removeItem('curio_access_token');
          localStorage.removeItem('curio_refresh_token');
          window.location.href = '/'; 
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;