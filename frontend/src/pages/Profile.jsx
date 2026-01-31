import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/profile.css";

// User profile and settings management
function Profile() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [currencyMessage, setCurrencyMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [currency, setCurrency] = useState("€");

  // Load user data on mount
  useEffect(() => {
    fetchUserProfile();
    fetchCategories();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get("/api/user/profile/");
      setUsername(res.data.username);
      setNewUsername(res.data.username);
      setCurrency(res.data.currency || "€");
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/categories/");
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Drag-and-drop handlers for categories
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newCategories = [...categories];
    const draggedCategory = newCategories[draggedItem];
    newCategories.splice(draggedItem, 1);
    newCategories.splice(index, 0, draggedCategory);

    setCategories(newCategories);
    setDraggedItem(index);
  };

  // Save new category order
  const handleDragEnd = async () => {
    setDraggedItem(null);

    const categoryOrder = categories.map((cat, index) => ({
      id: cat.id,
      order: index,
    }));

    try {
      await api.patch("/api/categories/reorder/", {
        categories: categoryOrder,
      });
    } catch (err) {
      console.error("Error updating category order:", err);
      fetchCategories();
    }
  };

  // Update username handler
  const handleUpdateUsername = async (e) => {
    e.preventDefault();

    if (!newUsername.trim()) {
      setUsernameMessage("Username cannot be empty");
      setTimeout(() => setUsernameMessage(""), 3000);
      return;
    }

    if (newUsername === username) {
      setUsernameMessage("No changes to save");
      setTimeout(() => setUsernameMessage(""), 3000);
      return;
    }

    setLoading(true);
    setUsernameMessage("");

    try {
      await api.patch("/api/user/profile/", { username: newUsername });
      setUsername(newUsername);
      setUsernameMessage("✓ Username updated successfully");
      setTimeout(() => setUsernameMessage(""), 3000);
    } catch (err) {
      setUsernameMessage(
        err.response?.data?.username?.[0] || "Failed to update username",
      );
      setTimeout(() => setUsernameMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Password change handler
  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("All password fields are required");
      setTimeout(() => setPasswordMessage(""), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match");
      setTimeout(() => setPasswordMessage(""), 3000);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage("Password must be at least 8 characters");
      setTimeout(() => setPasswordMessage(""), 3000);
      return;
    }

    setLoading(true);
    setPasswordMessage("");

    try {
      await api.patch("/api/user/password/", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("✓ Password updated successfully");
      setTimeout(() => setPasswordMessage(""), 3000);
    } catch (err) {
      setPasswordMessage(
        err.response?.data?.current_password?.[0] ||
          err.response?.data?.new_password?.[0] ||
          err.response?.data?.error ||
          "Failed to update password",
      );
      setTimeout(() => setPasswordMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Update currency preference
  const handleUpdateCurrency = async (newCurrency) => {
    setCurrency(newCurrency);
    setCurrencyMessage("");
    setLoading(true);

    try {
      await api.patch("/api/user/profile/", { currency: newCurrency });
      setCurrencyMessage("✓ Currency updated successfully");
      setTimeout(() => setCurrencyMessage(""), 3000);
    } catch (err) {
      setCurrencyMessage("Failed to update currency");
      setTimeout(() => setCurrencyMessage(""), 5000);
      setCurrency(currency);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    setLoading(true);

    try {
      await api.delete("/api/user/profile/");
      localStorage.clear();
      navigate("/register");
    } catch (err) {
      alert("Failed to delete account. Please try again.");
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="profile-container">
        <div className="profile-content">
          <div className="profile-header">
            <h1>User Profile</h1>
            <p className="profile-subtitle">Manage your account settings</p>
          </div>

          {/* Username Section */}
          <div className="profile-section">
            <h2 className="section-title">Account Settings</h2>

            <form onSubmit={handleUpdateUsername} className="profile-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-with-button">
                  <input
                    type="text"
                    id="username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="profile-input"
                    placeholder="Enter username"
                  />
                  <button
                    type="submit"
                    className="update-btn"
                    disabled={loading || newUsername === username}
                  >
                    {loading ? "Updating..." : "Update"}
                  </button>
                </div>
                {usernameMessage && (
                  <div
                    className={`message ${usernameMessage.includes("✓") ? "success" : "error"}`}
                  >
                    {usernameMessage}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Password Section */}
          <div className="profile-section">
            <h2 className="section-title">Change Password</h2>

            <form onSubmit={handleUpdatePassword} className="profile-form">
              <div className="form-group">
                <label htmlFor="current-password">Current Password</label>
                <input
                  type="password"
                  id="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="profile-input"
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="profile-input"
                  placeholder="Enter new password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm New Password</label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="profile-input"
                  placeholder="Confirm new password"
                />
              </div>

              {passwordMessage && (
                <div
                  className={`message ${passwordMessage.includes("✓") ? "success" : "error"}`}
                >
                  {passwordMessage}
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* Currency Section */}
          <div className="profile-section">
            <h2 className="section-title">Currency Preference</h2>
            <p className="section-description">
              Choose your preferred currency symbol. This will be updated
              throughout the app.
            </p>

            <div className="currency-selector-group">
              <label htmlFor="currency">Currency Symbol</label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => handleUpdateCurrency(e.target.value)}
                className="currency-select"
                disabled={loading}
              >
                <option value="€">€ (Euro)</option>
                <option value="$">$ (US Dollar)</option>
                <option value="£">£ (British Pound)</option>
                <option value="¥">¥ (Japanese Yen)</option>
                <option value="₹">₹ (Indian Rupee)</option>
                <option value="₽">₽ (Russian Ruble)</option>
                <option value="₩">₩ (South Korean Won)</option>
                <option value="R$">R$ (Brazilian Real)</option>
                <option value="A$">A$ (Australian Dollar)</option>
                <option value="C$">C$ (Canadian Dollar)</option>
                <option value="CHF">CHF (Swiss Franc)</option>
                <option value="kr">kr (Swedish Krona)</option>
                <option value="zł">zł (Polish Zloty)</option>
              </select>

              {currencyMessage && (
                <div
                  className={`message ${currencyMessage.includes("✓") ? "success" : "error"}`}
                >
                  {currencyMessage}
                </div>
              )}
            </div>
          </div>

          {/* Category Reordering Section */}
          <div className="profile-section">
            <h2 className="section-title">Category Order</h2>
            <p className="section-description">
              Drag and drop to reorder categories. Changes are saved
              automatically.
            </p>

            {categories.length === 0 ? (
              <p className="empty-state">
                No categories yet. Create categories in the Pockets page.
              </p>
            ) : (
              <div className="category-list">
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    className={`category-item ${draggedItem === index ? "dragging" : ""}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <span className="drag-handle">☰</span>
                    <span className="category-name">{category.name}</span>
                    <span className="category-order-number">{index + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className="danger-actions">
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="delete-account-btn"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
      <Footer />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="confirm-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Account?</h3>
            <p>
              This action is <strong>permanent</strong> and cannot be undone.
            </p>
            <p className="confirm-warning">
              All your pockets, items, and sorted incomes will be permanently
              deleted.
            </p>
            <div className="confirm-actions">
              <button
                className="confirm-btn confirm-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn confirm-delete"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Profile;
