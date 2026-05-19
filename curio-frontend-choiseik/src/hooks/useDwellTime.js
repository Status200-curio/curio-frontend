// src/hooks/useDwellTime.js
import { useRef, useEffect } from 'react';

const MIN_SECONDS = 3;     // 3초 미만은 오탐으로 간주해 제외
const MAX_SECONDS = 1800;  // 30분 초과는 자리비움으로 캡

/**
 * setInterval(1초) 기반 체류 시간 측정 훅.
 *
 * ─ 측정 방식: 1초마다 카운터를 증가 → ms 오차 없이 정수 초 누적
 * ─ 탭 전환: visibilitychange hidden → interval 정지, visible → 재개
 * ─ 창 강제 종료: beforeunload → sendBeacon(keepalive) 로 즉시 전송
 * ─ 모달 닫힘: useEffect cleanup → 남은 시간 전송
 */
export function useDwellTime(articleId) {
  const secondsRef    = useRef(0);    // 누적 초 카운터
  const intervalRef   = useRef(null); // setInterval ID
  const articleIdRef  = useRef(null); // cleanup 클로저에서 최신 articleId 접근

  useEffect(() => {
    if (!articleId) return;

    // 새 기사 → 카운터 초기화
    secondsRef.current   = 0;
    articleIdRef.current = articleId;

    // ── 인터벌 시작/정지 헬퍼 ──────────────────────────────
    const startInterval = () => {
      if (intervalRef.current) return; // 중복 방지
      intervalRef.current = setInterval(() => {
        secondsRef.current += 1;
      }, 1000);
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // 탭이 이미 숨겨진 상태로 열릴 수도 있으므로 체크
    if (!document.hidden) {
      startInterval();
    }

    // ── 탭 전환 / 창 최소화 처리 ───────────────────────────
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval();
      } else {
        startInterval();
      }
    };

    // ── 창 강제 종료 시 즉시 전송 ──────────────────────────
    const handleBeforeUnload = () => {
      stopInterval();
      const seconds = clamp(secondsRef.current);
      if (seconds >= MIN_SECONDS) {
        sendDwellTime(articleIdRef.current, seconds);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // ── 컴포넌트 언마운트(모달 닫힘) 시 전송 ──────────────
    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      const seconds = clamp(secondsRef.current);
      if (seconds >= MIN_SECONDS) {
        sendDwellTime(articleId, seconds);
      }
    };
  // articleId 바뀌면 이전 기사 전송 후 새 기사 측정 시작
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);
}

function clamp(seconds) {
  return Math.min(seconds, MAX_SECONDS);
}

/**
 * fetch keepalive 로 전송.
 * keepalive:true → 창 닫힘 직후에도 브라우저가 요청을 완료시켜 줌.
 * (sendBeacon은 Authorization 헤더 미지원 → fetch 사용)
 */
function sendDwellTime(articleId, seconds) {
  if (!articleId) return;
  const token = localStorage.getItem('curio_access_token');
  // 백엔드 파라미터명: duration_seconds (query parameter)
  const url = `/api/news/${articleId}/view?duration_seconds=${seconds}`;
  try {
    fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).catch(() => {});
  } catch {
    // 동기 예외 무시
  }
}
