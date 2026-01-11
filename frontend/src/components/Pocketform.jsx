import { useState, useEffect } from "react";
import api from "../api";
import "../styles/PocketForm.css";

function PocketForm({ onClose, onPocketCreated, editingPocket = null }) {
  const [name, setName] = useState(editingPocket?.name || "");
  const [amount, setAmount] = useState(editingPocket?.amount || 0);
  const [frequency, setFrequency] = useState(
    editingPocket?.frequency || "none"
  );
  const [color, setColor] = useState(editingPocket?.color || "#0D7377");
  const [category, setCategory] = useState(editingPocket?.category || "");
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // Error message state

  // Show/hide sections
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Predefined color palette
  const colorPalette = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
    "#F8B500",
    "#FF85A2",
    "#7FDBFF",
    "#2ECC71",
    "#0D7377",
    "#E74C3C",
    "#9B59B6",
    "#3498DB",
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/categories/");
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const res = await api.post("/api/categories/", { name: newCategoryName });
      setCategories([...categories, res.data]);
      setCategory(res.data.id);
      setNewCategoryName("");
    } catch (err) {
      alert("Error creating category");
    }
  };

  // NEW: Delete category function
  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (
      !window.confirm(
        `Delete "${categoryName}"? This only works if no pockets are using this category.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/api/categories/delete/${categoryId}/`);
      fetchCategories(); // Refresh the list
      // If the deleted category was selected, clear the selection
      if (category === categoryId) {
        setCategory("");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert("Failed to delete category");
      }
    }
  };

  const adjustAmount = (increment) => {
    const currentAmount = parseFloat(amount) || 0;
    const newAmount = Math.max(0, currentAmount + increment);
    setAmount(newAmount.toFixed(2));
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setError("");

    if (!name.trim()) {
      setError("Please enter a pocket name");
      return;
    }

    // Validation: Amount and frequency must go together
    const hasAmount = amount && parseFloat(amount) > 0;
    const hasFrequency = frequency && frequency !== 'none';

    if (hasAmount && !hasFrequency) {
      setError("Please select a frequency for your recurring amount");
      return;
    }

    if (!hasAmount && hasFrequency) {
      setError("Please enter an amount for your recurring frequency");
      return;
    }

    setLoading(true);

    const pocketData = {
      name,
      amount: parseFloat(amount) || 0,
      frequency,
      color,
      category: category || null,
    };

    try {
      if (editingPocket) {
        await api.patch(`/api/pockets/update/${editingPocket.id}/`, pocketData);
      } else {
        await api.post("/api/pockets/", pocketData);
      }
      onPocketCreated();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Error saving pocket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyLabel = (freq) => {
    const labels = {
      none: "No recurring",
      weekly: "Weekly",
      biweekly: "Biweekly",
      monthly: "Monthly",
    };
    return labels[freq] || freq;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pocket-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-header" style={{ backgroundColor: color }}>
          <div className="form-actions-left">
            <button
              type="button"
              className={`action-btn ${showColorPicker ? "active" : ""}`}
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowCategoryPicker(false);
              }}
              title="Choose color"
            >
            🌈
            </button>
            <button
              type="button"
              className={`action-btn category-btn ${
                showCategoryPicker ? "active" : ""
              }`}
              onClick={() => {
                setShowCategoryPicker(!showCategoryPicker);
                setShowColorPicker(false);
              }}
            >
              {category
                ? categories.find((cat) => cat.id === category)?.name ||
                  "Set category"
                : "Set category"}
            </button>
          </div>
          <button
            type="button"
            className="validate-btn"
            onClick={handleSubmit}
            disabled={loading}
            title="Save pocket"
          >
            ✓
          </button>
        </div>

        {/* Colored section */}
        <div
          className="form-colored-section"
          style={{ backgroundColor: color }}
        >
          {/* Color Picker */}
          {showColorPicker && (
            <div className="color-picker-panel-colored">
              <div className="color-grid">
                {colorPalette.map((paletteColor) => (
                  <button
                    key={paletteColor}
                    type="button"
                    className={`color-swatch ${
                      color === paletteColor ? "selected" : ""
                    }`}
                    style={{ backgroundColor: paletteColor }}
                    onClick={() => setColor(paletteColor)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Category Picker */}
          {showCategoryPicker && (
            <div className="category-picker-panel-colored">
              <div className="category-list">
                <button
                  type="button"
                  className={`category-btn ${!category ? "selected" : ""}`}
                  onClick={() => setCategory("")}
                >
                  No category
                </button>
                {categories.map((cat) => (
                  <div key={cat.id} className="category-item-wrapper">
                    <button
                      type="button"
                      className={`category-btn ${
                        category === cat.id ? "selected" : ""
                      }`}
                      onClick={() => setCategory(cat.id)}
                    >
                      {cat.name}
                    </button>
                    <button
                      type="button"
                      className="delete-category-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id, cat.name);
                      }}
                      title="Delete category"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="create-category-section">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name"
                  className="category-input"
                />
                <button
                  type="button"
                  onClick={createCategory}
                  className="create-category-btn"
                >
                  Create
                </button>
              </div>
            </div>
          )}
          <input
            type="text"
            className="pocket-name-input"
            style={{ backgroundColor: color }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pocket Name"
            maxLength={50}
          />
          <div className="amount-control">
            <button
              type="button"
              className="amount-btn"
              onClick={() => adjustAmount(-10)}
            >
              −
            </button>
            <div className="amount-display">
              <span className="currency">€</span>
              <input
                type="number"
                className="amount-input"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  setAmount(value === '' ? 0 : value);
                }}
                onBlur={(e) => {
                  // If empty on blur, set to 0
                  if (e.target.value === '' || e.target.value === null) {
                    setAmount(0);
                  }
                }}
                step="0.01"
                min="0"
              />
            </div>
            <button
              type="button"
              className="amount-btn"
              onClick={() => adjustAmount(10)}
            >
              +
            </button>
          </div>

          <div className="frequency-selector">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="frequency-select"
              style={{ backgroundColor: color }}
            >
              <option value="none">No recurring</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {/* White section */}
        <div className="form-white-section"></div>
      </div>
    </div>
  );
}

export default PocketForm;