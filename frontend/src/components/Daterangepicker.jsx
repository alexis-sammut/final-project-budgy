import { useState, useEffect } from "react";
import "../styles/DateRangePicker.css";

// Component for selecting date ranges with presets
function DateRangePicker({ value, onChange, onCalculate }) {
  const [selectedPreset, setSelectedPreset] = useState(value.periodType || "1month");
  const [tempStartDate, setTempStartDate] = useState(value.start || "");
  const [tempEndDate, setTempEndDate] = useState(value.end || "");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);

  // Sync state with props
  useEffect(() => {
    setSelectedPreset(value.periodType || "1month");
    setTempStartDate(value.start || "");
    setTempEndDate(value.end || "");
  }, [value]);

  const presets = [
    { value: "1week", label: "1 Week", days: 7 },
    { value: "2weeks", label: "2 Weeks", days: 14 },
    { value: "1month", label: "1 Month", days: null, isMonth: true },
    { value: "custom", label: "Custom", days: null },
    { value: "oneoff", label: "One-Time", days: null, isOneOff: true },
  ];

  // Handle preset selection logic
  const handlePresetClick = (preset) => {
    setSelectedPreset(preset.value);
    
    if (preset.isOneOff) {
      // One-time sets start and end to today
      const today = new Date().toISOString().split('T')[0];
      setTempStartDate(today);
      setTempEndDate(today);
    } else {
      setTempStartDate("");
      setTempEndDate("");
    }
  };

  // Handle calendar date clicks
  const handleDateClick = (dateStr) => {
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(dateStr);
      
      if (selectedPreset !== "custom") {
        const preset = presets.find(p => p.value === selectedPreset);
        const start = new Date(dateStr);
        let end;
        
        if (preset.isOneOff) {
          end = start;
        } else if (preset.isMonth) {
          const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
          
          end = new Date(start);
          end.setDate(start.getDate() + daysInMonth - 1);
        } else if (preset.days) {
          end = new Date(start);
          end.setDate(start.getDate() + preset.days - 1);
        }
        
        if (end) {
          const endDateStr = end.toISOString().split('T')[0];
          setTempEndDate(endDateStr);
          
          onChange({
            start: dateStr,
            end: endDateStr,
            periodType: selectedPreset,
          });
        }
      } else {
        setTempEndDate("");
      }
    } else {
      const start = new Date(tempStartDate);
      const clicked = new Date(dateStr);
      
      let finalStart = tempStartDate;
      let finalEnd = dateStr;
      
      if (clicked < start) {
        finalStart = dateStr;
        finalEnd = tempStartDate;
      }
      
      setTempStartDate(finalStart);
      setTempEndDate(finalEnd);
      
      const detectedPreset = detectPresetFromDates(finalStart, finalEnd);
      
      onChange({
        start: finalStart,
        end: finalEnd,
        periodType: detectedPreset,
      });
    }
  };

  // Determine preset type based on date range
  const detectPresetFromDates = (startStr, endStr) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays === 7) {
      setSelectedPreset("1week");
      return "1week";
    }
    
    if (diffDays === 14) {
      setSelectedPreset("2weeks");
      return "2weeks";
    }
    
    if (diffDays >= 28 && diffDays <= 31) {
      const startDay = start.getDate();
      const endDay = end.getDate();
      const startMonth = start.getMonth();
      const endMonth = end.getMonth();
      
      const daysInStartMonth = new Date(start.getFullYear(), startMonth + 1, 0).getDate();
      
      if (endDay === startDay - 1 && endMonth === startMonth + 1) {
        setSelectedPreset("1month");
        return "1month";
      }
      
      if (startDay === 1 && endDay === daysInStartMonth && startMonth === endMonth) {
        setSelectedPreset("1month");
        return "1month";
      }
      
      if (diffDays === daysInStartMonth) {
        setSelectedPreset("1month");
        return "1month";
      }
    }
    
    if (diffDays === 1 && startStr === endStr) {
      setSelectedPreset("oneoff");
      return "oneoff";
    }
    
    setSelectedPreset("custom");
    return "custom";
  };

  const handleApply = () => {
    if (!tempStartDate || !tempEndDate) return;

    onChange({
      start: tempStartDate,
      end: tempEndDate,
      periodType: selectedPreset,
    });
  };

  // Generate calendar days for current month view
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push(dateStr);
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Check if date is within selected range
  const isDateInRange = (dateStr) => {
    if (!tempStartDate) return false;
    if (!tempEndDate && !hoveredDate) return dateStr === tempStartDate;
    
    const date = new Date(dateStr);
    const start = new Date(tempStartDate);
    const end = tempEndDate ? new Date(tempEndDate) : hoveredDate ? new Date(hoveredDate) : start;
    
    const actualStart = start < end ? start : end;
    const actualEnd = start < end ? end : start;
    
    return date >= actualStart && date <= actualEnd;
  };

  const isStartDate = (dateStr) => dateStr === tempStartDate;
  const isEndDate = (dateStr) => dateStr === tempEndDate;

  const calculateDays = () => {
    if (!tempStartDate || !tempEndDate) return null;
    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);
    const diff = Math.abs(end - start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatPeriod = () => {
    if (!value.start || !value.end) return "Select period";
    const start = new Date(value.start);
    const end = new Date(value.end);
    return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;  };

  const days = getDaysInMonth(currentMonth);
  const dayCount = calculateDays();

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="date-range-picker">
      <div className="picker-container">
        <div className="picker-content">
          {/* Preset options sidebar */}
          <div className="picker-sidebar">
            {presets.map((preset) => (
              <button
                key={preset.value}
                className={`preset-btn ${selectedPreset === preset.value ? 'active' : ''}`}
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Calendar view */}
          <div className="picker-calendar">
                <div className="calendar-header">
                  <button className="month-nav-btn" onClick={handlePrevMonth}>‹</button>
                  <h3 className="month-title">{monthYear}</h3>
                  <button className="month-nav-btn" onClick={handleNextMonth}>›</button>
                </div>

                <div className="calendar-weekdays">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="weekday">{day}</div>
                  ))}
                </div>

                <div className="calendar-grid">
                  {days.map((dateStr, index) => {
                    if (!dateStr) {
                      return <div key={index} className="calendar-day empty" />;
                    }

                    const day = new Date(dateStr).getDate();
                    const inRange = isDateInRange(dateStr);
                    const isStart = isStartDate(dateStr);
                    const isEnd = isEndDate(dateStr);

                    return (
                      <button
                        key={dateStr}
                        className={`calendar-day ${inRange ? 'in-range' : ''} ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''}`}
                        onClick={() => handleDateClick(dateStr)}
                        onMouseEnter={() => setHoveredDate(dateStr)}
                        onMouseLeave={() => setHoveredDate(null)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {dayCount && (
                  <div className="period-info">
                    {dayCount} day{dayCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
  );
}

export default DateRangePicker;