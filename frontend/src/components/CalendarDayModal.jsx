import "../styles/CalendarDayModal.css";

function CalendarDayModal({ day, month, items, onClose , currency = "€"}) {
  
  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="calendar-day-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {month.split(' ')[0]} {day}
            </h2>
            <p className="modal-subtitle">{items.length} item{items.length !== 1 ? 's' : ''} due</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Items List */}
        <div className="modal-body">
          {items.map((item, index) => (
            <div 
              key={`${item.id}-${index}`} 
              className="calendar-item-card"
              style={{ borderLeftColor: item.pocketColor }}
            >
              <div className="item-card-header">
                <div 
                  className="item-color-badge"
                  style={{ backgroundColor: item.pocketColor }}
                />
                <div className="item-info">
                  <h3 className="item-name">{item.name}</h3>
                  <p className="item-pocket-name">{item.pocketName}</p>
                </div>
              </div>

              <div className="item-card-body">
                <div className="item-detail">
                  <span className="detail-label">Amount</span>
                  <span className="detail-value amount">{currency}{formatAmount(item.amount)}</span>
                </div>
                
                <div className="item-detail">
                  <span className="detail-label">Frequency</span>
                  <span className="detail-value">Monthly</span>
                </div>

                <div className="item-detail">
                  <span className="detail-label">Due Date</span>
                  <span className="detail-value">Day {item.due_date} of each month</span>
                </div>

                {item.is_percentage && (
                  <div className="item-detail">
                    <span className="detail-label">Type</span>
                    <span className="detail-value percentage-badge">
                      {item.percentage_value}% of pocket
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="footer-total">
            <span className="total-label">Total for this day:</span>
            <span className="total-amount">
              {currency}{items.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarDayModal;