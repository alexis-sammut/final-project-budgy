import { useState, useEffect } from "react";
import "../styles/pocketform.css";

// Modal to edit pocket allocation during income sorting
function SortPocketModal({
  pocket,
  incomeAmount,
  overBudgetAmount = 0,
  remainingIncome = 0,
  onClose,
  onUpdate,
  currency = "€",
}) {
  const [localAmount, setLocalAmount] = useState(pocket.localAmount || 0);
  const [localItems, setLocalItems] = useState(pocket.localItems || []);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemType, setNewItemType] = useState("euro");
  const [amountInputValue, setAmountInputValue] = useState("");
  const [minAmountError, setMinAmountError] = useState("");

  // Initialize values
  useEffect(() => {
    setLocalAmount(pocket.localAmount || 0);
    setLocalItems(pocket.localItems || []);
    setAmountInputValue((pocket.localAmount || 0).toFixed(2));
  }, [pocket]);

  const handleAmountInputChange = (value) => {
    setAmountInputValue(value);
  };

  // Validate amount on blur
  const handleAmountBlur = () => {
    const amount = parseFloat(amountInputValue);

    // Sum existing non-Other items
    const nonOtherItemsTotal = localItems
      .filter((item) => !item.is_other)
      .reduce((sum, item) => sum + (item.localAmount || 0), 0);

    if (isNaN(amount) || amountInputValue === "") {
      setLocalAmount(nonOtherItemsTotal);
      setAmountInputValue(nonOtherItemsTotal.toFixed(2));

      const updatedItems = localItems.filter((item) => !item.is_other);
      setLocalItems(updatedItems);

      onUpdate(pocket.id, {
        localAmount: nonOtherItemsTotal,
        localItems: updatedItems,
      });
      return;
    }

    // Prevent amount lower than existing commitments
    if (amount < nonOtherItemsTotal - 0.01) {
      console.log(
        "Setting error - amount:",
        amount,
        "minimum:",
        nonOtherItemsTotal,
      );
      setMinAmountError(
        `Pocket amount cannot be less than items total (${currency}${nonOtherItemsTotal.toFixed(2)})`,
      );

      setLocalAmount(nonOtherItemsTotal);
      setAmountInputValue(nonOtherItemsTotal.toFixed(2));

      const updatedItems = localItems.filter((item) => !item.is_other);
      setLocalItems(updatedItems);

      onUpdate(pocket.id, {
        localAmount: nonOtherItemsTotal,
        localItems: updatedItems,
      });

      setTimeout(() => setMinAmountError(""), 5000);
      return;
    }

    setMinAmountError("");
    setLocalAmount(amount);
    setAmountInputValue(amount.toFixed(2));

    // Handle 'Other' calculation
    const otherAmount = parseFloat((amount - nonOtherItemsTotal).toFixed(2));
    const otherItemIndex = localItems.findIndex((item) => item.is_other);

    let updatedItems;
    if (otherAmount > 0.01) {
      if (otherItemIndex >= 0) {
        updatedItems = [...localItems];
        updatedItems[otherItemIndex] = {
          ...updatedItems[otherItemIndex],
          localAmount: otherAmount,
        };
      } else {
        const newOtherItem = {
          id: `temp-${Date.now()}-other`,
          name: "Other",
          localAmount: otherAmount,
          is_other: true,
          is_percentage: false,
        };
        updatedItems = [...localItems, newOtherItem];
      }
    } else {
      updatedItems = localItems.filter((item) => !item.is_other);
    }

    setLocalItems(updatedItems);

    onUpdate(pocket.id, {
      localAmount: amount,
      localItems: updatedItems,
    });
  };

  const handleAddItem = (
    name,
    amount,
    isPercentage = false,
    percentageValue = null,
  ) => {
    const roundedAmount = isPercentage
      ? Math.ceil(parseFloat(amount) * 100) / 100
      : parseFloat(parseFloat(amount).toFixed(2));

    const newItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      name,
      localAmount: roundedAmount,
      is_percentage: isPercentage,
      percentage_value: percentageValue,
      is_other: false,
    };

    const updatedItems = [...localItems, newItem];
    setLocalItems(updatedItems);

    const itemsTotal = updatedItems.reduce(
      (sum, item) => sum + (item.localAmount || 0),
      0,
    );
    const roundedTotal = parseFloat(itemsTotal.toFixed(2));
    setLocalAmount(roundedTotal);
    setAmountInputValue(roundedTotal.toFixed(2));

    setNewItemName("");
    setNewItemAmount("");
    setNewItemType("euro");

    onUpdate(pocket.id, {
      localAmount: roundedTotal,
      localItems: updatedItems,
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

  // Button to auto-add unallocated income
  const handleAddRemainder = () => {
    if (remainingIncome > 0.01) {
      const newAmount = parseFloat((localAmount + remainingIncome).toFixed(2));
      setLocalAmount(newAmount);
      setAmountInputValue(newAmount.toFixed(2));

      const itemsTotal = localItems.reduce(
        (sum, item) => sum + (item.localAmount || 0),
        0,
      );
      const otherItemIndex = localItems.findIndex((item) => item.is_other);
      const currentOtherAmount =
        otherItemIndex >= 0 ? localItems[otherItemIndex].localAmount : 0;
      const newOtherAmount = parseFloat(
        (currentOtherAmount + remainingIncome).toFixed(2),
      );

      let updatedItems;
      if (otherItemIndex >= 0) {
        updatedItems = [...localItems];
        updatedItems[otherItemIndex] = {
          ...updatedItems[otherItemIndex],
          localAmount: newOtherAmount,
        };
      } else {
        const newOtherItem = {
          id: `temp-${Date.now()}-other`,
          name: "Other",
          localAmount: parseFloat(remainingIncome.toFixed(2)),
          is_other: true,
          is_percentage: false,
        };
        updatedItems = [...localItems, newOtherItem];
      }

      setLocalItems(updatedItems);

      onUpdate(pocket.id, {
        localAmount: newAmount,
        localItems: updatedItems,
      });
    }
  };

  const handleDeleteItem = (itemId) => {
    const updatedItems = localItems.filter((item) => item.id !== itemId);
    setLocalItems(updatedItems);

    const itemsTotal = updatedItems.reduce(
      (sum, item) => sum + (item.localAmount || 0),
      0,
    );
    const roundedTotal = parseFloat(itemsTotal.toFixed(2));
    setLocalAmount(roundedTotal);
    setAmountInputValue(roundedTotal.toFixed(2));

    onUpdate(pocket.id, {
      localAmount: roundedTotal,
      localItems: updatedItems,
    });
  };

  const handleItemAmountChange = (itemId, newAmount) => {
    const updatedItems = localItems.map((item) =>
      item.id === itemId
        ? {
            ...item,
            localAmount: parseFloat(parseFloat(newAmount).toFixed(2)) || 0,
          }
        : item,
    );
    setLocalItems(updatedItems);

    const itemsTotal = updatedItems.reduce(
      (sum, item) => sum + (item.localAmount || 0),
      0,
    );
    const roundedTotal = parseFloat(itemsTotal.toFixed(2));
    setLocalAmount(roundedTotal);
    setAmountInputValue(roundedTotal.toFixed(2));

    onUpdate(pocket.id, {
      localAmount: roundedTotal,
      localItems: updatedItems,
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

  // Sort items visually by type
  const sortedItems = [...localItems].sort((a, b) => {
    const getItemType = (item) => {
      if (item.is_other) return 4;
      if (item.is_percentage) return 2;
      if (!item.id.toString().startsWith("temp")) return 1;
      return 3;
    };

    return getItemType(a) - getItemType(b);
  });

  const remainder = getRemainder();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pocket-form-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="form-header" style={{ backgroundColor: pocket.color }}>
          <div className="form-actions-left">
            {pocket.category_name && (
              <button
                type="button"
                className="action-btn category-btn"
                style={{ cursor: "default" }}
                title={pocket.category_name}
              >
                {pocket.category_name}
              </button>
            )}
          </div>
          <button className="validate-btn" onClick={handleSave}>
            ✓
          </button>
        </div>

        {/* Amount Input Section */}
        <div
          className="form-colored-section"
          style={{ backgroundColor: pocket.color }}
        >
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
              <span className="currency">{currency}</span>
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

          {minAmountError && (
            <div className="error-message">{minAmountError}</div>
          )}

          {(() => {
            const itemsTotal = localItems.reduce(
              (sum, item) => sum + (item.localAmount || 0),
              0,
            );
            const isBelowItems = localAmount < itemsTotal - 0.01;

            return (
              isBelowItems && (
                <div className="error-message">
                  Cannot be less than items total ({currency}
                  {itemsTotal.toFixed(2)})
                </div>
              )
            );
          })()}

          {overBudgetAmount > 0.01 && (
            <div className="error-message">
              Over budget by {currency}
              {overBudgetAmount.toFixed(2)}
            </div>
          )}

          {Math.abs(remainder) > 0.01 && overBudgetAmount <= 0.01 && (
            <div
              className={
                remainder > 0
                  ? "warning-message"
                  : "warning-message warning-over"
              }
            >
              {remainder > 0
                ? `${currency}${remainder.toFixed(2)} remaining to allocate`
                : `${currency}${Math.abs(remainder).toFixed(2)} over budget`}
            </div>
          )}
        </div>

        {/* List of allocated items */}
        <div className="form-white-section">
          <h3 className="items-title">Items</h3>

          <div className="items-list">
            {sortedItems.map((item) => {
              const isRecurring = !item.id.toString().startsWith("temp");
              const itemClass = item.is_other
                ? "item-other"
                : item.is_percentage
                  ? "item-percentage"
                  : isRecurring
                    ? "item-recurring"
                    : "item-manual";

              return (
                <div key={item.id} className={`item-row ${itemClass}`}>
                  <button
                    className="item-delete-btn"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    −
                  </button>

                  <span className="item-name">
                    {item.name}
                    {item.is_percentage && (
                      <span
                        style={{
                          marginLeft: "0.5rem",
                          fontSize: "0.9rem",
                          opacity: 0.8,
                        }}
                      >
                        ({item.percentage_value}%)
                      </span>
                    )}
                  </span>

                  <div className="item-amount-wrapper">
                    <span className="currency-symbol">{currency}</span>
                    {isRecurring || item.is_percentage || item.is_other ? (
                      <span className="item-amount-display">
                        {item.localAmount.toFixed(2)}
                      </span>
                    ) : (
                      <input
                        type="number"
                        className="item-amount-input"
                        value={item.localAmount}
                        onChange={(e) =>
                          handleItemAmountChange(item.id, e.target.value)
                        }
                        step="0.01"
                        min="0"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Item Form */}
          <div className="add-item-section">
            <input
              type="text"
              className="add-item-name-input"
              placeholder="+ Add item"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />

            <select
              className="add-item-type-selector"
              value={newItemType}
              onChange={(e) => setNewItemType(e.target.value)}
            >
              <option value="euro">{currency}</option>
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
                opacity: !newItemName.trim() || !newItemAmount ? 0.5 : 1,
              }}
            >
              +
            </button>
          </div>

          {/* Add Remainder shortcut */}
          {remainingIncome > 0.01 && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "1rem",
              }}
            >
              <button
                className="add-remainder-btn"
                onClick={handleAddRemainder}
              >
                Add Remainder ({currency}
                {remainingIncome.toFixed(2)})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SortPocketModal;
