import React from "react";
function Pocket({ pocket, onDelete }) {
  return (
    <div className="pocket-container">
      <p className="pocket-name">{pocket.name}</p>
      <p className="pocket-amount">€{pocket.amount_display}</p>
      <button className="delete-button" onClick={() => onDelete(pocket.id)}>
        Delete pocket
      </button>
    </div>
  );
}

export default Pocket;