import React from "react";
import "../styles/Pocket.css";

function Pocket({ pocket, onClick, variant = "default" }) {
  
  const getPocketData = () => {
    switch (variant) {
      case "sorting":
        // Sort Income page - uses localAmount and localItems
        return {
          name: pocket.name,
          amount: (pocket.localAmount || 0).toFixed(2),
          color: pocket.color,
          itemsCount: pocket.localItems?.length || 0,
          showItemsCount: true,
          showRemainder: true,
          remainder: calculateRemainder(),
        };
      
      case "history":
        // Sorted Income Detail page - uses total_amount and sorted_items
        return {
          name: pocket.name,
          amount: parseFloat(pocket.total_amount || 0).toFixed(2),
          color: pocket.color,
          itemsCount: pocket.sorted_items?.length || 0,
          showItemsCount: true,
        };
      
      case "default":
      default:
        // Home/Pockets page - uses amount_display and items
        return {
          name: pocket.name,
          amount: pocket.amount_display,
          color: pocket.color,
          itemsCount: pocket.items?.length || 0,
          showItemsCount: true,
        };
    }
  };

  // Calculate remainder for sorting variant
  const calculateRemainder = () => {
    if (variant !== "sorting") return null;
    
    const pocketTotal = pocket.localAmount || 0;
    const itemsTotal = (pocket.localItems || []).reduce(
      (sum, item) => sum + (item.localAmount || 0), 
      0
    );
    const remainder = pocketTotal - itemsTotal;
    const isOverBudget = remainder < -0.01;
    const hasRemainder = Math.abs(remainder) > 0.01;
    
    return hasRemainder ? {
      amount: Math.abs(remainder).toFixed(2),
      isOverBudget,
    } : null;
  };

  const data = getPocketData();

  return (
    <div 
      className={`pocket-card pocket-card-${variant}`}
      style={{ backgroundColor: data.color }}
      onClick={onClick}
    >
      <div className="pocket-content">
        <h3 className="pocket-name">{data.name}</h3>
        <p className="pocket-amount">€{data.amount}</p>
        
        {/* Show items count for all variants */}
        {data.showItemsCount && (
          <p className="pocket-items-count">
            {data.itemsCount} item{data.itemsCount !== 1 ? 's' : ''}
          </p>
        )}
        
        {/* Show remainder for sorting variant */}
        {data.showRemainder && data.remainder && (
          <p className={`pocket-remainder ${data.remainder.isOverBudget ? 'over-budget' : 'under-budget'}`}>
            {data.remainder.isOverBudget 
              ? `€${data.remainder.amount} over` 
              : `€${data.remainder.amount} left`
            }
          </p>
        )}
      </div>
    </div>
  );
}

export default Pocket;