import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/home.css";
import "../styles/sortedincomelist.css";
import { getUserCurrency } from "../utils/userPreferences";

// Shows list of past income sortings
function SortedIncomeList() {
  const [sortedIncomes, setSortedIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("€");
  const navigate = useNavigate();

  // Load data on mount
  useEffect(() => {
    fetchSortedIncomes();
    fetchCurrency();
  }, []);

  const fetchCurrency = async () => {
    const userCurrency = await getUserCurrency();
    setCurrency(userCurrency);
  };

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

  // Organise incomes by year
  const groupByYear = () => {
    const grouped = {};
    
    sortedIncomes.forEach((income) => {
      const year = new Date(income.start_date).getFullYear();
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(income);
    });

    // Sort years descending
    const sortedYears = Object.keys(grouped).sort((a, b) => b - a);
    
    return sortedYears.map(year => ({
      year,
      incomes: grouped[year].sort((a, b) => 
        new Date(b.start_date) - new Date(a.start_date)
      )
    }));
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric',
      month: 'short', 
      year: 'numeric'
    });
  };

  // Format full date range string
  const formatPeriod = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startStr = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    
    return `${startStr} — ${endStr}`;
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
                        
                        
                        {/* Amount display */}
                        <div>
                          <span className="income-currency">{currency}</span>
                          <span className="income-amount">
                            {parseFloat(income.income_amount).toFixed(2)}
                          </span>
                          {income.name && (
                          <div className="income-name">
                          <br></br>
                          {income.name}</div>
                        )}
                        </div>
                        
                        {/* Bottom details */}
                        <div className="income-info">
                          <div className="income-period">
                            {formatPeriod(income.start_date, income.end_date)}
                          </div>
                          <div className="income-meta">
                            <span className="income-pockets-count">
                              {income.sorted_pockets?.length || 0} pockets
                            </span>
                          </div>
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