"use client";

import { MAIN_MEAL_CATEGORIES } from "~/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  labelClassName?: string;
}

export function CategorySelect({
  value,
  onValueChange,
  labelClassName = "text-sm font-medium",
}: CategorySelectProps) {
  return (
    <div>
      <label className={labelClassName}>Category</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent>
          {MAIN_MEAL_CATEGORIES.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
