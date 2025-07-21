"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./Form.css"

function Form() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const nav = useNavigate()

  const handleToggle = () => {
    setIsLogin(!isLogin)
    setErrorMessage("")
    setUsername("")
    setPassword("")
    setConfirmPassword("")
  }

  // Handle user/admin login
  const handleLogin = async (e) => {
    e.preventDefault()

    if (!username || !password) {
      setErrorMessage("Please enter both email and password.")
      return
    }

    const loginData = { email: username, password }

    try {
      // Check if admin credentials
      const ADMIN_EMAIL = "admin@eventxpress.com"
      const ADMIN_PASSWORD = "admin123"

      let url = "http://localhost:5000/api/login"
      if (username === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        url = "http://localhost:5000/api/admin/login"
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      if (response.ok) {
        // Store user and token in sessionStorage with consistent naming
        console.log("Login successful, storing session data:", data)

        sessionStorage.setItem("userId", data.user.id)
        sessionStorage.setItem("user", JSON.stringify(data.user))
        sessionStorage.setItem("token", data.token)

        // Also store userInfo for backward compatibility
        sessionStorage.setItem(
          "userInfo",
          JSON.stringify({
            userId: data.user.id,
            user_id: data.user.id,
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
          }),
        )

        console.log("Session storage after login:")
        console.log("userId:", sessionStorage.getItem("userId"))
        console.log("user:", sessionStorage.getItem("user"))
        console.log("userInfo:", sessionStorage.getItem("userInfo"))
        console.log("token:", sessionStorage.getItem("token") ? "exists" : "missing")

        // Check user role and redirect accordingly
        if (data.user.role === "Admin") {
          nav("/admin-dash")
        } else if (data.user.isAdmin) {
          // Keep backward compatibility with the existing isAdmin check
          nav("/admin-dash")
        } else {
          nav("/mainmenu")
        }
      } else {
        setErrorMessage(data.message || "Login failed. Please check your credentials.")
      }
    } catch (error) {
      console.error("Error logging in:", error)
      setErrorMessage("An error occurred. Please try again.")
    }
  }

  // Handle registration
  const handleRegister = (e) => {
    e.preventDefault()

    if (!username || !password || password !== confirmPassword) {
      return
    }

    // Store registration data (for next step in flow)
    sessionStorage.setItem("reg_email", username)
    sessionStorage.setItem("reg_password", password)
    nav("/information-form")
  }

  const isRegisterButtonDisabled = !username || !password || password !== confirmPassword

  return (
    <div className="auth-container">
      <div className="left-side">
        <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="logo" />
      </div>
      <div className="right-side">
        <div className="form-card">
          {isLogin ? (
            <>
              <h1 className="form-title">Login</h1>
              <form className="form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="example.email@gmail.com"
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
                <button type="submit" className="submit-button">
                  Log In
                </button>
              </form>
              <p className="toggle-text">
                Click{" "}
                <span onClick={handleToggle} className="toggle-link">
                  Register
                </span>{" "}
                if you do have Account.
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
                    placeholder="example.email@gmail.com"
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
                <button type="submit" className="submit-button" disabled={isRegisterButtonDisabled}>
                  Register
                </button>
              </form>
              <p className="toggle-text">
                Already have an account?{" "}
                <span onClick={handleToggle} className="toggle-link">
                  Log In
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Form
