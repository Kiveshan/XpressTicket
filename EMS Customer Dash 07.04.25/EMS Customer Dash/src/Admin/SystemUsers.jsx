"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "../shared/ModernDashboard.css"
import { FaSignOutAlt, FaEye, FaCheck, FaBan, FaSearch } from "react-icons/fa"

const SystemUsers = () => {
  const nav = useNavigate()
  const [activeTable, setActiveTable] = useState("Organiser")
  const [generalUsers, setGeneralUsers] = useState([])
  const [organisers, setOrganisers] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredOrganisers, setFilteredOrganisers] = useState([])
  const [filteredGeneralUsers, setFilteredGeneralUsers] = useState([])

  useEffect(() => {
    // Define the API base URL
    const API_BASE_URL = "http://localhost:5000" // Server is running on port 5000

    // Get token from sessionStorage (where it's stored during login)
    const storedToken = sessionStorage.getItem("token")
    if (storedToken) {
      console.log("Token found in sessionStorage")
      setToken(storedToken)
    } else {
      console.log("No token found in sessionStorage")
      // If no token is found, redirect to login
      alert("Please log in to access this page")
      nav("/")
      return
    }

    // Fetch organizers with events
    const fetchOrganisers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users-with-events`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })
        // Ensure response.data is an array
        if (Array.isArray(response.data)) {
          setOrganisers(response.data)
        } else {
          console.error("API response is not an array:", response.data)
          setOrganisers([])
        }
      } catch (error) {
        console.error("Error fetching organisers:", error)
        setOrganisers([])
      }
    }

    // Fetch general users (users without events)
    const fetchGeneralUsers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users-without-events`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })
        // Ensure response.data is an array
        if (Array.isArray(response.data)) {
          setGeneralUsers(response.data)
        } else {
          console.error("API response is not an array:", response.data)
          setGeneralUsers([])
        }
      } catch (error) {
        console.error("Error fetching general users:", error)
        setGeneralUsers([])
      }
    }

    fetchOrganisers()
    fetchGeneralUsers()
    setLoading(false)
  }, [])

  // Effect to filter data based on search term
  useEffect(() => {
    if (organisers.length > 0) {
      const filtered = organisers.filter((organiser) => {
        const fullName = `${organiser.firstname} ${organiser.surname}`.toLowerCase()
        const email = organiser.email.toLowerCase()
        const eventName = organiser.event_name?.toLowerCase() || ""
        const searchLower = searchTerm.toLowerCase()

        return fullName.includes(searchLower) || email.includes(searchLower) || eventName.includes(searchLower)
      })
      setFilteredOrganisers(filtered)
    }

    if (generalUsers.length > 0) {
      const filtered = generalUsers.filter((user) => {
        const fullName = `${user.firstname} ${user.surname}`.toLowerCase()
        const email = user.email.toLowerCase()
        const role = user.role?.toLowerCase() || ""
        const searchLower = searchTerm.toLowerCase()

        return fullName.includes(searchLower) || email.includes(searchLower) || role.includes(searchLower)
      })
      setFilteredGeneralUsers(filtered)
    }
  }, [searchTerm, organisers, generalUsers])

  // Function to toggle user's disabled status
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      setLoading(true)
      const API_BASE_URL = "http://localhost:5000"

      // Get the token from sessionStorage where it's stored during login
      const currentToken = sessionStorage.getItem("token")

      if (!currentToken) {
        alert("Authentication token not found. Please log in again.")
        nav("/")
        return
      }

      console.log("Using token for toggle status:", currentToken.substring(0, 10) + "...")

      const response = await axios.post(
        `${API_BASE_URL}/api/toggle-user-status`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        },
      )

      // Refresh user lists after toggling status
      const fetchOrganisers = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/users-with-events`)
          if (Array.isArray(response.data)) {
            setOrganisers(response.data)
          }
        } catch (error) {
          console.error("Error fetching organisers:", error)
        }
      }

      const fetchGeneralUsers = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/users-without-events`)
          if (Array.isArray(response.data)) {
            setGeneralUsers(response.data)
          }
        } catch (error) {
          console.error("Error fetching general users:", error)
        }
      }

      await fetchOrganisers()
      await fetchGeneralUsers()

      alert(response.data.message)
      setLoading(false)
    } catch (error) {
      console.error("Error toggling user status:", error)

      // Check if it's an authentication error
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        alert("Your session has expired. Please log in again.")
        sessionStorage.removeItem("token")
        nav("/")
      } else {
        alert("Failed to update user status. Please try again.")
      }

      setLoading(false)
    }
  }

  const renderTable = () => {
    if (loading) {
      return <div className="modern-loading">Loading...</div>
    }

    if (activeTable === "Organiser") {
      return (
        <div className="modern-table-container">
          <table className="modern-table" style={{ borderCollapse: "collapse" }}>
            <thead className="xpress-gradient-header">
              <tr>
                <th className="xpress-white-text-header">Organiser Name</th>
                <th className="xpress-white-text-header">Email</th>
                <th className="xpress-white-text-header">Event</th>
                <th className="xpress-white-text-header">Date of Event</th>
                <th className="xpress-white-text-header">Status</th>
                <th className="xpress-white-text-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(filteredOrganisers) && filteredOrganisers.length > 0 ? (
                filteredOrganisers.map((organiser, index) => (
                  <tr key={`organiser-${organiser.user_id}-${index}`}>
                    <td>{`${organiser.firstname} ${organiser.surname}`}</td>
                    <td>{organiser.email}</td>
                    <td>{organiser.event_name}</td>
                    <td>{organiser.formatted_date || new Date(organiser.startdate).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`modern-badge ${
                          organiser.is_disabled === 1 ? "modern-badge-warning" : "modern-badge-success"
                        }`}
                      >
                        {organiser.is_disabled === 1 ? "Disabled" : "Enabled"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="modern-action-btn"
                        onClick={() => nav("/viewingorganiser", { state: { userId: organiser.user_id } })}
                        title="View organizer details"
                      >
                        <FaEye />
                      </button>
                      <button
                        className={`modern-action-btn ${organiser.is_disabled === 1 ? "action-enable" : "action-disable"}`}
                        onClick={() => toggleUserStatus(organiser.user_id, organiser.is_disabled)}
                        title={organiser.is_disabled === 1 ? "Enable user" : "Disable user"}
                      >
                        {organiser.is_disabled === 1 ? <FaCheck /> : <FaBan />}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key="no-organisers">
                  <td colSpan="6">No organizers found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )
    } else if (activeTable === "General Users") {
      return (
        <div className="modern-table-container">
          <table className="modern-table" style={{ borderCollapse: "collapse" }}>
            <thead className="xpress-gradient-header">
              <tr>
                <th className="xpress-white-text-header">Customer Name</th>
                <th className="xpress-white-text-header">Email</th>
                <th className="xpress-white-text-header">Role</th>
                <th className="xpress-white-text-header">Status</th>
                <th className="xpress-white-text-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(filteredGeneralUsers) && filteredGeneralUsers.length > 0 ? (
                filteredGeneralUsers.map((user, index) => (
                  <tr key={`user-${user.user_id}-${index}`}>
                    <td>{`${user.firstname} ${user.surname}`}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className="modern-badge modern-badge-info">{user.role}</span>
                    </td>
                    <td>
                      <span
                        className={`modern-badge ${
                          user.is_disabled === 1 ? "modern-badge-warning" : "modern-badge-success"
                        }`}
                      >
                        {user.is_disabled === 1 ? "Disabled" : "Enabled"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="modern-action-btn"
                        onClick={() => nav("/viewingcustomer", { state: { userId: user.user_id } })}
                        title="View user details"
                      >
                        <FaEye />
                      </button>
                      <button
                        className={`modern-action-btn ${user.is_disabled === 1 ? "action-enable" : "action-disable"}`}
                        onClick={() => toggleUserStatus(user.user_id, user.is_disabled)}
                        title={user.is_disabled === 1 ? "Enable user" : "Disable user"}
                      >
                        {user.is_disabled === 1 ? <FaCheck /> : <FaBan />}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key="no-users">
                  <td colSpan="5">No general users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )
    }
  }

  return (
    <div className="modern-dashboard-container">
      {/* Modern Header */}
      <header className="modern-header">
        <img src="/XPRESS TICKETS LOGO2.png" alt="EventXpress Logo" className="modern-logo" />
        <div className="modern-header-actions">
          <button className="modern-logout-btn" onClick={() => nav("/")}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* Back Button - Original Style */}
      <div className="back-button-container1">
        <button className="backbutton20" onClick={() => nav("/admin-dash")}>
          Back
        </button>
      </div>

      {/* Main Content */}
      <main className="modern-main-content">
        <h1 className="modern-page-title">System Users</h1>

        {/* Search Input */}
        <div className="modern-search-filter">
          <div className="modern-search-input">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="modern-search-icon-right" />
          </div>
        </div>

        {/* Tab Navigation - Centered */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTable === "Organiser" ? "transparent" : "white",
              color: activeTable === "Organiser" ? "white" : "#2c3e50",
              fontWeight: activeTable === "Organiser" ? "600" : "500",
              fontSize: "14px",
              transition: "all 0.3s ease",
              boxShadow:
                activeTable === "Organiser" ? "0 4px 12px rgba(44, 62, 80, 0.25)" : "0 2px 5px rgba(0,0,0,0.08)",
              background: activeTable === "Organiser" ? "linear-gradient(135deg, #2c3e50, #4ca1af)" : "white",
            }}
            onClick={() => setActiveTable("Organiser")}
          >
            Events
          </button>
          <button
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTable === "General Users" ? "transparent" : "white",
              color: activeTable === "General Users" ? "white" : "#2c3e50",
              fontWeight: activeTable === "General Users" ? "600" : "500",
              fontSize: "14px",
              transition: "all 0.3s ease",
              boxShadow:
                activeTable === "General Users" ? "0 4px 12px rgba(44, 62, 80, 0.25)" : "0 2px 5px rgba(0,0,0,0.08)",
              background: activeTable === "General Users" ? "linear-gradient(135deg, #2c3e50, #4ca1af)" : "white",
            }}
            onClick={() => setActiveTable("General Users")}
          >
            Delegate
          </button>
        </div>

        {renderTable()}
      </main>
    </div>
  )
}

export default SystemUsers
