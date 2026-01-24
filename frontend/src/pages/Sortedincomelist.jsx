import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Home.css";
import "../styles/SortedIncomeList.css";

function SortedIncomeList() {
  const [sortedIncomes, setSortedIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSortedIncomes();
  }, []);

  const fetchSortedIncomes = async () => {
    try {
      const res = await api.get("/api/sorted-incomes/");
      setSortedIncomes(res.data);
    } catch (err) {
      console.error("Error fetching sorted incomes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Group sorted incomes by year
  const groupByYear = () => {
    const grouped = {};
    
    sortedIncomes.forEach((income) => {
      const year = new Date(income.start_date).getFullYear();
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(income);
    });

    // Sort years descending (latest first)
    const sortedYears = Object.keys(grouped).sort((a, b) => b - a);
    
    return sortedYears.map(year => ({
      year,
      incomes: grouped[year].sort((a, b) => 
        new Date(b.start_date) - new Date(a.start_date)
      )
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPeriod = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `${startStr} – ${endStr}`;
  };

  const handleCardClick = (incomeId) => {
    navigate(`/sorted-income/${incomeId}`);
  };

  const groupedIncomes = groupByYear();

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="home-container">
          <div className="home-content">
            <p>Loading sorted incomes...</p>
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
          <div className="page-header">
            <h1>Sorted Incomes</h1>
            <button 
              className="add-btn"
              onClick={() => navigate("/sort-income")}
            >
              + Sort New Income
            </button>
          </div>

          {sortedIncomes.length === 0 ? (
            <div className="empty-state">
              <p>No sorted incomes yet</p>
              <button 
                className="primary-btn"
                onClick={() => navigate("/sort-income")}
              >
                Sort Your First Income
              </button>
            </div>
          ) : (
            <div className="sorted-incomes-container">
              {groupedIncomes.map(({ year, incomes }) => (
                <div key={year} className="year-section">
                  <h2 className="year-title">{year}</h2>
                  <div className="income-cards-grid">
                    {incomes.map((income) => (
                      <div
                        key={income.id}
                        className="income-card"
                        onClick={() => handleCardClick(income.id)}
                      >
                        <div className="income-card-header">
                          <div className="income-amount">
                            €{parseFloat(income.income_amount).toFixed(2)}
                          </div>
                          <div className="income-date">
                            {formatDate(income.start_date)}
                          </div>
                        </div>
                        <div className="income-period">
                          {formatPeriod(income.start_date, income.end_date)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default SortedIncomeList;