"use client"

import { useState, useEffect } from "react";
import "./EventRequest.css";
import { useNavigate } from "react-router-dom";
import logo from "/XPRESS TICKETS LOGO2.png";

const EventRequest = () => {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("user");
    nav("/login");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not specified";
    try {
      console.log("EventRequest formatDate input:", dateString);
      const [year, month, day] = dateString.split('-');
      if (!year || !month || !day || year.length !== 4 || isNaN(Date.parse(`${year}-${month}-${day}`))) {
        throw new Error("Invalid date format");
      }
      const date = new Date(`${year}-${month}-${day}`);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      const dayFormatted = String(date.getDate()).padStart(2, '0');
      const monthFormatted = String(date.getMonth() + 1).padStart(2, '0');
      const yearFormatted = date.getFullYear();
      return `${dayFormatted}/${monthFormatted}/${yearFormatted}`;
    } catch (error) {
      console.error("EventRequest date formatting error:", error, "Input:", dateString);
      return "Date not specified";
    }
  };

  const extractLowestPrice = (packages) => {
    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      return "N/A";
    }
    try {
      const prices = packages
        .map(pkg => {
          try {
            const parsedPkg = typeof pkg === 'string' ? JSON.parse(pkg) : pkg;
            return parsedPkg.pricing ? parseFloat(parsedPkg.pricing.replace(/[^0-9.]/g, '')) : null;
          } catch (e) {
            console.warn(`Failed to parse package: ${JSON.stringify(pkg)}`, e);
            return null;
          }
        })
        .filter(price => price !== null && !isNaN(price));
      if (prices.length === 0) {
        return "N/A";
      }
      const lowestPrice = Math.min(...prices);
      return `R ${lowestPrice.toFixed(2)}`;
    } catch (error) {
      console.error("Price extraction error:", error);
      return "N/A";
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = sessionStorage.getItem("token");
      let userId = sessionStorage.getItem("userId");
      if (!userId) {
        const userData = sessionStorage.getItem("user");
        if (userData) {
          try {
            const user = JSON.parse(userData);
            userId = user.id;
            if (userId) {
              sessionStorage.setItem("userId", userId);
            }
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        }
      }
      if (!token || !userId) {
        console.warn("Authentication required - No token or user ID found");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("user");
        nav("/login");
        return;
      }
      let tokenPayload;
      try {
        const tokenParts = token.split(".");
        if (tokenParts.length !== 3) {
          throw new Error("Invalid token format");
        }
        tokenPayload = JSON.parse(atob(tokenParts[1]));
        const now = Math.floor(Date.now() / 1000);
        if (tokenPayload.exp && tokenPayload.exp < now) {
          throw new Error("Token expired");
        }
      } catch (tokenError) {
        console.error("Token validation error:", tokenError);
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("user");
        nav("/login");
        return;
      }
      const apiUrl = "http://localhost:5000/api/events";
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("userId");
          sessionStorage.removeItem("user");
          nav("/login");
          return;
        }
        throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log("EventRequest fetched events:", data);
      const eventsData = Array.isArray(data) ? data : [];
      const eventsWithFormattedData = eventsData.map((event) => ({
        id: event.id || event.event_id,
        eventid: event.id || event.event_id,
        event_name: event.name || "Unnamed Event",
        location: event.location || "Location not specified",
        date: event.start_date || "Date not specified",
        time: event.start_time || "Time not specified",
        price: extractLowestPrice(event.packages),
        status: (event.status || "Pending").toLowerCase(),
        file_url: event.coverimage || "/default-event-image.jpg",
        description: event.description || "No description available",
      }));
      setEvents(eventsWithFormattedData);
      setFilteredEvents(eventsWithFormattedData);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load events. Please try again later.");
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchEvents();
    const interval = setInterval(fetchEvents, 10 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [nav]);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter((event) => event.status === statusFilter));
    }
  }, [statusFilter, events]);

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleImageError = (e) => {
    if (e.target.src !== "/default-event-image.jpg") {
      console.warn(`Failed to load image: ${e.target.src}`);
      e.target.src = "/default-event-image.jpg";
      e.target.classList.add("image-error");
    }
  };

  if (loading) {
    return (
      <div className="modern-container">
        <header className="modern-header">
          <div className="header-left">
            <button className="modern-button" onClick={() => nav("/requestcard")}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
            <img
              src={logo}
              alt="EventXpress Logo"
              className="header-logo"
              onError={(e) => {
                console.warn("Failed to load logo:", e.target.src);
                e.target.src = "/default-event-image.jpg";
              }}
            />
          </div>
          <div className="modern-header-actions">
            <button className="modern-button" onClick={handleLogout}>
              <span className="button-icon">↩</span> Logout
            </button>
          </div>
        </header>
        <div className="modern-loading">
          <div className="modern-spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes("log in") || error.includes("expired");
    return (
      <div className="modern-container">
        <header className="modern-header">
          <div className="header-left">
            <button
              className="modern-button"
              onClick={() => (isAuthError ? nav("/login") : nav("/requestcard"))}
            >
              <i className="fas fa-arrow-left"></i> {isAuthError ? "Go to Login" : "Back"}
            </button>
            <img
              src={logo}
              alt="EventXpress Logo"
              className="header-logo"
              onError={(e) => {
                console.warn("Failed to load logo:", e.target.src);
                e.target.src = "/default-event-image.jpg";
              }}
            />
          </div>
          <div className="modern-header-actions">
            {!isAuthError && (
              <button className="modern-button" onClick={handleLogout}>
                <span className="button-icon">↩</span> Logout
              </button>
            )}
          </div>
        </header>
        <div className="modern-error">
          <p>{isAuthError ? "Authentication Required" : "Error Loading Events"}</p>
          <p>{error}</p>
          <button
            className="modern-button"
            onClick={() => {
              if (isAuthError) {
                sessionStorage.clear();
                nav("/login");
              } else {
                setError(null);
                setLoading(true);
                setEvents([]);
                setFilteredEvents([]);
                fetchEvents();
              }
            }}
          >
            {isAuthError ? "Go to Login" : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-container">
      <header className="modern-header">
        <div className="header-left">
          <button className="modern-button" onClick={() => nav("/requestcard")}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <img
            src={logo}
            alt="EventXpress Logo"
            className="header-logo"
            onError={(e) => {
              console.warn("Failed to load logo:", e.target.src);
              e.target.src = "/default-event-image.jpg";
            }}
          />
        </div>
        <div className="modern-header-actions">
          <button className="modern-button" onClick={handleLogout}>
            <span className="button-icon">↩</span> Logout
          </button>
        </div>
      </header>
      <main className="modern-main-content">
        <div className="filter-container">
          <label htmlFor="status-filter" className="filter-label">
            Filter by Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        {filteredEvents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            color: '#6c757d',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            <p style={{ margin: 0, fontSize: '1rem', maxWidth: '500px', lineHeight: 1.6 }}>
              No events found{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}. Create your first event to get started!
            </p>
            <button
              style={{
                background: 'linear-gradient(135deg, #2c3e50, #4ca1af)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
              }}
              onClick={() => nav("/create-event")}
              onMouseOver={(e) => {
                e.target.style.opacity = '0.95';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
              }}
            >
              Create New Event
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.5rem',
            maxWidth: '1200px',
            margin: '20px auto',
            padding: '0 20px'
          }}>
            {filteredEvents.map((event) => (
              <div key={event.id} style={{
                background: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e9ecef',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
              }}
              >
                <div style={{
                  width: '100%',
                  height: '180px',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#f8f9fa',
                  borderBottom: '1px solid #e9ecef'
                }}>
                  <img
                    src={event.file_url}
                    alt={event.event_name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                    onError={handleImageError}
                    onLoad={(e) => {
                      if (e.target.src.includes('default-event-image.jpg')) {
                        e.target.classList.add("image-error");
                      }
                    }}
                  />
                  {!event.file_url && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#e9ecef',
                      color: '#6c757d',
                      fontSize: '0.9rem',
                      textAlign: 'center',
                      padding: '1rem'
                    }}>
                      <span>No Image</span>
                    </div>
                  )}
                </div>
                <h3 style={{
                  margin: '1rem 1rem 0.75rem',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#2c3e50',
                  lineHeight: 1.3
                }}>
                  {event.event_name}
                </h3>
                <div style={{
                  padding: '0 1rem',
                  flex: 1,
                  color: '#495057',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  marginBottom: '1rem'
                }}>
                  <p style={{
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i style={{ color: '#4ca1af', width: '16px', textAlign: 'center' }}>📍</i>
                      {event.location}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i style={{ color: '#4ca1af', width: '16px', textAlign: 'center' }}>📅</i>
                      {formatDate(event.date)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i style={{ color: '#4ca1af', width: '16px', textAlign: 'center' }}>💰</i>
                      {event.price}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i style={{ color: '#4ca1af', width: '16px', textAlign: 'center' }}>⏰</i>
                      {event.time}
                    </span>
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 1rem 1rem',
                  borderTop: '1px solid #f8f9fa',
                  paddingTop: '1rem'
                }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: event.status === 'approved' ? '#d1e7dd' :
                                    event.status === 'pending' ? '#fff3cd' : '#f8d7da',
                    color: event.status === 'approved' ? '#0f5132' :
                           event.status === 'pending' ? '#664d03' : '#842029'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: event.status === 'approved' ? '#0f5132' :
                                      event.status === 'pending' ? '#664d03' : '#842029'
                    }}></span>
                    Status: {event.status}
                  </span>
                  <button
                    style={{
                      backgroundColor: '#4ca1af',
                      color: 'white',
                      border: 'none',
                      padding: '8px 15px',
                      borderRadius: '6px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => nav("/viewerequest", { state: { eventid: event.id } })}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#3d8a96';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = '#4ca1af';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default EventRequest;