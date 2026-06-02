"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { useRecipeTimer } from "~/hooks/useRecipeTimer";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

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

export function RecipeTimer() {
  const [open, setOpen] = useState(false);
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

  // Close panel on outside click
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
    <TooltipProvider>
      <div className="relative">
        {/* Panel — drops down from header */}
        {open && (
          <div
            ref={panelRef}
            className="absolute left-0 top-full mt-2 w-64 rounded-md border border-border bg-zinc-900 p-3 shadow-xl"
          >
            {/* Countdown display */}
            <div
              className={cn(
                "mb-2 text-center font-mono text-3xl font-semibold tabular-nums tracking-tight",
                isDone && "animate-pulse text-red-400",
                isRunning && "text-white",
                !isRunning && !isDone && "text-muted-foreground"
              )}
            >
              {displayTime}
            </div>

            {/* Preset buttons */}
            {!isRunning && !isPaused && (
              <div className="mb-2 flex gap-1">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handlePreset(p.seconds)}
                    className={cn(
                      "flex-1 rounded border border-border bg-zinc-800 py-1 text-xs text-white transition-colors hover:bg-zinc-700",
                      selectedSeconds === p.seconds && !isRunning && !isPaused && "border-primary bg-primary/20"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Custom input */}
            {!isRunning && !isPaused && (
              <div className="mb-2 flex gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={999}
                  placeholder="custom min"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustomStart()}
                  className="w-full rounded border border-border bg-zinc-800 px-2 py-1 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  size="sm"
                  onClick={handleCustomStart}
                  disabled={customMinutes.length === 0 || parseInt(customMinutes, 10) <= 0}
                  className="h-7 px-3 text-xs"
                >
                  Go
                </Button>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-1.5">
              {isRunning && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={pause}
                  className="flex-1 h-7 text-xs bg-zinc-700 hover:bg-zinc-600"
                >
                  Pause
                </Button>
              )}
              {isPaused && (
                <Button size="sm" onClick={resume} className="flex-1 h-7 text-xs">
                  Resume
                </Button>
              )}
              {(isRunning || isPaused || isDone) && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={reset}
                  className="flex-1 h-7 text-xs bg-zinc-700 hover:bg-zinc-600"
                >
                  Reset
                </Button>
              )}
              {hasSelection && !isRunning && !isPaused && (
                <Button
                  size="sm"
                  onClick={() => start(selectedSeconds)}
                  className="flex-1 h-7 text-xs"
                >
                  {isDone ? "Restart" : "Start"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Trigger button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              ref={triggerRef}
              variant="ghost"
              size="icon"
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "h-11 w-11 text-white hover:bg-zinc-800",
                isRunning && "text-green-400",
                isDone && "animate-pulse text-red-400"
              )}
              aria-label="Timer"
            >
              <Clock className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isRunning || isPaused ? displayTime : "Timer"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
