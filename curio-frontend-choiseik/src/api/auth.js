// src/api/auth.js
import apiClient from './client';

/**
 * 인증 관련 API 호출을 모아둔 모듈입니다.
 */
export const authApi = {
  // 이메일 회원가입
  register: async (email, password, name) => {
    const response = await apiClient.post('/api/auth/register', { email, password, name });
    return response.data;
  },

  // 이메일 로그인
  login: async (email, password) => {
    const response = await apiClient.post('/api/auth/login', { email, password });
    return response.data;
  },

  // 비밀번호 재설정 이메일 요청
  requestPasswordReset: async (email) => {
    const response = await apiClient.post('/api/auth/password/forgot', { email });
    return response.data;
  },

  // 비밀번호 재설정 완료
  resetPassword: async (token, newPassword) => {
    const response = await apiClient.post('/api/auth/password/reset', { token, new_password: newPassword });
    return response.data;
  },

  // 로그아웃 (서버의 refresh_token 폐기용)
  logout: async () => {
    const response = await apiClient.post('/api/auth/logout');
    return response.data;
  }
};