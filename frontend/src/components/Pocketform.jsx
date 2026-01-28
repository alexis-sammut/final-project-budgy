import { useState, useEffect, useRef } from "react";
import api from "../api";
import "../styles/PocketForm.css";
import { convertAmount, formatAmountDisplay, hasMixedFrequencies } from "../utils/frequencyUtils";

function PocketForm({ onClose, onPocketCreated, editingPocket = null }) {
  const [name, setName] = useState(editingPocket?.name || "");
  const [amount, setAmount] = useState(
    editingPocket?.amount ? parseFloat(editingPocket.amount).toFixed(2) : '0.00'
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
  const [newItemDueDate, setNewItemDueDate] = useState('');

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  
  const frequencies = [
    { value: 'daily', label: 'Daily', code: 'D' },
    { value: 'weekly', label: 'Weekly', code: 'W' },
    { value: 'biweekly', label: 'Biweekly', code: 'B' },
    { value: '4-week', label: 'Per 4 Weeks', code: '4W' },
    { value: 'monthly', label: 'Monthly', code: 'M' },
    { value: 'yearly', label: 'Yearly', code: 'Y' },
  ];

  const itemFrequencies = [
    { value: 'daily', label: 'Daily', code: 'D' },
    { value: 'weekly', label: 'Weekly', code: 'W' },
    { value: 'biweekly', label: 'Biweekly', code: 'B' },
    { value: '4-week', label: 'Per 4 Weeks', code: '4W' },
    { value: 'monthly', label: 'Monthly', code: 'M' },
    { value: 'yearly', label: 'Yearly', code: 'Y' },
    { value: 'percentage', label: 'Ratio', code: '%' },
  ];

  // Array for due date dropdown (1-31)
  const dueDates = Array.from({ length: 31 }, (_, i) => i + 1);


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
      if (item.is_percentage) return sum;
      
      const itemAmount = parseFloat(item.amount) || 0;
      const itemFreq = item.frequency || frequency;
      
      if (itemFreq !== frequency) {
        const converted = convertAmount(itemAmount, itemFreq, frequency);
        return sum + converted;
      }
      return sum + itemAmount;
    }, 0);
    
    setAmount(total.toFixed(2));
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

  const handleAddItem = (itemName, itemAmount, itemFrequency = null, isPercentage = false, dueDate = null) => {
    if (!itemName.trim()) return;
    
    const parsedAmount = parseFloat(itemAmount) || 0;
    
    if (isPercentage && (parsedAmount <= 0 || parsedAmount >= 100)) {
      setError("Percentage must be between 0 and 100");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    // Validate due date for monthly items
    if (itemFrequency === 'monthly' && !dueDate) {
      setError("Monthly items require a due date");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    const newItem = {
      id: `temp-${Date.now()}`,
      name: itemName,
      amount: isPercentage ? 0 : parsedAmount,
      amount_display: isPercentage ? 0 : parsedAmount,
      frequency: isPercentage ? 'percentage' : (itemFrequency || frequency),
      due_date: itemFrequency === 'monthly' ? dueDate : null,
      is_other: false,
      is_percentage: isPercentage,
      percentage_value: isPercentage ? parsedAmount : null
    };
    
    const updatedItems = [...localItems, newItem];
    setLocalItems(updatedItems);
    
    if (!isPercentage) {
      skipOtherUpdate.current = true;
      updatePocketTotal(updatedItems);
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const res = await api.post("/api/categories/", { name: newCategoryName });
      setCategories([...categories, res.data]);
      setCategory(res.data.id);
      setNewCategoryName("");
      setShowCreateCategory(false);
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
    
    setAmount(convertedAmount.toFixed(2));
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
        
        // Create new items (temp IDs)
        const newItems = localItems.filter(item => 
          item.id.toString().startsWith('temp')
        );
        
        for (const item of newItems) {
          const itemData = {
            name: item.name,
            is_other: item.is_other || false,
            is_percentage: item.is_percentage || false
          };
          
          if (item.is_percentage) {
            itemData.percentage_value = parseFloat(item.percentage_value);
            itemData.frequency = 'percentage';
          } else {
            itemData.amount = parseFloat((parseFloat(item.amount) || 0).toFixed(10));
            itemData.frequency = item.frequency || frequency;
            if (item.frequency === 'monthly' && item.due_date) {
              itemData.due_date = item.due_date;
            }
          }
          
          await api.post(`/api/pockets/${editingPocket.id}/items/`, itemData);
        }
        
        // Update existing items (non-temp, non-other)
        // We exclude "Other" because the backend recalculates it automatically
        const existingItems = localItems.filter(item => 
          !item.id.toString().startsWith('temp') && !item.is_other
        );
        
        for (const item of existingItems) {
          const itemData = {
            name: item.name,
          };
          
          if (item.is_percentage) {
            itemData.percentage_value = parseFloat(item.percentage_value);
            itemData.frequency = 'percentage';
            itemData.is_percentage = true;
          } else {
            itemData.amount = parseFloat((parseFloat(item.amount) || 0).toFixed(10));
            itemData.frequency = item.frequency || frequency;
            itemData.is_percentage = false;
            if (item.frequency === 'monthly' && item.due_date) {
              itemData.due_date = item.due_date;
            }
          }
          
          await api.patch(`/api/items/update/${item.id}/`, itemData);
        }
        
        await fetchItems();
      } else {
        const res = await api.post("/api/pockets/", pocketData);
        
        if (localItems.length > 0) {
          const newPocketId = res.data.id;
          for (const item of localItems) {
            const itemData = {
              name: item.name,
              is_other: item.is_other || false,
              is_percentage: item.is_percentage || false
            };
            
            if (item.is_percentage) {
              itemData.percentage_value = parseFloat(item.percentage_value);
              itemData.frequency = 'percentage';
            } else {
              itemData.amount = parseFloat((parseFloat(item.amount) || 0).toFixed(10));
              itemData.frequency = item.frequency || frequency;
              if (item.frequency === 'monthly' && item.due_date) {
                itemData.due_date = item.due_date;
              }
            }
            
            await api.post(`/api/pockets/${newPocketId}/items/`, itemData);
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
                setShowFrequencyPicker(false);
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
                setShowFrequencyPicker(false);
              }}
            >
              {category
                ? categories.find((cat) => cat.id === category)?.name || "Set category"
                : "Set category"}
            </button>
            <button
              type="button"
              className={`action-btn ${showFrequencyPicker ? "active" : ""}`}
              onClick={() => {
                setShowFrequencyPicker(!showFrequencyPicker);
                setShowColorPicker(false);
                setShowCategoryPicker(false);
              }}
              title="Expense frequency"
            >
              {frequencies.find(f => f.value === frequency)?.label}
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
                <button
                  type="button"
                  className={`category-btn add-category-btn ${showCreateCategory ? "active" : ""}`}
                  onClick={() => setShowCreateCategory(!showCreateCategory)}
                  title="Add new category"
                >
                  +
                </button>
              </div>

              {showCreateCategory && (
                <div className="create-category-section">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        createCategory();
                      } else if (e.key === 'Escape') {
                        setShowCreateCategory(false);
                        setNewCategoryName("");
                      }
                    }}
                    placeholder="New category name"
                    className="category-input"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={createCategory}
                    className="create-category-btn"
                  >
                    Create
                  </button>
                </div>
              )}
            </div>
          )}

          {showFrequencyPicker && (
            <div className="category-picker-panel-colored">
              <div className="category-list">
                {frequencies.map((freq) => (
                  <button
                    key={freq.value}
                    type="button"
                    className={`category-btn ${frequency === freq.value ? "selected" : ""}`}
                    onClick={() => {
                      handleFrequencyChange(freq.value);
                    }}
                  >
                    {freq.label}
                  </button>
                ))}
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
                .filter(item => !item.is_other && !item.is_percentage)
                .every(item => monthlyGroup.includes(item.frequency));
              
              const allItemsInOtherGroup = localItems
                .filter(item => !item.is_other && !item.is_percentage)
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
                    setAmount('0.00');
                    setStoredAmount(0);
                    const updatedItems = localItems.filter(item => !item.is_other);
                    setLocalItems(updatedItems);
                  } else {
                    const regularItems = localItems.filter(item => !item.is_other && !item.is_percentage);
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
                      setAmount(minAmount.toFixed(2));
                      setStoredAmount(minAmount);
                      
                      const updatedItems = localItems.filter(item => !item.is_other);
                      setLocalItems(updatedItems);
                      
                      setTimeout(() => setError(""), 5000);
                      isManuallyEditing.current = false;
                      return;
                    }
                    
                    setAmount(numValue.toFixed(2));
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
            
            {localItems.filter(item => !item.is_other && !item.is_percentage).map((item) => (
              <div key={item.id} className="item-row item-recurring">
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
                  onChange={async (e) => {
                    const newFrequency = e.target.value;
                    const updated = localItems.map(i => 
                      i.id === item.id ? {...i, frequency: newFrequency} : i
                    );
                    setLocalItems(updated);
                    
                    // Save to backend if it's an existing item
                    if (editingPocket?.id && !item.id.toString().startsWith('temp')) {
                      try {
                        await api.patch(`/api/items/update/${item.id}/`, {
                          frequency: newFrequency
                        });
                      } catch (error) {
                        console.error("Error updating frequency:", error);
                        setError("Failed to update frequency");
                        setTimeout(() => setError(""), 3000);
                      }
                    }
                  }}
                  title="Item frequency"
                >
                  {frequencies.map(freq => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
                {item.frequency === 'monthly' && (
                  <select
                    className="item-duedate-selector"
                    value={item.due_date || ''}
                    onChange={async (e) => {
                      const newDueDate = parseInt(e.target.value);
                      const updated = localItems.map(i => 
                        i.id === item.id ? {...i, due_date: newDueDate} : i
                      );
                      setLocalItems(updated);
                      
                      // Save to backend if it's an existing item
                      if (editingPocket?.id && !item.id.toString().startsWith('temp')) {
                        try {
                          await api.patch(`/api/items/update/${item.id}/`, {
                            due_date: newDueDate
                          });
                        } catch (error) {
                          console.error("Error updating due date:", error);
                          setError("Failed to update due date");
                          setTimeout(() => setError(""), 3000);
                        }
                      }
                    }}
                    title="Due date (day of month)"
                  >
                    <option value="">Due</option>
                    {dueDates.map(day => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                )}
                <span className="currency-symbol">€</span>
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
                  <span className="currency-symbol">€</span>
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

            {localItems.filter(item => item.is_percentage).map((item) => (
              <div key={item.id} className="item-row item-percentage">
                <button 
                  className="item-delete-btn"
                  onClick={() => handleDeleteLocalItem(item.id)}
                  title="Remove item"
                >
                  −
                </button>
                <span className="item-name">{item.name}</span>
                <span className="percentage-symbol">%</span>
                <input
                  type="number"
                  className="item-amount-input"
                  value={editingItemAmount?.[item.id] !== undefined 
                    ? editingItemAmount[item.id] 
                    : (item.percentage_value || 0)}
                  onFocus={() => {
                    setEditingItemAmount({
                      ...editingItemAmount,
                      [item.id]: item.percentage_value || 0
                    });
                  }}
                  onChange={(e) => {
                    setEditingItemAmount({
                      ...editingItemAmount,
                      [item.id]: e.target.value
                    });
                  }}
                  onBlur={async (e) => {
                    const newPercentage = parseFloat(e.target.value) || 0;
                    
                    if (newPercentage <= 0 || newPercentage >= 100) {
                      setError("Percentage must be between 0 and 100");
                      setTimeout(() => setError(""), 3000);
                      const newEditingState = {...editingItemAmount};
                      delete newEditingState[item.id];
                      setEditingItemAmount(newEditingState);
                      return;
                    }
                    
                    const updatedItems = localItems.map(i => 
                      i.id === item.id ? {
                        ...i,
                        percentage_value: newPercentage
                      } : i
                    );
                    setLocalItems(updatedItems);
                    
                    // Save to backend if it's an existing item
                    if (editingPocket?.id && !item.id.toString().startsWith('temp')) {
                      try {
                        await api.patch(`/api/items/update/${item.id}/`, {
                          percentage_value: newPercentage
                        });
                      } catch (error) {
                        console.error("Error updating percentage:", error);
                        setError("Failed to update percentage");
                        setTimeout(() => setError(""), 3000);
                      }
                    }
                    
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
                  min="0.01"
                  max="99.99"
                />
                <div className="item-divider"></div>
              </div>
            ))}
            
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
                onChange={(e) => {
                  setNewItemFrequency(e.target.value);
                  if (e.target.value !== 'monthly') {
                    setNewItemDueDate('');
                  }
                }}
                title="Item frequency"
              >
                {itemFrequencies.slice(0, 6).map(freq => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
                <option disabled>────────</option>
                <option value="percentage">Ratio</option>
              </select>
              {newItemFrequency === 'monthly' && (
                <select
                  className="add-item-duedate-selector"
                  value={newItemDueDate}
                  onChange={(e) => setNewItemDueDate(e.target.value)}
                  title="Due date (day of month)"
                >
                  <option value="">Due</option>
                  {dueDates.map(day => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="number"
                className="add-item-amount-input"
                placeholder={newItemFrequency === 'percentage' ? '0%' : '€0.00'}
                step="0.01"
                min="0"
                max={newItemFrequency === 'percentage' ? '99.99' : undefined}
                onFocus={(e) => {
                  if (e.target.value) e.target.select();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const nameInput = document.querySelector('.add-item-name-input');
                    if (nameInput && nameInput.value && e.target.value) {
                      const isPercentage = newItemFrequency === 'percentage';
                      const dueDate = newItemFrequency === 'monthly' ? parseInt(newItemDueDate) : null;
                      handleAddItem(nameInput.value, e.target.value, newItemFrequency, isPercentage, dueDate);
                      nameInput.value = '';
                      e.target.value = '';
                      setNewItemFrequency(frequency);
                      setNewItemDueDate('');
                      nameInput.focus();
                    }
                  }
                }}
              />
              <button
                className="action-btn"
                onClick={() => {
                  const nameInput = document.querySelector('.add-item-name-input');
                  const amountInput = document.querySelector('.add-item-amount-input');
                  
                  if (nameInput && nameInput.value && amountInput && amountInput.value) {
                    const isPercentage = newItemFrequency === 'percentage';
                    const dueDate = newItemFrequency === 'monthly' ? parseInt(newItemDueDate) : null;
                    handleAddItem(nameInput.value, amountInput.value, newItemFrequency, isPercentage, dueDate);
                    nameInput.value = '';
                    amountInput.value = '';
                    setNewItemFrequency(frequency);
                    setNewItemDueDate('');
                  }
                }}
                disabled={false}
                style={{ 
                  background: color,
                }}
                title="Add item"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PocketForm;