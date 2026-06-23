"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { useRecipeTimer } from "~/hooks/useRecipeTimer";
import { cn } from "~/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

const PRESETS = [
  { label: "5m", seconds: 5 * 60 },
  { label: "10m", seconds: 10 * 60 },
  { label: "15m", seconds: 15 * 60 },
  { label: "20m", seconds: 20 * 60 },
  { label: "30m", seconds: 30 * 60 },
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const RING_R = 70;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

// ─── Sub-components ──────────────────────────────────────────────────────────

interface TimerRingProps {
  hours: number;
  isDone: boolean;
  isRunning: boolean;
  isPaused: boolean;
  hasSelection: boolean;
  displayTime: string;
  ringOffset: number;
}

function TimerRing({
  hours,
  isDone,
  isRunning,
  isPaused,
  hasSelection,
  displayTime,
  ringOffset,
}: TimerRingProps) {
  return (
    <div className="mb-4 flex justify-center">
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
          <circle
            cx={80}
            cy={80}
            r={RING_R}
            fill="none"
            strokeWidth={4}
            stroke="currentColor"
            className={cn(isDone ? "text-red-950" : "text-zinc-800")}
          />
          {hasSelection && (
            <circle
              cx={80}
              cy={80}
              r={RING_R}
              fill="none"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              stroke="currentColor"
              className={cn(
                "transition-[stroke-dashoffset] duration-1000 ease-linear",
                isDone
                  ? "text-red-500"
                  : isRunning
                    ? "text-white"
                    : "text-zinc-400"
              )}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "font-mono font-semibold tabular-nums leading-none tracking-tight",
              hours > 0 ? "text-2xl" : "text-3xl",
              isDone && "animate-pulse text-red-400",
              isRunning && "text-white",
              isPaused && "text-zinc-300",
              !isRunning && !isPaused && !isDone && hasSelection && "text-zinc-300",
              !hasSelection && "text-zinc-600"
            )}
          >
            {displayTime}
          </span>
        </div>
      </div>
    </div>
  );
}

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  isDone: boolean;
  hasSelection: boolean;
  selectedSeconds: number;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  start: (seconds: number) => void;
}

function TimerControls({
  isRunning,
  isPaused,
  isDone,
  hasSelection,
  selectedSeconds,
  pause,
  resume,
  reset,
  start,
}: TimerControlsProps) {
  return (
    <div className="flex gap-2">
      {isRunning && (
        <button
          type="button"
          onClick={pause}
          className="h-10 flex-1 rounded-lg bg-zinc-800 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          Pause
        </button>
      )}
      {isPaused && (
        <button
          type="button"
          onClick={resume}
          className="h-10 flex-1 rounded-lg bg-white text-sm font-medium text-black transition-colors hover:bg-zinc-100"
        >
          Resume
        </button>
      )}
      {(isRunning || isPaused || isDone) && (
        <button
          type="button"
          onClick={reset}
          className="h-10 flex-1 rounded-lg bg-zinc-800 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          Reset
        </button>
      )}
      {hasSelection && !isRunning && !isPaused && (
        <button
          type="button"
          onClick={() => start(selectedSeconds)}
          className="h-10 flex-1 rounded-lg bg-white text-sm font-medium text-black transition-colors hover:bg-zinc-100"
        >
          {isDone ? "Restart" : "Start"}
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RecipeTimer() {
  const [open, setOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const {
    minutes,
    seconds,
    hours,
    isRunning,
    isPaused,
    isDone,
    selectedSeconds,
    start,
    pause,
    resume,
    reset,
  } = useRecipeTimer();

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (
        Boolean(panelRef.current?.contains(e.target as Node)) ||
        Boolean(triggerRef.current?.contains(e.target as Node))
      )
        return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const hasSelection = selectedSeconds > 0;
  const displayTime =
    hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;

  const remainingSeconds = hours * 3600 + minutes * 60 + seconds;
  const progress = selectedSeconds > 0 ? remainingSeconds / selectedSeconds : 0;
  const ringOffset = RING_CIRCUMFERENCE * (1 - progress);
  const isActive = isRunning || isPaused;

  function handlePreset(s: number) {
    setCustomMinutes("");
    start(s);
  }

  function handleCustomStart() {
    const mins = parseInt(customMinutes, 10);
    if (!mins || mins <= 0) return;
    start(mins * 60);
    setCustomMinutes("");
  }

  return (
    <div className="relative">
      {open && (
        <div
          ref={panelRef}
          className="absolute left-0 top-full mt-2 w-72 rounded-xl bg-zinc-950 p-4 shadow-2xl shadow-black/60 ring-1 ring-white/10"
        >
          <TimerRing
            hours={hours}
            isDone={isDone}
            isRunning={isRunning}
            isPaused={isPaused}
            hasSelection={hasSelection}
            displayTime={displayTime}
            ringOffset={ringOffset}
          />

          {!isActive && !isDone && (
            <div className="mb-3 flex gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePreset(p.seconds)}
                  className={cn(
                    "flex-1 h-10 rounded-full text-sm font-medium transition-colors",
                    selectedSeconds === p.seconds
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {!isActive && !isDone && (
            <div className="mb-3 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  max={999}
                  placeholder="0"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustomStart()}
                  className="h-10 w-full rounded-lg bg-zinc-800 pl-3 pr-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                  min
                </span>
              </div>
              <button
                type="button"
                onClick={handleCustomStart}
                disabled={customMinutes.length === 0 || parseInt(customMinutes, 10) <= 0}
                className="h-10 rounded-lg bg-zinc-800 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Go
              </button>
            </div>
          )}

          <TimerControls
            isRunning={isRunning}
            isPaused={isPaused}
            isDone={isDone}
            hasSelection={hasSelection}
            selectedSeconds={selectedSeconds}
            pause={pause}
            resume={resume}
            reset={reset}
            start={start}
          />
        </div>
      )}

      <Tooltip open={open ? false : tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Recipe timer"
            className={cn(
              "flex h-11 items-center justify-center gap-1.5 rounded-md px-2 text-white transition-colors hover:bg-zinc-800",
              isRunning && "text-green-400",
              isDone && "animate-pulse text-red-400"
            )}
          >
            <Clock className="h-5 w-5 flex-shrink-0" />
            {isActive && (
              <span className="font-mono text-xs tabular-nums leading-none">
                {displayTime}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>Recipe timer</TooltipContent>
      </Tooltip>
    </div>
  );
}
