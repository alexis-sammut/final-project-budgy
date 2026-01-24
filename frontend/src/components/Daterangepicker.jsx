import { useState } from "react";
import "../styles/DateRangePicker.css";

function DateRangePicker({ value, onChange, onCalculate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("custom");
  const [tempStartDate, setTempStartDate] = useState(value?.start || "");
  const [tempEndDate, setTempEndDate] = useState(value?.end || "");

  const presets = [
    { id: "week", label: "1 Week", days: 7 },
    { id: "biweek", label: "2 Weeks", days: 14 },
    { id: "month", label: "1 Month", days: null },
    { id: "custom", label: "Custom", days: null },
  ];

  const handlePresetClick = (preset) => {
    setSelectedPreset(preset.id);
    
    if (preset.id !== "custom") {
      setTempStartDate("");
      setTempEndDate("");
    }
  };

  const handleStartDateChange = (date) => {
    setTempStartDate(date);
    
    if (!date) {
      setTempEndDate("");
      return;
    }

    // Auto-calculate end date based on preset
    const start = new Date(date);
    let end;

    if (selectedPreset === "week") {
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (selectedPreset === "biweek") {
      end = new Date(start);
      end.setDate(start.getDate() + 13);
    } else if (selectedPreset === "month") {
      end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      end.setDate(start.getDate() - 1);
    } else {
      return;
    }

    const endDateStr = end.toISOString().split('T')[0];
    setTempEndDate(endDateStr);
    
    // Trigger change and calculation
    onChange({
      start: date,
      end: endDateStr,
      periodType: selectedPreset
    });
    
    if (onCalculate) {
      onCalculate();
    }
  };

  const handleEndDateChange = (date) => {
    setTempEndDate(date);
    
    if (tempStartDate && date) {
      onChange({
        start: tempStartDate,
        end: date,
        periodType: selectedPreset
      });
      
      if (onCalculate) {
        onCalculate();
      }
    }
  };

  const formatDisplayDate = () => {
    if (!tempStartDate || !tempEndDate) return "Select period";
    
    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);
    
    const options = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} – ${end.toLocaleDateString('en-US', options)}`;
  };

  return (
    <div className="date-range-picker">
      <div 
        className="date-range-display"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="date-range-text">{formatDisplayDate()}</span>
        <svg 
          className={`chevron ${isOpen ? 'open' : ''}`}
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <>
          <div className="date-picker-overlay" onClick={() => setIsOpen(false)} />
          <div className="date-picker-popover">
            <div className="date-picker-content">
              {/* Preset buttons on the left */}
              <div className="preset-sidebar">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    className={`preset-option ${selectedPreset === preset.id ? 'active' : ''}`}
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Date inputs */}
              <div className="date-inputs-section">
                <div className="date-input-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                  />
                </div>
                <div className="date-input-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    disabled={selectedPreset !== "custom" && !tempStartDate}
                  />
                </div>
                
                {tempStartDate && tempEndDate && (
                  <div className="period-info">
                    {Math.ceil((new Date(tempEndDate) - new Date(tempStartDate)) / (1000 * 60 * 60 * 24)) + 1} days
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DateRangePicker;