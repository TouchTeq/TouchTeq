"use client";

import { DatePicker, type DateValue } from "@ark-ui/react/date-picker";
import { Portal } from "@ark-ui/react/portal";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { parseDate } from "@internationalized/date";

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function BasicDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  label,
  className = ""
}: DatePickerProps) {

  const handleValueChange = (details: { value: DateValue[] }) => {
    if (details.value.length > 0) {
      const dateValue = details.value[0];
      const formatted = `${dateValue.year}-${String(dateValue.month).padStart(2, '0')}-${String(dateValue.day).padStart(2, '0')}`;
      onChange?.(formatted);
    }
  };

  const handleClear = () => {
    onChange?.("");
  };

  const handleToday = () => {
    const today = new Date();
    const formatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    onChange?.(formatted);
  };

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : "";

  const parsedValue = value ? [parseDate(value)] : undefined;

  const navHeader = (
    <div className="flex items-center justify-between mb-3">
      <DatePicker.PrevTrigger className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
        <ChevronLeft size={16} />
      </DatePicker.PrevTrigger>
      <DatePicker.ViewTrigger className="text-xs font-black text-white uppercase px-2 py-1 rounded-md hover:bg-slate-800 cursor-pointer transition-colors">
        <DatePicker.RangeText />
      </DatePicker.ViewTrigger>
      <DatePicker.NextTrigger className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
        <ChevronRight size={16} />
      </DatePicker.NextTrigger>
    </div>
  );

  return (
    <div className={className}>
      {label && (
        <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
          {label}
        </label>
      )}
      <DatePicker.Root
        onValueChange={handleValueChange}
        value={parsedValue}
      >
        <DatePicker.Control className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0B0F19] px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/50 focus-within:border-orange-500/50 transition-all">
          <DatePicker.Input className="hidden" />
          <DatePicker.Trigger className="flex-1 flex items-center text-left bg-transparent">
            {displayValue ? (
              <span className="text-sm text-white font-medium">{displayValue}</span>
            ) : (
              <span className="text-sm text-slate-500">{placeholder}</span>
            )}
          </DatePicker.Trigger>
          {value && (
            <DatePicker.ClearTrigger
              onClick={handleClear}
              className="p-1 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <X size={14} />
            </DatePicker.ClearTrigger>
          )}
          <DatePicker.Trigger className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <Calendar size={16} />
          </DatePicker.Trigger>
        </DatePicker.Control>

        <Portal>
          <DatePicker.Positioner>
            <DatePicker.Content className="mt-2 w-[280px] rounded-xl border border-slate-800 bg-[#151B28] shadow-2xl p-3 z-[100]">

              {/* Day view */}
              <DatePicker.View view="day">
                <DatePicker.Context>
                  {(datePicker) => (
                    <>
                      {navHeader}

                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {datePicker.weekDays.map((weekDay, id) => (
                          <div key={id} className="py-1 text-center text-[9px] font-black uppercase text-slate-500">
                            {weekDay.short}
                          </div>
                        ))}
                      </div>

                      <DatePicker.Table className="w-full text-center text-sm">
                        <DatePicker.TableBody>
                          {datePicker.weeks.map((week, id) => (
                            <DatePicker.TableRow key={id}>
                              {week.map((day, id) => (
                                <DatePicker.TableCell key={id} value={day}>
                                  <DatePicker.TableCellTrigger className="w-full h-full aspect-square flex items-center justify-center rounded-lg text-xs font-bold text-white hover:bg-orange-500/20 hover:text-orange-500 transition-all data-[selected]:bg-orange-500 data-[selected]:text-white data-[today]:ring-1 data-[today]:ring-orange-500/50">
                                    {day.day}
                                  </DatePicker.TableCellTrigger>
                                </DatePicker.TableCell>
                              ))}
                            </DatePicker.TableRow>
                          ))}
                        </DatePicker.TableBody>
                      </DatePicker.Table>

                      <div className="mt-3 pt-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={handleToday}
                          className="w-full py-1.5 text-xs font-black uppercase tracking-widest text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors"
                        >
                          Today
                        </button>
                      </div>
                    </>
                  )}
                </DatePicker.Context>
              </DatePicker.View>

              {/* Month view */}
              <DatePicker.View view="month">
                <DatePicker.Context>
                  {(datePicker) => (
                    <>
                      {navHeader}
                      <DatePicker.Table className="w-full">
                        <DatePicker.TableBody>
                          {datePicker.getMonthsGrid({ columns: 3, format: 'short' }).map((months, id) => (
                            <DatePicker.TableRow key={id}>
                              {months.map((month, id) => (
                                <DatePicker.TableCell key={id} value={month.value} className="p-1">
                                  <DatePicker.TableCellTrigger className="w-full py-2 rounded-lg text-xs font-bold uppercase text-white hover:bg-orange-500/20 hover:text-orange-500 transition-all data-[selected]:bg-orange-500 data-[selected]:text-white text-center">
                                    {month.label}
                                  </DatePicker.TableCellTrigger>
                                </DatePicker.TableCell>
                              ))}
                            </DatePicker.TableRow>
                          ))}
                        </DatePicker.TableBody>
                      </DatePicker.Table>
                    </>
                  )}
                </DatePicker.Context>
              </DatePicker.View>

              {/* Year view */}
              <DatePicker.View view="year">
                <DatePicker.Context>
                  {(datePicker) => (
                    <>
                      {navHeader}
                      <DatePicker.Table className="w-full">
                        <DatePicker.TableBody>
                          {datePicker.getYearsGrid({ columns: 3 }).map((years, id) => (
                            <DatePicker.TableRow key={id}>
                              {years.map((year, id) => (
                                <DatePicker.TableCell key={id} value={year.value} className="p-1">
                                  <DatePicker.TableCellTrigger className="w-full py-2 rounded-lg text-xs font-bold text-white hover:bg-orange-500/20 hover:text-orange-500 transition-all data-[selected]:bg-orange-500 data-[selected]:text-white text-center">
                                    {year.label}
                                  </DatePicker.TableCellTrigger>
                                </DatePicker.TableCell>
                              ))}
                            </DatePicker.TableRow>
                          ))}
                        </DatePicker.TableBody>
                      </DatePicker.Table>
                    </>
                  )}
                </DatePicker.Context>
              </DatePicker.View>

            </DatePicker.Content>
          </DatePicker.Positioner>
        </Portal>
      </DatePicker.Root>
    </div>
  );
}

export default BasicDatePicker;
