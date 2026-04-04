'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock, X, ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    label?: string;
    className?: string;
}

export function TimePicker({
    value,
    onChange,
    placeholder = 'Select time',
    label,
    className = '',
}: TimePickerProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Parse current value
    const hours = value ? parseInt(value.split(':')[0]) : 0;
    const minutes = value ? parseInt(value.split(':')[1]) : 0;
    const isPM = hours >= 12;
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    const displayValue = value
        ? `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`
        : '';

    // Click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const updateTime = (newHours: number, newMinutes: number) => {
        const formatted = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
        onChange?.(formatted);
    };

    const adjustHours = (delta: number) => {
        let newHours = hours + delta;
        if (newHours < 0) newHours = 23;
        if (newHours > 23) newHours = 0;
        updateTime(newHours, minutes);
    };

    const adjustMinutes = (delta: number) => {
        let newMinutes = minutes + delta;
        if (newMinutes < 0) newMinutes = 55;
        if (newMinutes > 55) newMinutes = 0;
        updateTime(hours, newMinutes);
    };

    const toggleAmPm = () => {
        let newHours = hours;
        if (isPM) {
            newHours = hours - 12;
        } else {
            newHours = hours + 12;
        }
        if (newHours < 0) newHours = 0;
        updateTime(newHours, minutes);
    };

    const handleClear = () => {
        onChange?.('');
    };

    const setNow = () => {
        const now = new Date();
        updateTime(now.getHours(), now.getMinutes());
    };

    return (
        <div className={className}>
            {label && (
                <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {label}
                </label>
            )}
            <div ref={ref} className="relative">
                {/* Control - matches DatePicker.Control */}
                <div
                    onClick={() => setOpen(!open)}
                    className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0B0F19] px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/50 focus-within:border-orange-500/50 transition-all cursor-pointer"
                >
                    <div className="flex-1 flex items-center text-left bg-transparent">
                        {displayValue ? (
                            <span className="text-sm text-white font-medium">{displayValue}</span>
                        ) : (
                            <span className="text-sm text-slate-500">{placeholder}</span>
                        )}
                    </div>
                    {value && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleClear(); }}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <div className="p-1.5 rounded-lg text-slate-400">
                        <Clock size={16} />
                    </div>
                </div>

                {/* Dropdown - matches DatePicker.Content styling */}
                {open && (
                    <div className="absolute top-full left-0 mt-2 w-[220px] rounded-xl border border-slate-800 bg-[#151B28] shadow-2xl p-3 z-[100]">
                        {/* Time wheels */}
                        <div className="flex items-center justify-center gap-3 mb-3">
                            {/* Hours */}
                            <div className="flex flex-col items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => adjustHours(1)}
                                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                >
                                    <ChevronUp size={16} />
                                </button>
                                <div className="w-12 h-10 flex items-center justify-center rounded-lg bg-[#0B0F19] border border-slate-800">
                                    <span className="text-lg font-black text-white">{String(displayHours).padStart(2, '0')}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => adjustHours(-1)}
                                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                >
                                    <ChevronDown size={16} />
                                </button>
                            </div>

                            <span className="text-xl font-black text-slate-500 mt-[-8px]">:</span>

                            {/* Minutes */}
                            <div className="flex flex-col items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => adjustMinutes(5)}
                                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                >
                                    <ChevronUp size={16} />
                                </button>
                                <div className="w-12 h-10 flex items-center justify-center rounded-lg bg-[#0B0F19] border border-slate-800">
                                    <span className="text-lg font-black text-white">{String(minutes).padStart(2, '0')}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => adjustMinutes(-5)}
                                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                >
                                    <ChevronDown size={16} />
                                </button>
                            </div>

                            {/* AM/PM */}
                            <div className="flex flex-col items-center gap-1 ml-1">
                                <div className="h-[26px]" />
                                <button
                                    type="button"
                                    onClick={toggleAmPm}
                                    className="w-12 h-10 flex items-center justify-center rounded-lg bg-[#0B0F19] border border-slate-800 text-xs font-black text-orange-500 hover:border-orange-500/50 transition-colors"
                                >
                                    {isPM ? 'PM' : 'AM'}
                                </button>
                                <div className="h-[26px]" />
                            </div>
                        </div>

                        {/* Now button - matches DatePicker "Today" button */}
                        <div className="pt-3 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={setNow}
                                className="w-full py-1.5 text-xs font-black uppercase tracking-widest text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors"
                            >
                                Now
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TimePicker;