import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/CurrencyConverter.css";

const API_KEY = "fca_live_8I5FSFO3o0tUuJsXBkFVQEiS1JB3jqUsxkAZw3jg";
const API_URL = "https://api.freecurrencyapi.com/v1/latest";

function CurrencyConverter() {
  const [amount, setAmount] = useState("1");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [rates, setRates] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Common currencies to show at the top
  const popularCurrencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY"];

  // Currency symbols mapping
  const currencySymbols = {
    USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$", 
    AUD: "A$", CHF: "Fr", CNY: "¥", INR: "₹", BRL: "R$",
    MXN: "$", KRW: "₩", RUB: "₽", TRY: "₺", ZAR: "R",
    SGD: "S$", HKD: "HK$", NOK: "kr", SEK: "kr", DKK: "kr",
    PLN: "zł", THB: "฿", IDR: "Rp", MYR: "RM", PHP: "₱",
    CZK: "Kč", ILS: "₪", HUF: "Ft", NZD: "NZ$", RON: "lei",
    BGN: "лв", HRK: "kn", ISK: "kr"
  };

  useEffect(() => {
    fetchRates();
  }, []);

  // Calculate result whenever amount or currencies change
  useEffect(() => {
    if (rates && amount) {
      calculateConversion();
    }
  }, [amount, fromCurrency, toCurrency, rates]);

  const fetchRates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}?apikey=${API_KEY}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }
      
      const data = await response.json();
      setRates(data.data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      setError("Unable to fetch exchange rates. Please try again later.");
      setLoading(false);
    }
  };

  const calculateConversion = () => {
    if (!rates || !amount || isNaN(amount)) {
      setResult(null);
      return;
    }

    const amountNum = parseFloat(amount);
    
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];
    
    if (fromCurrency === "USD") {
      const converted = amountNum * toRate;
      setResult(converted);
    } else if (toCurrency === "USD") {
      const converted = amountNum / fromRate;
      setResult(converted);
    } else {
      const inUSD = amountNum / fromRate;
      const converted = inUSD * toRate;
      setResult(converted);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const formatResult = (value) => {
    if (value === null || value === undefined) return "0.00";
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getRate = () => {
    if (!rates) return "...";
    
    if (fromCurrency === "USD") {
      return rates[toCurrency].toFixed(4);
    } else if (toCurrency === "USD") {
      return (1 / rates[fromCurrency]).toFixed(4);
    } else {
      const inUSD = 1 / rates[fromCurrency];
      const converted = inUSD * rates[toCurrency];
      return converted.toFixed(4);
    }
  };

  // Sort popular currencies first, then alphabetically
  const sortedCurrencies = rates ? Object.keys(rates).sort((a, b) => {
    const aIsPopular = popularCurrencies.includes(a);
    const bIsPopular = popularCurrencies.includes(b);
    
    if (aIsPopular && !bIsPopular) return -1;
    if (!aIsPopular && bIsPopular) return 1;
    return a.localeCompare(b);
  }) : [];

  return (
    <>
      <Navbar />
      <div className="converter-container">
        <div className="converter-content">
          <div className="converter-header">
            <h1>Currency Converter</h1>
            <p>Convert between 33 currencies with live exchange rates</p>
          </div>

          {error && (
            <div className="converter-error">
              <p>{error}</p>
              <button onClick={fetchRates} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          {loading ? (
            <div className="converter-loading">
              <div className="loading-spinner"></div>
              <p>Loading exchange rates...</p>
            </div>
          ) : (
            <div className="converter-card">
              <div className="converter-row">
                <div className="converter-group">
                  <label className="converter-label">From</label>
                  <div className="input-with-select">
                    <div className="amount-input-wrapper">
                      <span className="currency-symbol-input">
                        {currencySymbols[fromCurrency] || fromCurrency}
                      </span>
                      <input
                        type="number"
                        className="amount-input-large"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <select
                      className="currency-select-inline"
                      value={fromCurrency}
                      onChange={(e) => setFromCurrency(e.target.value)}
                    >
                      {sortedCurrencies.map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button className="swap-btn" onClick={swapCurrencies} title="Swap currencies">
                  ⇄
                </button>

                <div className="converter-group">
                  <label className="converter-label">To</label>
                  <div className="input-with-select">
                    <div className="result-display-inline">
                      <span className="result-symbol">
                        {currencySymbols[toCurrency] || toCurrency}
                      </span>
                      <span className="result-amount-inline">
                        {formatResult(result)}
                      </span>
                    </div>
                    <select
                      className="currency-select-inline"
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value)}
                    >
                      {sortedCurrencies.map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="exchange-rate-info">
                <span>1 {fromCurrency} = {getRate()} {toCurrency}</span>
              </div>

              {lastUpdated && (
                <div className="last-updated">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                  <button onClick={fetchRates} className="refresh-btn" title="Refresh rates">
                    ↻
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default CurrencyConverter;