import { useState } from "react";
import "../styles/PeriodPicker.css";

function PeriodPicker({ onPeriodSelect, onClose }) {
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customMode, setCustomMode] = useState(false);

  const presets = [
    { id: "week", label: "1 Week", days: 7 },
    { id: "biweek", label: "2 Weeks", days: 14 },
    { id: "month", label: "1 Month", days: null }, 
    { id: "custom", label: "Custom", days: null },
  ];

  const handlePresetClick = (preset) => {
    setSelectedPreset(preset.id);
    
    if (preset.id === "custom") {
      setCustomMode(true);
      setStartDate("");
      setEndDate("");
    } else {
      setCustomMode(false);
      setStartDate("");
      setEndDate("");
    }
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    
    if (!date) {
      setEndDate("");
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
    setEndDate(endDateStr);
  };

  const handleConfirm = () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    // Validate end date is after start date
    if (new Date(endDate) <= new Date(startDate)) {
      alert("End date must be after start date");
      return;
    }

    onPeriodSelect({
      periodType: selectedPreset,
      startDate,
      endDate,
    });
    onClose();
  };

  return (
    <div className="period-picker-overlay" onClick={onClose}>
      <div className="period-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="period-picker-header">
          <h2>Select Budget Period</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="period-picker-body">
          {/* Preset Buttons */}
          <div className="preset-buttons">
            {presets.map((preset) => (
              <button
                key={preset.id}
                className={`preset-btn ${selectedPreset === preset.id ? "active" : ""}`}
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Date Selection */}
          {selectedPreset && (
            <div className="date-selection">
              <div className="date-input-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                />
              </div>

              <div className="date-input-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!customMode}
                />
              </div>

              {startDate && endDate && (
                <div className="period-summary">
                  <p>
                    <strong>Period:</strong> {startDate} to {endDate}
                  </p>
                  <p>
                    <strong>Duration:</strong> {
                      Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
                    } days
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedPreset && startDate && endDate && (
          <div className="period-picker-footer">
            <button className="confirm-btn" onClick={handleConfirm}>
              Confirm Period
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PeriodPicker;