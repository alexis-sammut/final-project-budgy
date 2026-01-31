import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CalendarDayModal from "../components/CalendarDayModal";
import "../styles/calendar.css";
import { getUserCurrency } from "../utils/userPreferences";

// Monthly calendar view for recurring items
function Calendar() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pockets, setPockets] = useState([]);
  const [monthlyItems, setMonthlyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currency, setCurrency] = useState("€");

  useEffect(() => {
    fetchPocketsAndItems();
    fetchCurrency();
  }, []);

  const fetchCurrency = async () => {
    const userCurrency = await getUserCurrency();
    setCurrency(userCurrency);
  };

  // Get items and organize them for the calendar
  const fetchPocketsAndItems = async () => {
    try {
      const res = await api.get("/api/pockets/");
      setPockets(res.data);

      // Filter for monthly items with due dates
      const allMonthlyItems = [];
      res.data.forEach((pocket) => {
        if (pocket.items && pocket.items.length > 0) {
          pocket.items.forEach((item) => {
            if (item.frequency === "monthly" && item.due_date) {
              allMonthlyItems.push({
                ...item,
                pocketName: pocket.name,
                pocketColor: pocket.color,
                pocketId: pocket.id,
              });
            }
          });
        }
      });

      setMonthlyItems(allMonthlyItems);
    } catch (err) {
      console.error("Error fetching pockets:", err);
    } finally {
      setLoading(false);
    }
  };

  // Generate array of days for grid view
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // Fill empty cells before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Fill actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getItemsForDay = (day) => {
    if (!day) return [];
    return monthlyItems.filter((item) => item.due_date === day);
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const items = getItemsForDay(day);
    if (items.length > 0) {
      setSelectedDay({ day, items });
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDay(null);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const today = new Date();
  const isCurrentMonth =
    currentMonth.getMonth() === today.getMonth() &&
    currentMonth.getFullYear() === today.getFullYear();

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="home-container">
          <div className="home-content">
            <p>Loading calendar...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="home-container">
        <div className="home-content">
          <div className="calendar-page-header">
            <h1>Monthly Items Calendar</h1>
            <p className="calendar-subtitle">
              View all your monthly recurring items by due date
            </p>
          </div>

          <div className="calendar-container">
            {/* Navigation Header */}
            <div className="calendar-header">
              <button className="month-nav-btn" onClick={handlePrevMonth}>
                ‹
              </button>
              <div className="month-title-section">
                <h2 className="month-title">{monthYear}</h2>
                <button className="today-btn" onClick={handleToday}>
                  Today
                </button>
              </div>
              <button className="month-nav-btn" onClick={handleNextMonth}>
                ›
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="calendar-weekdays">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="weekday-header">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="calendar-grid">
              {days.map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="calendar-day empty"
                    />
                  );
                }

                const items = getItemsForDay(day);
                const hasItems = items.length > 0;
                const isToday = isCurrentMonth && day === today.getDate();

                return (
                  <div
                    key={day}
                    className={`calendar-day ${hasItems ? "has-items" : ""} ${isToday ? "today" : ""}`}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="day-number">{day}</div>
                    {hasItems && (
                      <div className="item-indicators">
                        {items.map((item, idx) => (
                          <div
                            key={`${item.id}-${idx}`}
                            className="item-dot"
                            style={{ backgroundColor: item.pocketColor }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="calendar-legend">
              <div className="legend-item">
                <div className="legend-dot today-indicator"></div>
                <span>Today</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot has-items-indicator"></div>
                <span>Has recurring items</span>
              </div>
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="calendar-summary">
            <h3>Summary</h3>
            <p>
              <strong>{monthlyItems.length}</strong> monthly recurring items
              across <strong>{pockets.length}</strong> pockets
            </p>
          </div>
        </div>
      </div>
      <Footer />

      {/* Day Details Modal */}
      {showModal && selectedDay && (
        <CalendarDayModal
          day={selectedDay.day}
          month={monthYear}
          items={selectedDay.items}
          onClose={handleCloseModal}
          currency={currency}
        />
      )}
    </>
  );
}

export default Calendar;
