import api from "../api";

export const getUserCurrency = async () => {
  try {
    const res = await api.get("/api/user/profile/");
    return res.data.currency || "€";
  } catch (err) {
    console.error("Error fetching user currency:", err);
    return "€"; // fallback
  }
};