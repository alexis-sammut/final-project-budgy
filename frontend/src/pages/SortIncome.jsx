import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import SortPocketModal from "../components/SortPocketModal";
import DateRangePicker from "../components/DateRangePicker";
import "../styles/SortIncome.css";

function SortIncome() {
  const navigate = useNavigate();
  const [incomeName, setIncomeName] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "", periodType: "1month" });
  const [calculatedPockets, setCalculatedPockets] = useState([]);
  const [allPockets, setAllPockets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPocket, setSelectedPocket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Fetch all pockets on mount
  useEffect(() => {
    fetchAllPockets();
  }, []);

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
      const transformedPockets = res.data.map(pocket => ({
        ...pocket,
        localAmount: parseFloat(pocket.calculated_total),
        localItems: pocket.items.map(item => ({
          ...item,
          localAmount: parseFloat(item.amount),
          id: item.id || `temp-${Date.now()}-${Math.random()}`,
        })),
      }));

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
    return a.localeCompare(b);
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
            <div className="income-input-large">
              <label>Income to Sort</label>
              <div className="amount-input-wrapper-large">
                <span className="currency-large">€</span>
                <input
                  type="number"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Date Range Picker*/}
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              onCalculate={handleCalculate}
            />

            {/* Remaining Amount Display */}
            {income > 0 && dateRange.start && dateRange.end && (
              <div className="remaining-display">
                <div className="remaining-label">Remaining to allocate</div>
                <div className={`remaining-amount ${remaining < 0 ? 'negative' : remaining > 0 ? 'positive' : 'zero'}`}>
                  €{Math.abs(remaining).toFixed(2)}
                  {remaining < 0 && <span className="over-text"> over budget</span>}
                </div>
              </div>
            )}

            {error && <div className="error-message-inline">{error}</div>}
          </div>

          {/* SECTION 2: Pockets Grid */}
          <div className="pockets-section">
            {sortedCategories.map((categoryName) => (
              <div key={categoryName} className="category-section">
                <h2 className="category-title">{categoryName}</h2>
                <div className="pockets-grid">
                  {groupedPockets[categoryName].map((pocket) => {
                    const pocketTotal = pocket.localAmount || 0;
                    const itemsTotal = (pocket.localItems || []).reduce((sum, item) => sum + (item.localAmount || 0), 0);
                    const pocketRemainder = pocketTotal - itemsTotal;
                    const isOverBudget = pocketRemainder < -0.01;
                    const hasRemainder = Math.abs(pocketRemainder) > 0.01;
                    
                    return (
                      <div 
                        key={pocket.id} 
                        className="pocket-card"
                        style={{ backgroundColor: pocket.color }}
                        onClick={() => handlePocketClick(pocket)}
                      >
                        <div className="pocket-content">
                          <h3 className="pocket-name">{pocket.name}</h3>
                          <p className="pocket-amount">€{pocketTotal.toFixed(2)}</p>
                          {hasRemainder && (
                            <p className={`pocket-remainder ${isOverBudget ? 'over-budget' : 'under-budget'}`}>
                              {isOverBudget 
                                ? `€${Math.abs(pocketRemainder).toFixed(2)} over` 
                                : `€${pocketRemainder.toFixed(2)} left`
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                      ? `Reduce allocations - you're €${overBudgetAmount.toFixed(2)} over budget`
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
              onClose={handleCloseModal}
              onUpdate={handlePocketUpdate}
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