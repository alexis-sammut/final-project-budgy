import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SortedPocketViewModal from "../components/SortedPocketViewModal"
import Pocket from "../components/Pocket";
import "../styles/Home.css";
import "../styles/SortedIncomeDetail.css";

function SortedIncomeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sortedIncome, setSortedIncome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPocket, setSelectedPocket] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSortedIncome();
  }, [id]);

  const fetchSortedIncome = async () => {
    try {
      const res = await api.get(`/api/sorted-incomes/${id}/`);
      setSortedIncome(res.data);
    } catch (err) {
      console.error("Error fetching sorted income:", err);
    } finally {
      setLoading(false);
    }
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

  const handlePocketClick = (pocket) => {
    setSelectedPocket(pocket);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPocket(null);
  };

  // Group pockets by category
  const groupPocketsByCategory = () => {
    if (!sortedIncome?.sorted_pockets) return {};

    const grouped = sortedIncome.sorted_pockets.reduce((groups, pocket) => {
      const categoryName = pocket.category_name || 'Uncategorized';
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(pocket);
      return groups;
    }, {});

    // Sort categories
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });

    return sortedCategories.map(category => ({
      category,
      pockets: grouped[category]
    }));
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="home-container">
          <div className="home-content">
            <p>Loading...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!sortedIncome) {
    return (
      <>
        <Navbar />
        <div className="home-container">
          <div className="home-content">
            <p>Sorted income not found</p>
            <button onClick={() => navigate("/sorted-incomes")}>
              Back to List
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const groupedPockets = groupPocketsByCategory();

  return (
    <>
      <Navbar />
      <div className="home-container">
        <div className="home-content">
          {/* Back button */}
          <button 
            className="back-btn"
            onClick={() => navigate("/sorted-incomes")}
          >
            ← Back to Sorted Incomes
          </button>

          <div className="detail-header-section">
            <div className="detail-info-row">
              {/* Income Amount */}
              <div className="detail-income-display">
                <label>Income Sorted</label>
                <div className="detail-amount-display">
                  <span className="detail-currency">€</span>
                  <span className="detail-amount">
                    {parseFloat(sortedIncome.income_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Period Display */}
              <div className="detail-period-display">
                <label>Period</label>
                <div className="period-info-box">
                  {formatPeriod(sortedIncome.start_date, sortedIncome.end_date)}
                </div>
              </div>
            </div>

            {/* Summary info */}
            <div className="detail-summary">
              <div className="summary-item">
                <span className="summary-label">Total Pockets</span>
                <span className="summary-value">{sortedIncome.sorted_pockets?.length || 0}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Created</span>
                <span className="summary-value">{formatDate(sortedIncome.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Pockets Section */}
          <div className="detail-pockets-section">
            {groupedPockets.map(({ category, pockets }) => (
              <div key={category} className="detail-category-section">
                <h2 className="detail-category-title">{category}</h2>
                <div className="detail-pockets-grid">
                  {pockets.map((pocket) => (
                    <Pocket
                      key={pocket.id}
                      pocket={pocket}
                      variant="history"
                      onClick={() => handlePocketClick(pocket)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {showModal && selectedPocket && (
            <SortedPocketViewModal
              pocket={selectedPocket}
              onClose={handleCloseModal}
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default SortedIncomeDetail;