import "../styles/Sortedincomedetail.css"

// Modal showing details of a specific pocket in a sorted income record
function SortedPocketViewModal({ pocket, onClose, currency = "€" }) {
  // Order items: Recurring -> Percentage -> Manual -> Other
  const sortedItems = [...(pocket.sorted_items || [])].sort((a, b) => {
    // Define item types priority
    const getItemType = (item) => {
      if (item.is_other) return 4;
      if (item.is_percentage) return 2;
      if (item.original_item) return 1;
      return 3;
    };
    
    return getItemType(a) - getItemType(b);
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sorted-pocket-view-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header with category label */}
        <div 
          className="view-modal-header"
          style={{ backgroundColor: pocket.color }}
        >
          <div className="view-form-actions-left">
            {pocket.category_name && (
              <button
                type="button"
                className="view-action-btn category-btn"
                style={{ cursor: 'default', opacity: 1 }}
                title={pocket.category_name}
              >
                {pocket.category_name}
              </button>
            )}
          </div>
          <button className="view-modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Pocket amount summary */}
        <div 
          className="view-modal-colored-section"
          style={{ backgroundColor: pocket.color }}
        >
          <div className="view-pocket-name">
            {pocket.name}
          </div>
          
          <div className="view-amount-display">
            <span className="view-currency">{currency}</span>
            <span className="view-amount">
              {parseFloat(pocket.total_amount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* List of allocated items */}
        <div className="view-modal-body">
          <h3 className="view-items-title">Items</h3>
          
          {sortedItems && sortedItems.length > 0 ? (
            <div className="view-items-list">
              {sortedItems.map((item, index) => {
                const isRecurring = item.original_item !== null;
                const itemClass = item.is_other 
                  ? 'item-other' 
                  : item.is_percentage 
                  ? 'item-percentage' 
                  : isRecurring 
                  ? 'item-recurring' 
                  : 'item-manual';

                return (
                  <div 
                    key={index} 
                    className={`view-item-row ${itemClass}`}
                  >
                    <span className="view-item-name">
                      {item.name}
                      {item.is_percentage && (
                        <span className="view-percentage-badge">
                          {item.percentage_value}%
                        </span>
                      )}
                    </span>
                    <div className="view-item-amount-wrapper">
                      <span className="view-currency-symbol">{currency}</span>
                      <span className="view-item-amount-display">
                        {parseFloat(item.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="view-no-items">No items in this pocket</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SortedPocketViewModal;