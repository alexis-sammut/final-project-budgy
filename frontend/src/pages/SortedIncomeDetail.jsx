import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SortedPocketViewModal from "../components/SortedPocketViewModal";
import Pocket from "../components/Pocket";
import "../styles/home.css";
import "../styles/sortedincomedetail.css";
import { getUserCurrency } from "../utils/userPreferences";

// Shows details of a past income sorting session
function SortedIncomeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sortedIncome, setSortedIncome] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPocket, setSelectedPocket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Modal state
  const [currency, setCurrency] = useState("€");

  // Load data on mount
  useEffect(() => {
    fetchSortedIncome();
    fetchCategories();
    fetchCurrency();
  }, [id]);

  const fetchCurrency = async () => {
    const userCurrency = await getUserCurrency();
    setCurrency(userCurrency);
  };

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

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/categories/");
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    try {
      await api.delete(`/api/sorted-incomes/${id}/`);
      navigate("/sorted-incomes");
    } catch (err) {
      alert("Failed to delete sorted income.");
      setShowDeleteConfirm(false);
    }
  };

  // Date formatting helpers
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatPeriod = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startStr = start.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
    const endStr = end.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

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
      const categoryName = pocket.category_name || "Uncategorized";
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(pocket);
      return groups;
    }, {});

    // Sort categories
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;

      const categoryA = categories.find((c) => c.name === a);
      const categoryB = categories.find((c) => c.name === b);

      if (!categoryA && !categoryB) return a.localeCompare(b);
      if (!categoryA) return 1;
      if (!categoryB) return -1;

      return (categoryA.order || 0) - (categoryB.order || 0);
    });

    return sortedCategories.map((category) => ({
      category,
      pockets: grouped[category],
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

          {/* Header Summary Card */}
          <div className="detail-header-section">
            <div className="detail-info-row">
              <div className="detail-income-display">
                <label>Income Sorted</label>
                <div className="detail-amount-display">
                  <span className="detail-currency">{currency}</span>
                  <span className="detail-amount">
                    {parseFloat(sortedIncome.income_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="detail-period-display">
                <label>Period</label>
                <div className="period-info-box">
                  {formatPeriod(sortedIncome.start_date, sortedIncome.end_date)}
                </div>
              </div>
            </div>

            <div className="detail-summary">
              <div className="summary-item">
                <span className="summary-label">Total Pockets</span>
                <span className="summary-value">
                  {sortedIncome.sorted_pockets?.length || 0}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Created</span>
                <span className="summary-value">
                  {formatDate(sortedIncome.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Categorized Pockets Grid */}
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
                      currency={currency}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Delete Action */}
          <div style={{ marginTop: "3rem", textAlign: "center", borderTop: "1px solid #eee", paddingTop: "2rem" }}>
            <button 
              className="delete-btn" 
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete this income
            </button>
          </div>

          {/* Details Modal */}
          {showModal && selectedPocket && (
            <SortedPocketViewModal
              pocket={selectedPocket}
              onClose={handleCloseModal}
              currency={currency}
            />
          )}
        </div>
      </div>
      <Footer />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Sorted Income?</h3>
            <p>This will permanently remove this record from your history.</p>
            <div className="confirm-actions">
              <button 
                className="confirm-btn confirm-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="delete-btn"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SortedIncomeDetail;