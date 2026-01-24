import { useState, useEffect, useRef } from "react";
import "../styles/PocketForm.css";

function SortPocketModal({ pocket, incomeAmount, onClose, onUpdate }) {
  const [name] = useState(pocket.name);
  const [amount, setAmount] = useState(pocket.localAmount || 0);
  const [color] = useState(pocket.color);
  const [localItems, setLocalItems] = useState(pocket.localItems || []);
  const [error, setError] = useState("");
  const [newItemType, setNewItemType] = useState("euro");

  const skipOtherUpdate = useRef(false);
  const isManuallyEditing = useRef(false);
  const [editingOtherAmount, setEditingOtherAmount] = useState(null);

  useEffect(() => {
    if (skipOtherUpdate.current) {
      skipOtherUpdate.current = false;
      return;
    }
    
    if (!isManuallyEditing.current && localItems.length > 0) {
      updatePocketTotal(localItems);
    }
  }, [localItems]);

  const updatePocketTotal = (items) => {
    const total = items.reduce((sum, item) => {
      if (item.is_percentage) return sum;
      return sum + (parseFloat(item.localAmount) || 0);
    }, 0);
    
    setAmount(total);
    onUpdate(pocket.id, { localAmount: total, localItems: items });
  };

  const createOtherFromAmount = (pocketAmount) => {
    const existingOther = localItems.find(item => item.is_other);
    
    if (existingOther) {
      const updatedItems = localItems.map(item => 
        item.is_other ? {...item, localAmount: parseFloat(pocketAmount)} : item
      );
      setLocalItems(updatedItems);
    } else {
      const otherItem = {
        id: 'temp-other',
        name: 'Other',
        localAmount: parseFloat(pocketAmount),
        is_other: true
      };
      setLocalItems([...localItems, otherItem]);
    }
  };

  const handleAddItem = (itemName, itemAmount, isPercentage = false) => {
    if (!itemName.trim()) return;
    
    const parsedAmount = parseFloat(itemAmount) || 0;
    
    if (isPercentage && (parsedAmount <= 0 || parsedAmount >= 100)) {
      setError("Percentage must be between 0 and 100");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    const newItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      name: itemName,
      localAmount: isPercentage ? (incomeAmount * parsedAmount / 100) : parsedAmount,
      is_other: false,
      is_percentage: isPercentage,
      percentage_value: isPercentage ? parsedAmount : null,
    };
    
    const updatedItems = [...localItems, newItem];
    setLocalItems(updatedItems);
    
    if (!isPercentage) {
      skipOtherUpdate.current = true;
      updatePocketTotal(updatedItems);
    }
  };

  const handleDeleteLocalItem = (itemId) => {
    const updatedItems = localItems.filter(item => item.id !== itemId);
    setLocalItems(updatedItems);
    
    skipOtherUpdate.current = true;
    updatePocketTotal(updatedItems);
  };

  const handleAmountBlur = (e) => {
    try {
      const value = e.target.value;
      const numValue = parseFloat(value);
      
      if (isNaN(numValue) || value === '') {
        setAmount(0);
        const updatedItems = localItems.filter(item => !item.is_other);
        setLocalItems(updatedItems);
        onUpdate(pocket.id, { localAmount: 0, localItems: updatedItems });
        isManuallyEditing.current = false;
        return;
      }
      
      const regularItems = localItems.filter(item => !item.is_other && !item.is_percentage);
      const itemsTotal = regularItems.reduce((sum, item) => {
        return sum + (parseFloat(item.localAmount) || 0);
      }, 0);
      
      if (numValue < itemsTotal && regularItems.length > 0) {
        setError(`Pocket amount cannot be less than items total: €${itemsTotal.toFixed(2)}`);
        const minAmount = itemsTotal;
        setAmount(minAmount);
        
        const updatedItems = localItems.filter(item => !item.is_other);
        setLocalItems(updatedItems);
        onUpdate(pocket.id, { localAmount: minAmount, localItems: updatedItems });
        
        setTimeout(() => setError(""), 5000);
        isManuallyEditing.current = false;
        return;
      }
      
      setAmount(numValue);
      
      if (numValue === 0) {
        const updatedItems = localItems.filter(item => !item.is_other);
        setLocalItems(updatedItems);
        onUpdate(pocket.id, { localAmount: 0, localItems: updatedItems });
      } else {
        const otherItem = localItems.find(item => item.is_other);
        
        if (regularItems.length === 0) {
          // Create Other with full amount
          const newOther = {
            id: 'temp-other-' + Date.now(),
            name: 'Other',
            localAmount: numValue,
            is_other: true,
            is_percentage: false
          };
          const updatedItems = [...localItems.filter(item => !item.is_other), newOther];
          setLocalItems(updatedItems);
          onUpdate(pocket.id, { localAmount: numValue, localItems: updatedItems });
        } else {
          const newOtherAmount = numValue - itemsTotal;
          
          if (newOtherAmount > 0) {
            if (otherItem) {
              // Update existing Other
              const updatedItems = localItems.map(item =>
                item.is_other ? { ...item, localAmount: newOtherAmount } : item
              );
              setLocalItems(updatedItems);
              onUpdate(pocket.id, { localAmount: numValue, localItems: updatedItems });
            } else {
              // Create new Other
              const newOther = {
                id: 'temp-other-' + Date.now(),
                name: 'Other',
                localAmount: newOtherAmount,
                is_other: true,
                is_percentage: false
              };
              const updatedItems = [...localItems, newOther];
              setLocalItems(updatedItems);
              onUpdate(pocket.id, { localAmount: numValue, localItems: updatedItems });
            }
          } else {
            // No Other needed
            const updatedItems = localItems.filter(item => !item.is_other);
            setLocalItems(updatedItems);
            onUpdate(pocket.id, { localAmount: numValue, localItems: updatedItems });
          }
        }
      }
      
      isManuallyEditing.current = false;
    } catch (error) {
      console.error("Error in handleAmountBlur:", error);
      setError("An error occurred. Please try again.");
      setTimeout(() => setError(""), 3000);
      isManuallyEditing.current = false;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pocket-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-header" style={{ backgroundColor: color }}>
          <div className="form-actions-left">
            {/* No buttons here during sorting */}
          </div>
          <button
            type="button"
            className="validate-btn"
            onClick={onClose}
            title="Close"
          >
            ✓
          </button>
        </div>

        <div className="form-colored-section" style={{ backgroundColor: color }}>
          <div className="pocket-name-row">
            <input
              type="text"
              className="pocket-name-input"
              style={{ backgroundColor: color }}
              value={name}
              readOnly
              disabled
            />
          </div>
          <div className="amount-control">
            <div className="amount-display">
              <span className="currency">€</span>
              <input
                type="number"
                className="amount-input"
                value={typeof amount === 'number' ? amount.toFixed(2) : amount}
                onChange={(e) => {
                  isManuallyEditing.current = true;
                  setAmount(e.target.value);
                }}
                onFocus={(e) => {
                  isManuallyEditing.current = true;
                  e.target.select();
                }}
                onBlur={handleAmountBlur}
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
            
            {localItems.filter(item => !item.is_other && !item.is_percentage).map((item) => {
              const isRecurring = item.id && !item.id.toString().startsWith('temp');
              const itemClass = isRecurring ? 'item-row item-recurring' : 'item-row item-manual';
              
              return (
                <div key={item.id} className={itemClass}>
                  <button 
                    className="item-delete-btn"
                    onClick={() => handleDeleteLocalItem(item.id)}
                    title="Remove item"
                  >
                    −
                  </button>
                  <span className="item-name">{item.name}</span>
                  <span className="currency-symbol">€</span>
                  <input
                    type="number"
                    className="item-amount-input"
                    value={item.localAmount.toFixed(2)}
                    step="0.01"
                    min="0"
                    disabled
                    readOnly
                  />
                  <div className="item-divider"></div>
                </div>
              );
            })}
            
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
                  <span className="currency-symbol">€</span>
                  <input
                    type="number"
                    className="item-amount-input"
                    value={editingOtherAmount !== null ? editingOtherAmount : otherItem.localAmount.toFixed(2)}
                    onFocus={() => {
                      setEditingOtherAmount(otherItem.localAmount);
                    }}
                    onChange={(e) => {
                      setEditingOtherAmount(e.target.value);
                    }}
                    onBlur={(e) => {
                      const newAmount = parseFloat(e.target.value) || 0;
                      
                      const updatedItems = localItems.map(item => 
                        item.is_other ? {
                          ...item, 
                          localAmount: newAmount
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
                <span className="item-name">{item.name} ({item.percentage_value}%)</span>
                <span className="currency-symbol">€</span>
                <span className="item-amount-display">
                  {((incomeAmount * item.percentage_value) / 100).toFixed(2)}
                </span>
                <div className="item-divider"></div>
              </div>
            ))}
            
            {/* Add Item Section */}
            <div className="add-item-section">
              <input
                type="text"
                className="add-item-name-input"
                placeholder="+ Add item"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const typeSelect = e.target.nextElementSibling;
                    if (typeSelect) typeSelect.focus();
                  }
                }}
              />
              <select
                className="add-item-type-selector"
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value)}
              >
                <option value="euro">€</option>
                <option value="percentage">%</option>
              </select>
              <input
                type="number"
                className="add-item-amount-input"
                placeholder={newItemType === "percentage" ? "0%" : "€0.00"}
                step="0.01"
                min="0"
                max={newItemType === "percentage" ? "99.99" : undefined}
                onFocus={(e) => {
                  if (e.target.value) e.target.select();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const nameInput = document.querySelector('.add-item-name-input');
                    if (nameInput && nameInput.value && e.target.value) {
                      const isPercentage = newItemType === "percentage";
                      handleAddItem(nameInput.value, e.target.value, isPercentage);
                      nameInput.value = '';
                      e.target.value = '';
                      setNewItemType("euro");
                      nameInput.focus();
                    }
                  }
                }}
                onBlur={(e) => {
                  const amountInput = e.target;
                  const nameInput = document.querySelector('.add-item-name-input');
                  
                  if (nameInput && nameInput.value && amountInput.value) {
                    const isPercentage = newItemType === "percentage";
                    handleAddItem(nameInput.value, amountInput.value, isPercentage);
                    nameInput.value = '';
                    amountInput.value = '';
                    setNewItemType("euro");
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

export default SortPocketModal;