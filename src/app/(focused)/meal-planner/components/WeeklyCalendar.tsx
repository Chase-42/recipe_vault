"use client";

import { useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { MealSlot } from "./MealSlot";
import { useGridNavigation } from "~/hooks/useKeyboardNavigation";
import type { WeeklyCalendarProps, MealType } from "~/types";

// Helper function to get week dates
function getWeekDates(weekStart: Date): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateString = date.toISOString().split("T")[0];
    if (dateString) {
      dates.push(dateString);
    }
  }
  return dates;
}

// Helper function to format date for display
function formatDateDisplay(dateString: string): JSX.Element {
  const date = new Date(dateString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const dayNumber = date.getDate();

  return (
    <div
      className={`text-center ${isToday ? "text-blue-600 font-semibold" : ""}`}
    >
      <div className="text-sm font-medium">{dayName}</div>
      <div className="text-lg">{dayNumber}</div>
    </div>
  );
}

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner"];

export function WeeklyCalendar({
  weekStart,
  meals,
  onMealDrop,
  onMealRemove,
  onMealMove: _onMealMove,
  onWeekChange,
  dragState: _dragState,
  isDragOverSlot,
  canDropOnSlot,
  isMobile = false,
  swipeHandlers,
}: WeeklyCalendarProps) {
  const weekDates = getWeekDates(weekStart);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Grid navigation for keyboard accessibility (7 days x 3 meal types)
  const { gridRef } = useGridNavigation(
    3, // rows (meal types)
    7, // cols (days)
    (_row, _col) => {
      // Optional: Handle cell selection - could add functionality here
    },
    (row, col) => {
      // Handle cell activation (Enter/Space)
      const date = weekDates[col];
      const mealType = mealTypes[row];
      if (date && mealType) {
        const mealSlot = document.querySelector(
          `[data-date="${date}"][data-meal-type="${mealType}"]`
        );
        if (mealSlot && "click" in mealSlot) {
          (mealSlot as HTMLElement).click();
        }
      }
    }
  );

  // Focus management for calendar
  useEffect(() => {
    if (calendarRef.current && !isMobile) {
      // Set initial focus to first meal slot when calendar loads
      const firstMealSlot = calendarRef.current.querySelector(
        '[data-meal-slot="true"]'
      );
      if (firstMealSlot) {
        firstMealSlot.setAttribute("data-grid-row", "0");
        firstMealSlot.setAttribute("data-grid-col", "0");
      }
    }
  }, [isMobile]);

  // Helper function to get week start (Monday)
  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    return d;
  }

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(weekStart.getDate() - 7);
    onWeekChange?.(newWeekStart);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(weekStart.getDate() + 7);
    onWeekChange?.(newWeekStart);
  };

  // Go to current week
  const goToCurrentWeek = () => {
    onWeekChange?.(getWeekStart(new Date()));
  };

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <nav
        className="flex items-center justify-between"
        role="navigation"
        aria-label="Week navigation"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={goToPreviousWeek}
            aria-label="Go to previous week"
          >
            ← Previous Week
          </Button>
          <Button
            variant="outline"
            onClick={goToCurrentWeek}
            aria-label="Go to current week"
          >
            Current Week
          </Button>
          <Button
            variant="outline"
            onClick={goToNextWeek}
            aria-label="Go to next week"
          >
            Next Week →
          </Button>
        </div>

        <div
          className="text-lg font-medium"
          role="status"
          aria-live="polite"
          aria-label={`Currently viewing week from ${weekStart.toLocaleDateString(
            "en-US",
            {
              month: "long",
              day: "numeric",
            }
          )} to ${new Date(
            weekStart.getTime() + 6 * 24 * 60 * 60 * 1000
          ).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}`}
        >
          {weekStart.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          })}{" "}
          -{" "}
          {new Date(
            weekStart.getTime() + 6 * 24 * 60 * 60 * 1000
          ).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </nav>

      {/* Weekly Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" aria-hidden="true" />
            Weekly Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={isMobile ? calendarRef : gridRef}
            className={`
              ${isMobile ? "space-y-4" : "grid grid-cols-8 gap-4"}
            `}
            role="grid"
            aria-label="Weekly meal planner calendar"
            aria-describedby="calendar-instructions"
            {...(swipeHandlers && isMobile ? swipeHandlers : {})}
          >
            {/* Screen reader instructions */}
            <div id="calendar-instructions" className="sr-only">
              Use arrow keys to navigate between meal slots. Press Enter or
              Space to interact with a meal slot. Press Delete or Backspace to
              remove a meal from a slot.
              {isMobile
                ? " Swipe left or right to navigate between weeks."
                : ""}
            </div>
            {isMobile ? (
              // Mobile layout: Stack days vertically
              weekDates.map((date) => (
                <div key={date} className="space-y-3">
                  {/* Day Header */}
                  <div
                    className="text-center border-b pb-2"
                    role="columnheader"
                    aria-label={`${new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}`}
                  >
                    {formatDateDisplay(date)}
                  </div>

                  {/* Meal Slots for this day */}
                  <div className="grid grid-cols-3 gap-2">
                    {mealTypes.map((mealType) => (
                      <div key={`${date}-${mealType}`} className="space-y-1">
                        <div className="text-center text-xs font-medium text-gray-600 capitalize">
                          {mealType}
                        </div>
                        <MealSlot
                          date={date}
                          mealType={mealType}
                          plannedMeal={meals?.[date]?.[mealType]}
                          onDrop={onMealDrop}
                          onRemove={onMealRemove}
                          isDragOver={isDragOverSlot?.(date, mealType)}
                          canDrop={canDropOnSlot?.(date, mealType) ?? true}
                          isMobile={isMobile}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Desktop layout: Grid with day headers and meal rows
              <>
                {/* Empty cell for meal type labels */}
                <div />

                {/* Day Headers */}
                {weekDates.map((date) => (
                  <div
                    key={date}
                    className="text-center"
                    role="columnheader"
                    aria-label={`${new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}`}
                  >
                    {formatDateDisplay(date)}
                  </div>
                ))}

                {/* Meal Slots */}
                {mealTypes.map((mealType) => (
                  <div key={mealType} className="contents">
                    {/* Meal Type Label */}
                    <div
                      className="text-center text-sm font-medium text-gray-600 capitalize py-2"
                      role="rowheader"
                      aria-label={`${mealType.charAt(0).toUpperCase() + mealType.slice(1)} meals`}
                    >
                      {mealType}
                    </div>

                    {/* Meal Slots for this meal type */}
                    {weekDates.map((date, dayIndex) => {
                      const mealTypeIndex = mealTypes.indexOf(mealType);
                      return (
                        <MealSlot
                          key={`${date}-${mealType}`}
                          date={date}
                          mealType={mealType}
                          plannedMeal={meals?.[date]?.[mealType]}
                          onDrop={onMealDrop}
                          onRemove={onMealRemove}
                          isDragOver={isDragOverSlot?.(date, mealType)}
                          canDrop={canDropOnSlot?.(date, mealType) ?? true}
                          isMobile={isMobile}
                          gridRow={mealTypeIndex}
                          gridCol={dayIndex}
                        />
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
