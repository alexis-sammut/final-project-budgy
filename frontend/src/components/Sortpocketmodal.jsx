import { useState, useEffect } from "react";
import "../styles/PocketForm.css";

function SortPocketModal({ pocket, incomeAmount, overBudgetAmount = 0, onClose, onUpdate }) {
  const [localAmount, setLocalAmount] = useState(pocket.localAmount || 0);
  const [localItems, setLocalItems] = useState(pocket.localItems || []);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemType, setNewItemType] = useState("euro");
  const [amountInputValue, setAmountInputValue] = useState("");

  useEffect(() => {
    setLocalAmount(pocket.localAmount || 0);
    setLocalItems(pocket.localItems || []);
    setAmountInputValue((pocket.localAmount || 0).toString());
  }, [pocket]);

  const handleAmountInputChange = (value) => {
    setAmountInputValue(value);
  };

  const handleAmountBlur = () => {
    const amount = parseFloat(amountInputValue);
    
    if (isNaN(amount) || amountInputValue === '') {
      const itemsTotal = localItems.reduce((sum, item) => sum + (item.localAmount || 0), 0);
      setLocalAmount(itemsTotal);
      setAmountInputValue(itemsTotal.toString());
      return;
    }
    
    const itemsTotal = localItems.reduce((sum, item) => sum + (item.localAmount || 0), 0);
    
    if (amount < itemsTotal - 0.01) {
      setLocalAmount(itemsTotal);
      setAmountInputValue(itemsTotal.toString());
      return;
    }
    
    setLocalAmount(amount);
    setAmountInputValue(amount.toString());
    
    const otherAmount = amount - itemsTotal;
    
    const otherItemIndex = localItems.findIndex(item => item.is_other);
    
    if (otherAmount > 0.01) {
      if (otherItemIndex >= 0) {
        const updatedItems = [...localItems];
        updatedItems[otherItemIndex] = {
          ...updatedItems[otherItemIndex],
          localAmount: otherAmount
        };
        setLocalItems(updatedItems);
      } else {
        const newOtherItem = {
          id: `temp-${Date.now()}-other`,
          name: 'Other',
          localAmount: otherAmount,
          is_other: true,
          is_percentage: false,
        };
        setLocalItems([...localItems, newOtherItem]);
      }
    } else {
      if (otherItemIndex >= 0) {
        const updatedItems = localItems.filter(item => !item.is_other);
        setLocalItems(updatedItems);
      }
    }
    
    onUpdate(pocket.id, {
      localAmount: amount,
      localItems: localItems
    });
  };

  const handleAddItem = (name, amount, isPercentage = false, percentageValue = null) => {
    const newItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      name,
      localAmount: parseFloat(amount),
      is_percentage: isPercentage,
      percentage_value: percentageValue,
      is_other: false,
    };

    const updatedItems = [...localItems, newItem];
    setLocalItems(updatedItems);
    
    const itemsTotal = updatedItems.reduce((sum, item) => sum + (item.localAmount || 0), 0);
    setLocalAmount(itemsTotal);
    setAmountInputValue(itemsTotal.toString());
    
    setNewItemName("");
    setNewItemAmount("");
    setNewItemType("euro");
    
    onUpdate(pocket.id, {
      localAmount: itemsTotal,
      localItems: updatedItems
    });
  };

  const handleAddItemClick = () => {
    if (!newItemName.trim() || !newItemAmount) return;

    const amount = parseFloat(newItemAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (newItemType === "percentage") {
      if (amount > 100) {
        alert("Percentage cannot exceed 100%");
        return;
      }
      const calculatedAmount = (localAmount * amount) / 100;
      handleAddItem(newItemName, calculatedAmount, true, amount);
    } else {
      handleAddItem(newItemName, amount, false, null);
    }
  };

  const handleAddRemainder = () => {
    const totalItems = localItems.reduce((sum, item) => sum + (item.localAmount || 0), 0);
    const remainder = localAmount - totalItems;
    
    if (remainder > 0.01) {
      handleAddItem("Other", remainder, false, null);
    }
  };

  const handleDeleteItem = (itemId) => {
    const updatedItems = localItems.filter(item => item.id !== itemId);
    setLocalItems(updatedItems);
    
    const itemsTotal = updatedItems.reduce((sum, item) => sum + (item.localAmount || 0), 0);
    setLocalAmount(itemsTotal);
    setAmountInputValue(itemsTotal.toString());
    
    onUpdate(pocket.id, {
      localAmount: itemsTotal,
      localItems: updatedItems
    });
  };

  const handleItemAmountChange = (itemId, newAmount) => {
    const updatedItems = localItems.map(item =>
      item.id === itemId ? { ...item, localAmount: parseFloat(newAmount) || 0 } : item
    );
    setLocalItems(updatedItems);
    
    const itemsTotal = updatedItems.reduce((sum, item) => sum + (item.localAmount || 0), 0);
    setLocalAmount(itemsTotal);
    setAmountInputValue(itemsTotal.toString());
    
    onUpdate(pocket.id, {
      localAmount: itemsTotal,
      localItems: updatedItems
    });
  };

  const handleSave = () => {
    onUpdate(pocket.id, {
      localAmount,
      localItems,
    });
    onClose();
  };

  const getTotalItems = () => {
    return localItems.reduce((sum, item) => sum + (item.localAmount || 0), 0);
  };

  const getRemainder = () => {
    return localAmount - getTotalItems();
  };

  // Sort items: Recurring (blue) → Percentage (purple) → Manual (black) → Other (grey)
  const sortedItems = [...localItems].sort((a, b) => {
    // Define item types
    const getItemType = (item) => {
      if (item.is_other) return 4; // Other last
      if (item.is_percentage) return 2; // Percentage second
      if (!item.id.toString().startsWith('temp')) return 1; // Recurring first (from template)
      return 3; // Manual third
    };
    
    return getItemType(a) - getItemType(b);
  });

  const remainder = getRemainder();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pocket-form-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="form-header" style={{ backgroundColor: pocket.color }}>
          <div className="form-actions-left">
            <button className="validate-btn" onClick={handleSave}>
              ✓
            </button>
          </div>
        </div>

        {/* Colored Section */}
        <div className="form-colored-section" style={{ backgroundColor: pocket.color }}>
          <div className="pocket-name-row">
            <input
              type="text"
              className="pocket-name-input"
              value={pocket.name}
              readOnly
            />
          </div>

          <div className="amount-control">
            <div className="amount-display">
              <span className="currency">€</span>
              <input
                type="number"
                className="amount-input"
                value={amountInputValue}
                onChange={(e) => handleAmountInputChange(e.target.value)}
                onBlur={handleAmountBlur}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {(() => {
            const itemsTotal = localItems.reduce((sum, item) => sum + (item.localAmount || 0), 0);
            const isBelowItems = localAmount < itemsTotal - 0.01;
            
            return isBelowItems && (
              <div className="error-message">
                Cannot be less than items total (€{itemsTotal.toFixed(2)})
              </div>
            );
          })()}

          {overBudgetAmount > 0.01 && (
            <div className="error-message">
              Over budget by €{overBudgetAmount.toFixed(2)}
            </div>
          )}

          {remainder !== 0 && overBudgetAmount <= 0.01 && (
            <div className={remainder > 0 ? "warning-message" : "warning-message warning-over"}>
              {remainder > 0 
                ? `€${remainder.toFixed(2)} remaining to allocate`
                : `€${Math.abs(remainder).toFixed(2)} over budget`
              }
            </div>
          )}
        </div>

        {/* White Section - Items */}
        <div className="form-white-section">
          <h3 className="items-title">Items</h3>

          <div className="items-list">
            {sortedItems.map((item) => {
              const isRecurring = !item.id.toString().startsWith('temp');
              const itemClass = item.is_other 
                ? 'item-other' 
                : item.is_percentage 
                ? 'item-percentage' 
                : isRecurring 
                ? 'item-recurring' 
                : 'item-manual';

              return (
                <div key={item.id} className={`item-row ${itemClass}`}>
                  <button
                    className="item-delete-btn"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    ×
                  </button>

                  <span className="item-name">
                    {item.name}
                    {item.is_percentage && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
                        ({item.percentage_value}%)
                      </span>
                    )}
                  </span>

                  <div className="item-amount-wrapper">
                    <span className="currency-symbol">€</span>
                    {isRecurring || item.is_percentage ? (
                      <span className="item-amount-display">
                        {item.localAmount.toFixed(2)}
                      </span>
                    ) : (
                      <input
                        type="number"
                        className="item-amount-input"
                        value={item.localAmount}
                        onChange={(e) => handleItemAmountChange(item.id, e.target.value)}
                        step="0.01"
                        min="0"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Item Section */}
          <div className="add-item-section">
            <input
              type="text"
              className="add-item-name-input"
              placeholder="Item name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
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
              placeholder="0.00"
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value)}
              step="0.01"
              min="0"
              max={newItemType === "percentage" ? "100" : undefined}
            />

            <button
              className="action-btn"
              onClick={handleAddItemClick}
              disabled={!newItemName.trim() || !newItemAmount}
              style={{ 
                background: pocket.color,
                opacity: (!newItemName.trim() || !newItemAmount) ? 0.5 : 1
              }}
            >
              +
            </button>
          </div>

          {/* Add Remainder Button */}
          {remainder > 0.01 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                className="add-remainder-btn"
                onClick={handleAddRemainder}
              >
                Add Remainder (€{remainder.toFixed(2)})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SortPocketModal;