import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import './Form.css';

function Form() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const nav = useNavigate();
  const location = useLocation();

  // Email validation regex: Ensures format like username@domain.com
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Check for registration success state
  useEffect(() => {
    if (location.state?.registrationSuccess) {
      setSuccessMessage("Registration successful! Please log in.");
      setIsLogin(true); // Ensure login form is shown
    }
  }, [location.state]);

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setErrorMessage("");
    setSuccessMessage("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
  };

  // Validate email format
  const isValidEmail = (email) => emailRegex.test(email.toLowerCase());

  // Handle user/admin login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    if (!isValidEmail(username)) {
      setErrorMessage("Please enter a valid email address (e.g., example@domain.com).");
      return;
    }

    const loginData = { email: username.toLowerCase(), password };

    try {
      // Hardcoded admin credentials
      const ADMIN_EMAIL = 'admin@eventxpress.com';
      const ADMIN_PASSWORD = 'admin123';

      // Determine the login endpoint based on credentials
      let url = 'http://localhost:5000/api/login';
      if (username.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        url = 'http://localhost:5000/api/admin/login';
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user and token in sessionStorage
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('userId', data.user.id);

        // Redirect based on user role
        if (data.user.role === 'Admin' || data.user.isAdmin) {
          nav('/admin-dash');
        } else {
          nav('/mainmenu');
        }
      } else {
        setErrorMessage(data.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  // Handle registration
  const handleRegister = (e) => {
    e.preventDefault();

    if (!username || !password || password !== confirmPassword) {
      setErrorMessage("Please fill in all fields and ensure passwords match.");
      return;
    }

    if (!isValidEmail(username)) {
      setErrorMessage("Please enter a valid email address (e.g., example@domain.com).");
      return;
    }

    // Store registration data in lowercase
    sessionStorage.setItem("reg_email", username.toLowerCase());
    sessionStorage.setItem("reg_password", password);
    nav('/information-form');
  };

  // Disable register button if fields are invalid
  const isRegisterButtonDisabled = !username || !password || password !== confirmPassword || !isValidEmail(username);

  return (
    <div className="auth-container">
      <div className="left-sided">
        <div className="form-card">
          {isLogin ? (
            <>
              <h1 className="form-title">Login</h1>
              {successMessage && <p className="success-message">{successMessage}</p>}
              <form className="form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="example.email@domain.com"
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter at least 8+ characters"
                  />
                </div>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <button type="submit" className="submit-button">Log In</button>
              </form>
              <p className="toggle-text">
                Click <span onClick={handleToggle} className="toggle-link">Register</span> if you don't have an account.
              </p>
            </>
          ) : (
            <>
              <h1 className="form-title">Register</h1>
              <form className="form" onSubmit={handleRegister}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="example.email@domain.com"
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter at least 8+ characters"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                  />
                </div>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <button type="submit" className="submit-button" disabled={isRegisterButtonDisabled}>Register</button>
              </form>
              <p className="toggle-text">
                Already have an account? <span onClick={handleToggle} className="toggle-link">Log In</span>
              </p>
            </>
          )}
        </div>
      </div>
      <div className="right-side">
        <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="logo" />
      </div>
    </div>
  );
}

export default Form;