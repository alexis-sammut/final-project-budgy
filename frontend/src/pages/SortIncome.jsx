import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import SortPocketModal from "../components/SortPocketModal";
import DateRangePicker from "../components/DateRangePicker";
import Pocket from "../components/Pocket";
import "../styles/SortIncome.css";
import { getUserCurrency } from "../utils/userPreferences";

function SortIncome() {
  const navigate = useNavigate();
  const [incomeName, setIncomeName] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "", periodType: "1month" });
  const [calculatedPockets, setCalculatedPockets] = useState([]);
  const [allPockets, setAllPockets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPocket, setSelectedPocket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [currency, setCurrency] = useState("€");

  // Fetch all pockets on mount
  useEffect(() => {
    fetchAllPockets();
    fetchCategories();
    fetchCurrency();
  }, []);

  const fetchCurrency = async () => {
    const userCurrency = await getUserCurrency();
    setCurrency(userCurrency);
  };

  // Trigger calculation whenever income or dates change
  useEffect(() => {
    if (incomeAmount && dateRange.start && dateRange.end) {
      handleCalculate();
    }
  }, [incomeAmount, dateRange]);

  const fetchAllPockets = async () => {
    try {
      const res = await api.get("/api/pockets/");
      setAllPockets(res.data);
      // Initialize with zeros
      setCalculatedPockets(res.data.map(pocket => ({
        ...pocket,
        localAmount: 0,
        localItems: []
      })));
    } catch (err) {
      console.error("Error fetching pockets:", err);
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

  const handleCalculate = async () => {
    const income = parseFloat(incomeAmount);
    if (isNaN(income) || income <= 0) return;
    if (!dateRange.start || !dateRange.end) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/api/income-sort/calculate/", {
        income_amount: income,
        start_date: dateRange.start,
        end_date: dateRange.end,
        period_type: dateRange.periodType,
      });

      // Transform the response
      const transformedPockets = res.data.map(pocket => {
        // Find the original pocket to get category_name and color
        const originalPocket = allPockets.find(p => p.id === pocket.id);
        
        return {
          ...pocket,
          category_name: originalPocket?.category_name || pocket.category_name,
          color: originalPocket?.color || pocket.color,
          localAmount: parseFloat(pocket.calculated_total),
          localItems: pocket.items.map(item => ({
            ...item,
            localAmount: parseFloat(item.amount),
            id: item.id || `temp-${Date.now()}-${Math.random()}`,
          })),
        };
      });

      setCalculatedPockets(transformedPockets);
    } catch (err) {
      console.error("Error calculating sort:", err);
      setError("Failed to calculate income sort");
    } finally {
      setLoading(false);
    }
  };

  const handlePocketClick = (pocket) => {
    setSelectedPocket(pocket);
    setShowModal(true);
  };

  const handlePocketUpdate = (pocketId, updatedData) => {
    setCalculatedPockets(prev =>
      prev.map(p => p.id === pocketId ? { ...p, ...updatedData } : p)
    );
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPocket(null);
  };

  const handleBackClick = () => {
    setShowExitConfirm(true);
  };

  const handleConfirmExit = () => {
    navigate("/sorted-incomes");
  };

  const handleCancelExit = () => {
    setShowExitConfirm(false);
  };

  const getTotalAllocated = () => {
    return calculatedPockets.reduce((sum, pocket) => {
      return sum + (pocket.localAmount || 0);
    }, 0);
  };

  const getRemaining = () => {
    const income = parseFloat(incomeAmount) || 0;
    const allocated = getTotalAllocated();
    return income - allocated;
  };

  const canFinalize = () => {
    const remaining = getRemaining();
    const isBalanced = remaining >= -0.01 && remaining <= 0.01;
    const notOverBudget = overBudgetAmount <= 0.01;
    return isBalanced && notOverBudget;
  };

  const handleFinalize = async () => {
    if (!canFinalize()) {
      setError("Please allocate all income before finalizing");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const pocketsData = calculatedPockets.map(pocket => ({
        original_pocket_id: pocket.id,
        name: pocket.name,
        color: pocket.color,
        category_name: pocket.category_name,
        total_amount: pocket.localAmount,
        items: pocket.localItems.map(item => ({
          original_item_id: item.id && !item.id.toString().startsWith('temp') ? item.id : null,
          name: item.name,
          amount: item.localAmount,
          is_other: item.is_other || false,
          is_percentage: item.is_percentage || false,
          percentage_value: item.percentage_value || null,
        })),
      }));

      await api.post("/api/income-sort/create/", {
        income_amount: parseFloat(incomeAmount),
        start_date: dateRange.start,
        end_date: dateRange.end,
        pockets: pocketsData,
      });

      // Redirect to sorted incomes list
      navigate("/sorted-incomes");
    } catch (err) {
      console.error("Error saving income sort:", err);
      setError("Failed to save income sort");
    } finally {
      setLoading(false);
    }
  };

  // Group pockets by category
  const groupedPockets = calculatedPockets.reduce((groups, pocket) => {
    const categoryName = pocket.category_name || 'Uncategorized';
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    groups[categoryName].push(pocket);
    return groups;
  }, {});

  const sortedCategories = Object.keys(groupedPockets).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    
    const categoryA = categories.find(c => c.name === a);
    const categoryB = categories.find(c => c.name === b);
    
    if (!categoryA && !categoryB) return a.localeCompare(b);
    if (!categoryA) return 1;
    if (!categoryB) return -1;
    
    return (categoryA.order || 0) - (categoryB.order || 0);
  });

  const remaining = getRemaining();
  const totalAllocated = getTotalAllocated();
  const income = parseFloat(incomeAmount) || 0;
  const overBudgetAmount = totalAllocated > income ? totalAllocated - income : 0;

  return (
    <div className="sort-income-app">
      {/* App Header */}
      <div className="sort-app-header">
        <button className="back-arrow-btn" onClick={handleBackClick}>
          ←
        </button>
        <input
          type="text"
          className="income-name-input"
          placeholder="Name this income sort"
          value={incomeName}
          onChange={(e) => setIncomeName(e.target.value)}
        />
        <div className="header-spacer"></div>
      </div>

      <div className="sort-income-content">

          {/* SECTION 1: Income Input & Status */}
          <div className="income-section">
            <div className="income-inputs-row">
              {/* Left Column: Income Input + Remaining Display */}
              <div className="income-left-column">
                <div className="income-input-large">
                  <label>Income to Sort</label>
                  <div className="amount-input-wrapper-large">
                    <span className="currency-large">{currency}</span>
                    <input
                      type="number"
                      value={incomeAmount}
                      onChange={(e) => setIncomeAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  {/* Date Range Display */}
                  {dateRange.start && dateRange.end && dateRange.periodType !== 'oneoff' && (
                    <div className="date-range-display">
                      {new Date(dateRange.start).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })} - {new Date(dateRange.end).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  )}
                </div>

                {/* Remaining Amount Display */}
                {income > 0 && dateRange.start && dateRange.end && (
                  <div className="remaining-display-compact">
                    <div className="remaining-label-compact">
                      {remaining < 0 ? 'Over Budget' : 'Amount Left to Allocate'}
                    </div>
                    <div className={`remaining-amount-compact ${remaining < 0 ? 'negative' : 'positive'}`}>
                      {remaining < 0 && '−'}{currency}{Math.abs(remaining).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Date Range Picker */}
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                onCalculate={handleCalculate}
              />
            </div>

            {error && <div className="error-message-inline">{error}</div>}
          </div>

          {/* SECTION 2: Pockets Grid */}
          <div className="pockets-section">
            {sortedCategories.map((categoryName) => (
              <div key={categoryName} className="category-section">
                <h2 className="category-title">{categoryName}</h2>
                <div className="pockets-grid">
                  {groupedPockets[categoryName].map((pocket) => (
                    <Pocket
                      key={pocket.id}
                      pocket={pocket}
                      variant="sorting"
                      onClick={() => handlePocketClick(pocket)}
                      currency={currency}
                    />
                  ))}
                </div>
              </div>
            ))}

            {income > 0 && dateRange.start && dateRange.end && (
              <div className="finalize-section">
                <button
                  className={`finalize-btn ${!canFinalize() ? 'disabled' : ''}`}
                  onClick={handleFinalize}
                  disabled={!canFinalize() || loading}
                >
                  {loading ? "Saving..." : "Finalize Sort"}
                </button>
                {!canFinalize() && (
                  <p className="finalize-hint">
                    {overBudgetAmount > 0.01
                      ? `Reduce allocations - you're ${currency}${overBudgetAmount.toFixed(2)} over budget`
                      : remaining > 0.01
                      ? "Allocate all remaining income to finalize"
                      : "Reduce allocations - you're over budget"}
                  </p>
                )}
              </div>
            )}
          </div>

        {showModal && selectedPocket && (
          <SortPocketModal
            pocket={selectedPocket}
            incomeAmount={income}
            overBudgetAmount={overBudgetAmount}
            remainingIncome={remaining}
            onClose={handleCloseModal}
            onUpdate={handlePocketUpdate}
            currency={currency}
          />
        )}

        {/* Exit Confirmation Modal */}
        {showExitConfirm && (
          <div className="modal-overlay" onClick={handleCancelExit}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Exit Without Saving?</h3>
              <p>Your income sort hasn't been finalized. All changes will be lost.</p>
              <div className="confirm-actions">
                <button className="confirm-btn confirm-cancel" onClick={handleCancelExit}>
                  Continue Sorting
                </button>
                <button className="confirm-btn confirm-delete" onClick={handleConfirmExit}>
                  Exit Anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SortIncome;