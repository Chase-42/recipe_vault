"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTimer } from "react-timer-hook";
import { startBeeping } from "~/utils/beep";

function expiryFromNow(totalSeconds: number): Date {
  return new Date(Date.now() + totalSeconds * 1000);
}

export function useRecipeTimer() {
  const [selectedSeconds, setSelectedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const stopBeepingRef = useRef<(() => void) | null>(null);

  const requestWakeLock = useCallback(async () => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch {
      // Not available or denied — fail silently
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (!wakeLockRef.current) return;
    try {
      await wakeLockRef.current.release();
    } catch {
      // Ignore
    }
    wakeLockRef.current = null;
  }, []);

  const stopBeeping = useCallback(() => {
    stopBeepingRef.current?.();
    stopBeepingRef.current = null;
  }, []);

  // Use a ref so onExpire never goes stale inside useTimer
  const onExpireRef = useRef<() => void>();
  onExpireRef.current = () => {
    setIsDone(true);
    stopBeepingRef.current = startBeeping();
    void releaseWakeLock();
  };

  const { seconds, minutes, hours, isRunning, restart, pause: timerPause, resume: timerResume } =
    useTimer({
      expiryTimestamp: expiryFromNow(24 * 60 * 60), // safe sentinel — never auto-expires
      autoStart: false,
      onExpire: () => onExpireRef.current?.(),
    });

  // Re-acquire WakeLock when tab becomes visible while timer is running
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isRunning) {
        void requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isRunning, requestWakeLock]);

  // Stop beeping if the component unmounts while alarm is going
  useEffect(() => {
    return () => stopBeepingRef.current?.();
  }, []);

  const start = useCallback(
    (totalSeconds: number) => {
      stopBeeping();
      setSelectedSeconds(totalSeconds);
      setIsDone(false);
      setIsPaused(false);
      restart(expiryFromNow(totalSeconds), true);
      void requestWakeLock();
    },
    [restart, requestWakeLock, stopBeeping]
  );

  const pause = useCallback(() => {
    setIsPaused(true);
    timerPause();
    void releaseWakeLock();
  }, [timerPause, releaseWakeLock]);

  const resume = useCallback(() => {
    setIsPaused(false);
    timerResume();
    void requestWakeLock();
  }, [timerResume, requestWakeLock]);

  const reset = useCallback(() => {
    stopBeeping();
    setIsDone(false);
    setIsPaused(false);
    restart(expiryFromNow(selectedSeconds), false);
    void releaseWakeLock();
  }, [restart, releaseWakeLock, selectedSeconds, stopBeeping]);

  // When idle, reflect the selected preset so the display shows what's queued
  const isIdle = !isRunning && !isPaused && !isDone;
  const displayMinutes = isIdle ? Math.floor(selectedSeconds / 60) : minutes;
  const displaySeconds = isIdle ? selectedSeconds % 60 : seconds;

  return {
    minutes: displayMinutes,
    seconds: displaySeconds,
    hours,
    isRunning,
    isPaused,
    isDone,
    selectedSeconds,
    start,
    pause,
    resume,
    reset,
  };
}
