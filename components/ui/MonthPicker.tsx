"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";

interface MonthPickerProps {
  value?: string; // format: "yyyy-MM"
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function MonthPicker({ 
  value, 
  onChange, 
  placeholder = "Select month", 
  label,
  className = "" 
}: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const year = value ? parseInt(value.split("-")[0]) : new Date().getFullYear();
  const month = value ? parseInt(value.split("-")[1]) : 0;

  const displayValue = value
    ? `${MONTHS[month - 1]} ${year}`
    : "";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMonthSelect = (monthIndex: number) => {
    const selectedMonth = String(monthIndex + 1).padStart(2, "0");
    onChange?.(`${year}-${selectedMonth}`);
    setIsOpen(false);
  };

  const handleYearChange = (delta: number) => {
    const newYear = year + delta;
    const selectedMonth = month ? String(month).padStart(2, "0") : "01";
    onChange?.(`${newYear}-${selectedMonth}`);
  };

  const handleClear = () => {
    onChange?.("");
  };

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
          {label}
        </label>
      )}
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0B0F19] px-3 py-2.5 shadow-sm cursor-pointer focus-within:ring-2 focus-within:ring-orange-500/50 focus-within:border-orange-500/50 transition-all ${
            isOpen ? "ring-2 ring-orange-500/50 border-orange-500/50" : ""
          }`}
        >
          <input
            type="text"
            value={displayValue}
            placeholder={placeholder}
            readOnly
            className="flex-1 bg-transparent outline-none text-sm text-white font-medium cursor-pointer"
          />
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <div className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <Calendar size={16} />
          </div>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-[280px] rounded-xl border border-slate-800 bg-[#151B28] shadow-2xl p-3 z-[100]">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => handleYearChange(-1)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-black text-white uppercase px-2 py-1 rounded-md hover:bg-slate-800 cursor-pointer">
                {year}
              </span>
              <button
                type="button"
                onClick={() => handleYearChange(1)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {MONTHS.map((m, idx) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMonthSelect(idx)}
                  className={`w-full h-full aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    value && month === idx + 1
                      ? "bg-orange-500 text-white"
                      : "text-white hover:bg-orange-500/20 hover:text-orange-500"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const todayYear = today.getFullYear();
                const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
                onChange?.(`${todayYear}-${todayMonth}`);
                setIsOpen(false);
              }}
              className="w-full mt-2 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-orange-500 hover:bg-orange-500/10 transition-colors"
            >
              Today
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MonthPicker;