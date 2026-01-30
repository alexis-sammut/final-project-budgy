import "../styles/SortedPocketViewModal.css";

function SortedPocketViewModal({ pocket, onClose, currency = "€" }) {
  // Sort items: Recurring (blue) → Percentage (purple) → Manual (black) → Other (grey)
  const sortedItems = [...(pocket.sorted_items || [])].sort((a, b) => {
    // Define item types
    const getItemType = (item) => {
      if (item.is_other) return 4; // Other last
      if (item.is_percentage) return 2; // Percentage second
      // In sorted items, we need to check if original_item exists to determine if recurring
      if (item.original_item) return 1; // Recurring first (has reference to original)
      return 3; // Manual third (created during sorting)
    };
    
    return getItemType(a) - getItemType(b);
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sorted-pocket-view-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div 
          className="view-modal-header"
          style={{ backgroundColor: pocket.color }}
        >
          <div className="view-modal-header-content">
            <div className="form-actions-left">
              {pocket.category_name && (
                <button
                  type="button"
                  className="action-btn category-btn"
                  style={{ cursor: 'default', opacity: 0.9 }}
                  title={pocket.category_name}
                >
                  {pocket.category_name}
                </button>
              )}
            </div>
            <h2 className="view-pocket-name">{pocket.name}</h2>
            <button className="view-modal-close-btn" onClick={onClose}>
              ×
            </button>
          </div>
          
          <div className="view-pocket-total">
            <span className="view-currency">{currency}</span>
            <span className="view-amount">
              {parseFloat(pocket.total_amount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="view-modal-body">
          <h3 className="view-items-title">Items</h3>
          
          {sortedItems && sortedItems.length > 0 ? (
            <div className="view-items-list">
              {sortedItems.map((item, index) => (
                <div 
                  key={index} 
                  className={`view-item-row ${item.is_other ? 'item-other' : ''} ${item.is_percentage ? 'item-percentage' : ''}`}
                >
                  <span className="view-item-name">
                    {item.name}
                    {item.is_percentage && (
                      <span className="percentage-badge">
                        {item.percentage_value}%
                      </span>
                    )}
                  </span>
                  <span className="view-item-amount">
                    <span className="view-item-currency">{currency}</span>
                    {parseFloat(item.amount).toFixed(2)}
                  </span>
                </div>
              ))}
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