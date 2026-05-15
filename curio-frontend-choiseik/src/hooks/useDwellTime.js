// src/hooks/useDwellTime.js
import { useRef, useEffect } from 'react';

/**
 * 컴포넌트가 렌더링되어 있는 동안의 '실제 활성 체류 시간'을 측정하는 커스텀 훅
 * @param {Function} onUnmount - 컴포넌트가 닫힐 때 체류 시간(초)을 전달받아 실행할 콜백 함수
 */
export function useDwellTime(onUnmount) {
  const totalDwellTime = useRef(0); // 총 누적 체류 시간 (밀리초)
  const startTime = useRef(Date.now()); // 현재 활성 세션의 시작 시간
  const isTracking = useRef(true); // 현재 추적 중인지 여부

  useEffect(() => {
    // 탭 이동, 브라우저 최소화 등을 감지하는 함수
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 화면이 숨겨지면 지금까지의 시간을 누적하고 추적 중지
        if (isTracking.current) {
          totalDwellTime.current += Date.now() - startTime.current;
          isTracking.current = false;
        }
      } else {
        // 화면으로 다시 돌아오면 시작 시간을 갱신하고 추적 재개
        if (!isTracking.current) {
          startTime.current = Date.now();
          isTracking.current = true;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 컴포넌트가 언마운트(닫힘) 될 때 실행
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // 마지막으로 보고 있던 시간까지 합산
      if (isTracking.current) {
        totalDwellTime.current += Date.now() - startTime.current;
      }
      
      // 밀리초를 초 단위로 변환하여 콜백 함수 실행 (소수점 버림)
      const finalTimeInSeconds = Math.floor(totalDwellTime.current / 1000);
      
      // 체류 시간이 1초 이상일 때만 기록을 전송
      if (finalTimeInSeconds > 0 && onUnmount) {
        onUnmount(finalTimeInSeconds);
      }
    };
  }, [onUnmount]);

  return null;
}