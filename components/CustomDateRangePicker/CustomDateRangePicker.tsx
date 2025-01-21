import type React from "react";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import styles from "./CustomDateRangePicker.module.css";

type DateRange = { from: Date; to: Date | null } | null;

interface CustomDateRangePickerProps {
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

const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  value,
  onChange,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current && dropdownRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let top = containerRect.bottom + window.scrollY;
      let left = containerRect.left + window.scrollX;

      if (top + dropdownRect.height > viewportHeight) {
        top = containerRect.top + window.scrollY - dropdownRect.height;
      }

      if (left + dropdownRect.width > viewportWidth) {
        left = containerRect.right + window.scrollX - dropdownRect.width;
      }

      dropdownRef.current.style.top = `${top}px`;
      dropdownRef.current.style.left = `${left}px`;
    }
  }, [isOpen]);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.trigger}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <CalendarIcon className={styles.calendarIcon} />
        <span>
          {value && value.from
            ? value.to
              ? `${formatDate(value.from)} - ${formatDate(value.to)}`
              : formatDate(value.from)
            : "Выберите даты"}
        </span>
      </button>
      {isOpen && (
        <div
          className={styles.dropdown}
          ref={dropdownRef}
          role="dialog"
          aria-label="Выбор дат"
        >
          <div className={styles.header}>
            <button
              onClick={handlePrevMonth}
              className={styles.navButton}
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft />
            </button>
            <span className={styles.currentMonth}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={handleNextMonth}
              className={styles.navButton}
              aria-label="Следующий месяц"
            >
              <ChevronRight />
            </button>
          </div>
          <div className={styles.calendar}>
            {DAYS.map((day) => (
              <div key={day} className={styles.dayName}>
                {day}
              </div>
            ))}
            {calendar.map((date, index) => (
              <button
                key={index}
                onClick={() => date && handleDateClick(date)}
                disabled={!date}
                className={`
                  ${styles.day}
                  ${!date ? styles.emptyDay : ""}
                  ${date && isDateInRange(date) ? styles.inRange : ""}
                  ${
                    date &&
                    value?.from &&
                    date.getTime() === value.from.getTime()
                      ? styles.startDate
                      : ""
                  }
                  ${
                    date && value?.to && date.getTime() === value.to.getTime()
                      ? styles.endDate
                      : ""
                  }
                `}
                aria-label={date ? formatDate(date) : "Пустая ячейка"}
                aria-selected={date && isDateInRange(date)}
              >
                {date ? date.getDate() : ""}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDateRangePicker;
