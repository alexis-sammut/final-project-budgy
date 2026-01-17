import { useState, useEffect, useRef } from "react";
import api from "../api";
import "../styles/PocketForm.css";
import { convertAmount, formatAmountDisplay, hasMixedFrequencies } from "../utils/frequencyUtils";

function PocketForm({ onClose, onPocketCreated, editingPocket = null }) {
  const [name, setName] = useState(editingPocket?.name || "");
  const [amount, setAmount] = useState(
    editingPocket?.amount ? parseFloat(editingPocket.amount).toFixed(2) : '0'
  );
  const [frequency, setFrequency] = useState(
    editingPocket?.frequency || "monthly"
  );
  const [color, setColor] = useState(editingPocket?.color || "#0D7377");
  const [category, setCategory] = useState(editingPocket?.category || "");
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [localItems, setLocalItems] = useState([]);
  
  const [storedAmount, setStoredAmount] = useState(
    editingPocket?.amount ? parseFloat(editingPocket.amount) : 0
  );
  const [storedFrequency, setStoredFrequency] = useState(
    editingPocket?.frequency || "monthly"
  );
  
  const skipOtherUpdate = useRef(false);
  const isManuallyEditing = useRef(false);
  const [editingOtherAmount, setEditingOtherAmount] = useState(null);
  const [editingItemAmount, setEditingItemAmount] = useState(null);
  const [newItemFrequency, setNewItemFrequency] = useState(frequency);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  const frequencies = [
    { value: 'daily', label: 'Daily', code: 'D' },
    { value: 'weekly', label: 'Weekly', code: 'W' },
    { value: 'biweekly', label: 'Biweekly', code: 'B' },
    { value: '4-week', label: 'Per 4 Weeks', code: '4W' },
    { value: 'monthly', label: 'Monthly', code: 'M' },
    { value: 'quarterly', label: 'Quarterly', code: 'Q' },
    { value: 'yearly', label: 'Yearly', code: 'Y' },
  ];

  const colorPalette = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
    "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2",
    "#F8B500", "#FF85A2", "#7FDBFF", "#2ECC71",
    "#0D7377", "#E74C3C", "#9B59B6", "#3498DB",
  ];

  useEffect(() => {
    fetchCategories();
    if (editingPocket?.id) {
      fetchItems();
    }
  }, []);

  useEffect(() => {
    if (skipOtherUpdate.current) {
      skipOtherUpdate.current = false;
      return;
    }
    
    if (!isManuallyEditing.current && localItems.length > 0) {
      updatePocketTotal(localItems);
    }
  }, [localItems]);
  

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
      setLocalItems(res.data);
      
      skipOtherUpdate.current = true;
      updatePocketTotal(res.data);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  const updatePocketTotal = (items) => {
    const total = items.reduce((sum, item) => {
      const itemAmount = parseFloat(item.amount) || 0;
      const itemFreq = item.frequency || frequency;
      
      if (itemFreq !== frequency) {
        const converted = convertAmount(itemAmount, itemFreq, frequency);
        return sum + converted;
      }
      return sum + itemAmount;
    }, 0);
    
    setAmount(formatAmountDisplay(total));
    setStoredAmount(total);
  };
  
  const createOtherFromAmount = (pocketAmount) => {
    const existingOther = localItems.find(item => item.is_other);
    
    if (existingOther) {
      const updatedItems = localItems.map(item => 
        item.is_other ? {...item, amount: parseFloat(pocketAmount).toFixed(2), frequency} : item
      );
      setLocalItems(updatedItems);
    } else {
      const otherItem = {
        id: 'temp-other',
        name: 'Other',
        amount: parseFloat(pocketAmount).toFixed(2),
        frequency,
        is_other: true
      };
      setLocalItems([...localItems, otherItem]);
    }
  };

  const handleAddItem = (itemName, itemAmount, itemFrequency = null) => {
    if (!itemName.trim()) return;
    
    const parsedAmount = parseFloat(itemAmount) || 0;
    
    const newItem = {
      id: `temp-${Date.now()}`,
      name: itemName,
      amount: parsedAmount,
      amount_display: parsedAmount,
      frequency: itemFrequency || frequency,
      is_other: false
    };
    
    const updatedItems = [...localItems, newItem];
    setLocalItems(updatedItems);
    
    skipOtherUpdate.current = true;
    updatePocketTotal(updatedItems);
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

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`Delete "${categoryName}"? This only works if no pockets are using this category.`)) {
      return;
    }

    try {
      await api.delete(`/api/categories/delete/${categoryId}/`);
      fetchCategories();
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

  const handleUpdateItem = async (itemId, updatedData) => {
    if (!editingPocket?.id) return;
    
    try {
      await api.patch(`/api/items/update/${itemId}/`, updatedData);
      await fetchItems();
    } catch (error) {
      console.error("Error updating item:", error);
      setError("Failed to update item");
    }
  };

  const handleDeleteLocalItem = async (itemId) => {
    if (editingPocket?.id && !itemId.toString().startsWith('temp')) {
      try {
        await api.delete(`/api/items/delete/${itemId}/`);
        await fetchItems();
        return;
      } catch (error) {
        console.error("Error deleting item:", error);
        setError("Failed to delete item");
        return;
      }
    }
    
    const updatedItems = localItems.filter(item => item.id !== itemId);
    setLocalItems(updatedItems);
    
    skipOtherUpdate.current = true;
    updatePocketTotal(updatedItems);
  };

  const handleCreateItem = async (itemData) => {
    if (!editingPocket?.id) return;
    
    try {
      await api.post(`/api/pockets/${editingPocket.id}/items/`, itemData);
      await fetchItems();
    } catch (error) {
      console.error("Error creating item:", error);
      setError("Failed to create item");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!editingPocket?.id) return;
    
    try {
      await api.delete(`/api/items/delete/${itemId}/`);
      await fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      setError("Failed to delete item");
    }
  };

  const adjustAmount = (increment) => {
    const currentAmount = parseFloat(amount) || 0;
    const newAmount = Math.max(0, currentAmount + increment);
    setAmount(newAmount.toFixed(2));
    setStoredAmount(newAmount);
  };
  
  const handleFrequencyChange = (newFrequency) => {
    const convertedAmount = convertAmount(storedAmount, frequency, newFrequency);
    
    setAmount(formatAmountDisplay(convertedAmount));
    setStoredAmount(convertedAmount);
    setFrequency(newFrequency);
    setNewItemFrequency(newFrequency);
    
    const updatedItems = localItems.map(item => {
      if (item.is_other) {
        const convertedOtherAmount = convertAmount(item.amount, frequency, newFrequency);
        return {
          ...item,
          amount: convertedOtherAmount,
          amount_display: parseFloat(convertedOtherAmount.toFixed(2)),
          frequency: newFrequency
        };
      }
      return item;
    });
    setLocalItems(updatedItems);
    
    isManuallyEditing.current = false;
  };

  const handleSubmit = async () => {
    setError("");

    if (!name.trim()) {
      setError("Please enter a pocket name");
      return;
    }

    setLoading(true);

    const pocketData = {
      name,
      amount: parseFloat((parseFloat(storedAmount) || 0).toFixed(10)),
      frequency,
      color,
      category: category || null,
    };

    try {
      if (editingPocket) {
        await api.patch(`/api/pockets/update/${editingPocket.id}/`, pocketData);
        
        const newItems = localItems.filter(item => 
          item.id.toString().startsWith('temp')
        );
        
        for (const item of newItems) {
          await api.post(`/api/pockets/${editingPocket.id}/items/`, {
            name: item.name,
            amount: parseFloat((parseFloat(item.amount) || 0).toFixed(10)),
            frequency: item.frequency || frequency,
            is_other: item.is_other || false
          });
        }
        
        await fetchItems();
      } else {
        const res = await api.post("/api/pockets/", pocketData);
        
        if (localItems.length > 0) {
          const newPocketId = res.data.id;
          for (const item of localItems) {
            await api.post(`/api/pockets/${newPocketId}/items/`, {
              name: item.name,
              amount: parseFloat((parseFloat(item.amount) || 0).toFixed(10)),
              frequency: item.frequency || frequency,
              is_other: item.is_other || false
            });
          }
        }
      }
      onPocketCreated();
      onClose();
    } catch (err) {
      console.error("Error saving pocket:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      const errorMsg = err.response?.data?.detail 
        || err.response?.data?.message 
        || "Error saving pocket. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
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
              className={`action-btn category-btn ${showCategoryPicker ? "active" : ""}`}
              onClick={() => {
                setShowCategoryPicker(!showCategoryPicker);
                setShowColorPicker(false);
              }}
            >
              {category
                ? categories.find((cat) => cat.id === category)?.name || "Set category"
                : "Set category"}
            </button>
            <div className="frequency-selector-wrapper">
              <select
                className="frequency-selector"
                value={frequency}
                onChange={(e) => handleFrequencyChange(e.target.value)}
                title="Expense frequency"
              >
                {frequencies.map(freq => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
              <span className="frequency-display-code">
                {frequencies.find(f => f.value === frequency)?.code}
              </span>
            </div>
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

        <div className="form-colored-section" style={{ backgroundColor: color }}>
          {showColorPicker && (
            <div className="color-picker-panel-colored">
              <div className="color-grid">
                {colorPalette.map((paletteColor) => (
                  <button
                    key={paletteColor}
                    type="button"
                    className={`color-swatch ${color === paletteColor ? "selected" : ""}`}
                    style={{ backgroundColor: paletteColor }}
                    onClick={() => setColor(paletteColor)}
                  />
                ))}
              </div>
            </div>
          )}

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
                      className={`category-btn ${category === cat.id ? "selected" : ""}`}
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
          <div className="pocket-name-row">
            <input
              type="text"
              className="pocket-name-input"
              style={{ backgroundColor: color }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pocket Name"
              maxLength={50}
            />
            
            {(() => {
              const monthlyGroup = ['monthly', 'quarterly'];
              const otherGroup = ['daily', 'weekly', 'biweekly', '4-week', 'yearly'];
              
              const pocketInMonthlyGroup = monthlyGroup.includes(frequency);
              const pocketInOtherGroup = otherGroup.includes(frequency);
              
              const allItemsInMonthlyGroup = localItems
                .filter(item => !item.is_other)
                .every(item => monthlyGroup.includes(item.frequency));
              
              const allItemsInOtherGroup = localItems
                .filter(item => !item.is_other)
                .every(item => otherGroup.includes(item.frequency));
              
              const shouldShow = !(
                (pocketInMonthlyGroup && allItemsInMonthlyGroup) ||
                (pocketInOtherGroup && allItemsInOtherGroup)
              );
              
              if (!shouldShow) return null;
              
              return (
                <div 
                  className="amount-info-message"
                  onMouseEnter={(e) => {
                    const icon = e.currentTarget.querySelector('.info-icon-circle');
                    const tooltip = e.currentTarget.querySelector('.info-text');
                    if (icon && tooltip) {
                      const rect = icon.getBoundingClientRect();
                      tooltip.style.top = `${rect.bottom + 8}px`;
                      tooltip.style.left = `${rect.left - 8}px`;
                    }
                  }}
                >
                  <div className="info-icon-circle">
                    <span>i</span>
                  </div>
                  <span className="info-text">
                    This is a display based on a 30-day month. Exact amount will be displayed when sorting income, based on the appropriate month length.
                  </span>
                </div>
              );
            })()}
          </div>
          <div className="amount-control">
            <div className="amount-display">
              <span className="currency">€</span>
              <input
                type="number"
                className="amount-input"
                value={amount}
                onChange={(e) => {
                  isManuallyEditing.current = true;
                  setAmount(e.target.value);
                }}
                onFocus={(e) => {
                  isManuallyEditing.current = true;
                  e.target.select();
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  const numValue = parseFloat(value);
                  
                  if (isNaN(numValue) || value === '') {
                    setAmount('0');
                    setStoredAmount(0);
                    const updatedItems = localItems.filter(item => !item.is_other);
                    setLocalItems(updatedItems);
                  } else {
                    const regularItems = localItems.filter(item => !item.is_other);
                    const itemsTotal = regularItems.reduce((sum, item) => {
                      const itemAmount = parseFloat(item.amount) || 0;
                      const itemFreq = item.frequency || frequency;
                      if (itemFreq !== frequency) {
                        return sum + convertAmount(itemAmount, itemFreq, frequency);
                      }
                      return sum + itemAmount;
                    }, 0);
                    
                    if (numValue < itemsTotal && regularItems.length > 0) {
                      const freqLabel = (frequencies.find(f => f.value === frequency)?.label || frequency).toLowerCase();
                      
                      setError(<>Pocket amount cannot be less than items total<br/>€{formatAmountDisplay(itemsTotal)} {freqLabel}</>);
                      const minAmount = itemsTotal;
                      setAmount(formatAmountDisplay(minAmount));
                      setStoredAmount(minAmount);
                      
                      const updatedItems = localItems.filter(item => !item.is_other);
                      setLocalItems(updatedItems);
                      
                      setTimeout(() => setError(""), 5000);
                      isManuallyEditing.current = false;
                      return;
                    }
                    
                    const formatted = formatAmountDisplay(numValue);
                    setAmount(formatted);
                    setStoredAmount(numValue);
                    
                    if (numValue === 0) {
                      const updatedItems = localItems.filter(item => !item.is_other);
                      setLocalItems(updatedItems);
                    } else {
                      const otherItem = localItems.find(item => item.is_other);
                      
                      if (regularItems.length === 0) {
                        createOtherFromAmount(numValue);
                      } else {
                        const newOtherAmount = numValue - itemsTotal;
                        
                        if (otherItem && newOtherAmount > 0) {
                          const updatedItems = localItems.map(item =>
                            item.is_other ? {
                              ...item, 
                              amount: newOtherAmount, 
                              amount_display: newOtherAmount,
                              frequency
                            } : item
                          );
                          setLocalItems(updatedItems);
                        } else if (!otherItem && newOtherAmount > 0) {
                          createOtherFromAmount(newOtherAmount);
                        } else if (otherItem && newOtherAmount <= 0) {
                          const updatedItems = localItems.filter(item => !item.is_other);
                          setLocalItems(updatedItems);
                        }
                      }
                    }
                  }
                  isManuallyEditing.current = false;
                }}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="form-white-section">
          <div className="items-list">
            <h3 className="items-title">Budget Breakdown</h3>
            
            {localItems.filter(item => !item.is_other).map((item) => (
              <div key={item.id} className="item-row">
                <button 
                  className="item-delete-btn"
                  onClick={() => handleDeleteLocalItem(item.id)}
                  title="Remove item"
                >
                  −
                </button>
                <span className="item-name">{item.name}</span>
                <select
                  className="item-frequency-selector"
                  value={item.frequency}
                  onChange={(e) => {
                    const updated = localItems.map(i => 
                      i.id === item.id ? {...i, frequency: e.target.value} : i
                    );
                    setLocalItems(updated);
                  }}
                  title="Item frequency"
                >
                  {frequencies.map(freq => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className="item-amount-input"
                  value={editingItemAmount?.[item.id] !== undefined 
                    ? editingItemAmount[item.id] 
                    : (item.amount_display || parseFloat(item.amount))}
                  onFocus={() => {
                    setEditingItemAmount({
                      ...editingItemAmount,
                      [item.id]: item.amount_display || parseFloat(item.amount)
                    });
                  }}
                  onChange={(e) => {
                    setEditingItemAmount({
                      ...editingItemAmount,
                      [item.id]: e.target.value
                    });
                  }}
                  onBlur={(e) => {
                    const newAmount = parseFloat(e.target.value) || 0;
                    
                    const updatedItems = localItems.map(i => 
                      i.id === item.id ? {
                        ...i,
                        amount: newAmount,
                        amount_display: newAmount
                      } : i
                    );
                    setLocalItems(updatedItems);
                    
                    skipOtherUpdate.current = true;
                    updatePocketTotal(updatedItems);
                    
                    const newEditingState = {...editingItemAmount};
                    delete newEditingState[item.id];
                    setEditingItemAmount(newEditingState);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.target.blur();
                    }
                  }}
                  step="0.01"
                  min="0"
                />
                <div className="item-divider"></div>
              </div>
            ))}
            
            {localItems.find(item => item.is_other) && (() => {
              const otherItem = localItems.find(item => item.is_other);
              
              return (
                <div className="item-row item-other">
                  <button 
                    className="item-delete-btn"
                    onClick={() => handleDeleteLocalItem(otherItem.id)}
                    title="Remove Other"
                  >
                    −
                  </button>
                  <span className="item-name">Other</span>
                  <span className="item-frequency-label-other">
                    {frequencies.find(f => f.value === frequency)?.label}
                  </span>
                  <input
                    type="number"
                    className="item-amount-input"
                    value={editingOtherAmount !== null ? editingOtherAmount : (otherItem.amount_display || parseFloat(otherItem.amount))}
                    onFocus={() => {
                      setEditingOtherAmount(otherItem.amount_display || parseFloat(otherItem.amount));
                    }}
                    onChange={(e) => {
                      setEditingOtherAmount(e.target.value);
                    }}
                    onBlur={(e) => {
                      const newAmount = parseFloat(e.target.value) || 0;
                      
                      const updatedItems = localItems.map(item => 
                        item.is_other ? {
                          ...item, 
                          amount: newAmount,
                          amount_display: newAmount
                        } : item
                      );
                      setLocalItems(updatedItems);
                      
                      skipOtherUpdate.current = true;
                      updatePocketTotal(updatedItems);
                      
                      setEditingOtherAmount(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.target.blur();
                      }
                    }}
                    step="0.01"
                    min="0"
                  />
                  <div className="item-divider"></div>
                </div>
              );
            })()}
            
            <div className="add-item-section">
              <input
                type="text"
                className="add-item-name-input"
                placeholder="+ Add item"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const freqSelect = e.target.nextElementSibling;
                    if (freqSelect) freqSelect.focus();
                  }
                }}
              />
              <select
                className="add-item-frequency-selector"
                value={newItemFrequency}
                onChange={(e) => setNewItemFrequency(e.target.value)}
                title="Item frequency"
              >
                {frequencies.map(freq => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="add-item-amount-input"
                placeholder="€0.00"
                step="0.01"
                min="0"
                onFocus={(e) => {
                  if (e.target.value) e.target.select();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const nameInput = e.target.previousElementSibling.previousElementSibling;
                    if (nameInput && nameInput.value && e.target.value) {
                      handleAddItem(nameInput.value, e.target.value, newItemFrequency);
                      nameInput.value = '';
                      e.target.value = '';
                      setNewItemFrequency(frequency);
                      nameInput.focus();
                    }
                  }
                }}
                onBlur={(e) => {
                  const amountInput = e.target;
                  const freqSelect = e.target.previousElementSibling;
                  const nameInput = freqSelect.previousElementSibling;
                  
                  if (nameInput && nameInput.value && amountInput.value) {
                    handleAddItem(nameInput.value, amountInput.value, newItemFrequency);
                    nameInput.value = '';
                    amountInput.value = '';
                    setNewItemFrequency(frequency);
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