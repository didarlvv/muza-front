import type React from "react";
import { useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type DateRange = { from: Date; to: Date | null } | null;

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);

  const getDaysInMonth = useCallback((year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  }, []);

  const getFirstDayOfMonth = useCallback((year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  }, []);

  const formatDate = useCallback((date: Date) => {
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }, []);

  const calendar = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const paddingDays = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < paddingDays; i++) {
      days.unshift(null);
    }

    return days;
  }, [currentDate, getDaysInMonth, getFirstDayOfMonth]);

  const handleDateClick = useCallback(
    (date: Date) => {
      if (!value || (value.from && value.to)) {
        onChange({ from: date, to: null });
      } else if (value.from && !value.to && date > value.from) {
        onChange({ ...value, to: date });
      } else {
        onChange({ from: date, to: null });
      }
    },
    [value, onChange]
  );

  const isDateInRange = useCallback(
    (date: Date) => {
      if (!value || !value.from) return false;
      if (!value.to) return date.getTime() === value.from.getTime();
      return date >= value.from && date <= value.to;
    },
    [value]
  );

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 border rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {value && value.from
          ? value.to
            ? `${formatDate(value.from)} - ${formatDate(value.to)}`
            : formatDate(value.from)
          : "Выберите даты"}
      </button>
      {isOpen && (
        <div className="absolute mt-2 bg-white border rounded-md shadow-lg z-10">
          <div className="flex justify-between items-center p-2 border-b">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="font-semibold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="p-2">
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-700"
                >
                  {day}
                </div>
              ))}
              {calendar.map((date, index) => (
                <button
                  key={index}
                  onClick={() => date && handleDateClick(date)}
                  disabled={!date}
                  className={`
                    p-2 text-center text-sm rounded-full
                    ${!date ? "text-gray-400" : "hover:bg-gray-100"}
                    ${
                      date && isDateInRange(date)
                        ? "bg-indigo-100 text-indigo-800"
                        : ""
                    }
                    ${
                      date &&
                      value?.from &&
                      date.getTime() === value.from.getTime()
                        ? "bg-indigo-600 text-white"
                        : ""
                    }
                    ${
                      date && value?.to && date.getTime() === value.to.getTime()
                        ? "bg-indigo-600 text-white"
                        : ""
                    }
                  `}
                >
                  {date ? date.getDate() : ""}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
