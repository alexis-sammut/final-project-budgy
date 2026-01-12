import { useState, useEffect, useRef } from "react";
import api from "../api";
import "../styles/PocketForm.css";

function PocketForm({ onClose, onPocketCreated, editingPocket = null }) {
  const [name, setName] = useState(editingPocket?.name || "");
  const [amount, setAmount] = useState(
    editingPocket?.amount ? parseFloat(editingPocket.amount).toFixed(2) : '0'
  );
  const [frequency, setFrequency] = useState(
    editingPocket?.frequency || "none"
  );
  const [color, setColor] = useState(editingPocket?.color || "#0D7377");
  const [category, setCategory] = useState(editingPocket?.category || "");
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // Error message state
  const [items, setItems] = useState([]); // Items in this pocket
  const [localItems, setLocalItems] = useState([]); // Local items for preview before save
  
  const skipOtherUpdate = useRef(false); // Flag to skip "Other" update when adding items

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
    if (editingPocket?.id) {
      fetchItems();
    } else {
      // For new pockets, initialize with empty local items
      updateLocalOtherItem([]);
    }
  }, []);

  // Update local "Other" item whenever amount changes (but not when we're adding items)
  useEffect(() => {
    if (skipOtherUpdate.current) {
      skipOtherUpdate.current = false; // Reset flag
      return;
    }
    
    const regularItems = localItems.filter(item => !item.is_other);
    updateLocalOtherItem(regularItems);
  }, [amount]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/categories/");
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchItems = async () => {
    if (!editingPocket?.id) return;
    try {
      const res = await api.get(`/api/pockets/${editingPocket.id}/items/`);
      console.log("Fetched items:", res.data);
      setItems(res.data);
      setLocalItems(res.data); // Sync local items with fetched
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  // Calculate and update the local "Other" item
  const updateLocalOtherItem = (regularItems) => {
    const currentAmount = parseFloat(amount) || 0;
    const totalRegular = regularItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const leftover = currentAmount - totalRegular;

    // Remove existing "Other" item
    const withoutOther = regularItems.filter(item => !item.is_other);

    if (currentAmount > 0 && leftover > 0) {
      // Add "Other" item with leftover amount
      setLocalItems([
        ...withoutOther,
        {
          id: 'temp-other',
          name: 'Other',
          amount: leftover.toFixed(2),
          is_other: true
        }
      ]);
    } else {
      // No "Other" if pocket amount is 0 or all allocated
      setLocalItems(withoutOther);
    }
  };

  // Add a new item
  const handleAddItem = (itemName, itemAmount) => {
    if (!itemName.trim()) return;
    
    const parsedAmount = parseFloat(itemAmount) || 0;
    
    const newItem = {
      id: `temp-${Date.now()}`,
      name: itemName,
      amount: parsedAmount.toFixed(2),
      is_other: false
    };
    
    const regularItems = localItems.filter(item => !item.is_other);
    const updatedRegular = [...regularItems, newItem];
    
    const currentAmount = parseFloat(amount) || 0;
    const newTotal = updatedRegular.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    // If pocket amount is 0, OR if items total > pocket amount, update pocket amount
    if (currentAmount === 0 || newTotal > currentAmount) {
      skipOtherUpdate.current = true; // Skip the useEffect that would create "Other"
      setAmount(newTotal.toFixed(2));
      setLocalItems(updatedRegular);
    } else {
      // Pocket amount is set, add item and update "Other"
      updateLocalOtherItem(updatedRegular);
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

  // Item management functions
  const handleUpdateItem = async (itemId, updatedData) => {
    if (!editingPocket?.id) return;
    
    try {
      await api.patch(`/api/items/update/${itemId}/`, updatedData);
      await fetchItems(); // Refresh items list
    } catch (error) {
      console.error("Error updating item:", error);
      setError("Failed to update item");
    }
  };

  const handleDeleteLocalItem = async (itemId) => {
    // If it's a real item (not temp), delete from backend
    if (editingPocket?.id && !itemId.toString().startsWith('temp')) {
      try {
        await api.delete(`/api/items/delete/${itemId}/`);
        await fetchItems(); // Refresh to get updated items and "Other"
        return;
      } catch (error) {
        console.error("Error deleting item:", error);
        setError("Failed to delete item");
        return;
      }
    }
    
    // For temp items, just remove locally
    const updated = localItems.filter(item => item.id !== itemId);
    const regularItems = updated.filter(item => !item.is_other);
    
    // Deleting items never reduces pocket amount
    // It just increases the "Other" item
    updateLocalOtherItem(regularItems);
  };

  const handleCreateItem = async (itemData) => {
    if (!editingPocket?.id) return;
    
    try {
      await api.post(`/api/pockets/${editingPocket.id}/items/`, itemData);
      await fetchItems(); // Refresh items list
    } catch (error) {
      console.error("Error creating item:", error);
      setError("Failed to create item");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!editingPocket?.id) return;
    
    try {
      await api.delete(`/api/items/delete/${itemId}/`);
      await fetchItems(); // Refresh items list
    } catch (error) {
      console.error("Error deleting item:", error);
      setError("Failed to delete item");
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
        
        // Save ONLY NEW local items to backend (those with temp IDs)
        const newItems = localItems.filter(item => 
          !item.is_other && 
          item.id.toString().startsWith('temp')
        );
        
        for (const item of newItems) {
          await api.post(`/api/pockets/${editingPocket.id}/items/`, {
            name: item.name,
            amount: item.amount
          });
        }
        
        await fetchItems(); // Refresh items to get updated "Other" item
      } else {
        const res = await api.post("/api/pockets/", pocketData);
        
        // For new pockets, save local items after pocket is created
        const newPocketId = res.data.id;
        const regularItems = localItems.filter(item => !item.is_other);
        for (const item of regularItems) {
          await api.post(`/api/pockets/${newPocketId}/items/`, {
            name: item.name,
            amount: item.amount
          });
        }
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
                  // Allow user to clear/type freely
                  setAmount(e.target.value);
                }}
                onFocus={(e) => {
                  // Select all on focus so user can immediately type new value
                  e.target.select();
                }}
                onBlur={(e) => {
                  // Format to 2 decimals on blur, default to 0 if empty
                  const value = e.target.value;
                  const numValue = parseFloat(value);
                  if (isNaN(numValue) || value === '') {
                    setAmount('0');
                  } else {
                    setAmount(numValue.toFixed(2));
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

        {/* Items List */}
        <div className="form-white-section">
          <div className="items-list">
            <h3 className="items-title">Budget Breakdown</h3>
            
            {/* Regular Items */}
            {localItems.filter(item => !item.is_other).map((item) => (
              <div key={item.id} className="item-row">
                <span className="item-name">{item.name}</span>
                <span className="item-amount">€{parseFloat(item.amount).toFixed(2)}</span>
                <button 
                  className="item-delete-btn"
                  onClick={() => handleDeleteLocalItem(item.id)}
                  title="Remove item"
                >
                  ×
                </button>
                <div className="item-divider"></div>
              </div>
            ))}
            
            {/* Other Item (auto-generated when amount > 0) */}
            {localItems.find(item => item.is_other) && (
              <div className="item-row item-other">
                <span className="item-name">Other</span>
                <input
                  type="number"
                  className="item-amount-editable"
                  value={parseFloat(localItems.find(i => i.is_other).amount).toFixed(2)}
                  step="0.01"
                  min="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    // When user changes "Other" amount, update the total pocket amount
                    const otherAmount = parseFloat(e.target.value) || 0;
                    const regularItems = localItems.filter(item => !item.is_other);
                    const regularTotal = regularItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
                    const newPocketAmount = regularTotal + otherAmount;
                    skipOtherUpdate.current = true; // Don't trigger useEffect
                    setAmount(newPocketAmount.toFixed(2));
                  }}
                  onBlur={(e) => {
                    // Format on blur
                    const value = parseFloat(e.target.value) || 0;
                    const regularItems = localItems.filter(item => !item.is_other);
                    const regularTotal = regularItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
                    setAmount((regularTotal + value).toFixed(2));
                  }}
                />
                <div className="item-divider"></div>
              </div>
            )}
            
            {/* Add Item Input */}
            <div className="add-item-section">
              <input
                type="text"
                className="add-item-name-input"
                placeholder="+ Add item"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const amountInput = e.target.nextElementSibling;
                    if (amountInput) amountInput.focus();
                  }
                }}
                onBlur={(e) => {
                  const nameInput = e.target;
                  const amountInput = e.target.nextElementSibling;
                  
                  // Only add if both name and amount are filled
                  if (nameInput.value && amountInput && amountInput.value) {
                    handleAddItem(nameInput.value, amountInput.value);
                    nameInput.value = '';
                    amountInput.value = '';
                  }
                }}
              />
              <input
                type="number"
                className="add-item-amount-input"
                placeholder="€0.00"
                step="0.01"
                min="0"
                onFocus={(e) => {
                  // Clear placeholder behavior - select all if has value
                  if (e.target.value) e.target.select();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const nameInput = e.target.previousElementSibling;
                    if (nameInput && nameInput.value && e.target.value) {
                      const formattedAmount = parseFloat(e.target.value).toFixed(2);
                      handleAddItem(nameInput.value, formattedAmount);
                      nameInput.value = '';
                      e.target.value = '';
                      nameInput.focus();
                    }
                  }
                }}
                onBlur={(e) => {
                  const amountInput = e.target;
                  const nameInput = e.target.previousElementSibling;
                  
                  // Only add if both name and amount are filled
                  if (nameInput && nameInput.value && amountInput.value) {
                    const formattedAmount = parseFloat(amountInput.value).toFixed(2);
                    handleAddItem(nameInput.value, formattedAmount);
                    nameInput.value = '';
                    amountInput.value = '';
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PocketForm;