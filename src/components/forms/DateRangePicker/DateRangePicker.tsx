"use client";

import { CalendarRange, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import type { DateRangePickerProps, DateRangeValue } from "./DateRangePicker.types";

const defaultRange: DateRangeValue = {
  startDate: "",
  endDate: "",
  preset: "custom",
};

export function DateRangePicker({
  value,
  defaultValue = defaultRange,
  ariaLabel = "Date range",
  onValueChange,
  className,
}: DateRangePickerProps & { className?: string }) {
  const [internalValue, setInternalValue] = useState<DateRangeValue>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentValue = value ?? internalValue;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  function updateRange(nextValue: DateRangeValue) {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  }

  function handleStartChange(event: ChangeEvent<HTMLInputElement>) {
    updateRange({ ...currentValue, startDate: event.target.value, preset: "custom" });
  }

  function handleEndChange(event: ChangeEvent<HTMLInputElement>) {
    updateRange({ ...currentValue, endDate: event.target.value, preset: "custom" });
  }

  function handlePresetClick(event: ChangeEvent<HTMLSelectElement>) {
    const preset = event.target.value as DateRangeValue["preset"];
    if (preset === "custom") {
      updateRange({ ...currentValue, preset: "custom" });
      return;
    }

    const today = new Date();
    const endDate = today.toISOString().slice(0, 10);
    const start = new Date(today);
    const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
    start.setDate(start.getDate() - days);

    updateRange({
      startDate: start.toISOString().slice(0, 10),
      endDate,
      preset,
    });
  }

  const dateDisplay = currentValue.startDate && currentValue.endDate
    ? `${currentValue.startDate} - ${currentValue.endDate}`
    : ariaLabel;

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-border/40 bg-background/50 backdrop-blur-sm shadow-sm transition-all hover:bg-accent/50 hover:border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isOpen && "ring-2 ring-ring ring-offset-2 border-primary/50"
        )}
      >
        <CalendarRange className="size-4 text-muted-foreground" />
        <span className="truncate max-w-[200px]">{dateDisplay}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-72 p-4 rounded-2xl border border-border/40 bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top-left">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Preset Range</label>
              <select 
                className="w-full h-9 rounded-lg border border-border/40 bg-muted/20 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all appearance-none cursor-pointer"
                value={currentValue.preset ?? "custom"} 
                onChange={handlePresetClick}
              >
                <option value="custom">Custom Range</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Start Date</label>
                <input 
                  type="date" 
                  className="w-full h-9 rounded-lg border border-border/40 bg-muted/20 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  value={currentValue.startDate} 
                  onChange={handleStartChange} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">End Date</label>
                <input 
                  type="date" 
                  className="w-full h-9 rounded-lg border border-border/40 bg-muted/20 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  value={currentValue.endDate} 
                  onChange={handleEndChange} 
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border/20">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 group" 
                onClick={() => {
                  updateRange(defaultRange);
                  setIsOpen(false);
                }}
              >
                Reset
              </Button>
              <Button 
                size="sm" 
                className="h-8 ml-2"
                onClick={() => setIsOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

