import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "../Organiser/Analytics.css";
import { useNavigate } from "react-router-dom";

export default function Analytics() {
  const [activeFilter, setActiveFilter] = useState("attendance");
  const [chartData, setChartData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in.');
          navigate('/');
          return;
        }

        setLoading(true);
        const response = await fetch('http://localhost:5000/api/organiser/analytics', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        // Filter data by month and year
        let filteredData = data[activeFilter];

        if (selectedMonth !== "All") {
          filteredData = filteredData.filter((item) => item.month === selectedMonth);
        }
        if (selectedYear !== "All") {
          filteredData = filteredData.filter((item) => item.year === selectedYear);
        }

        setChartData(filteredData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [activeFilter, selectedMonth, selectedYear, navigate]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-value" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (activeFilter) {
      case "attendance":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <XAxis dataKey="event" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="attendance" name="Attendance" fill="#2196F3" radius={[4, 4, 0, 0]} />
              <Bar dataKey="capacity" name="Capacity" fill="#9C27B0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case "eventStatus":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="approved" name="Approved" fill="#4CAF50" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" name="Rejected" fill="#F44336" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill="#FFC107" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case "ticketsSold":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <XAxis dataKey="event" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="ticketsSold" name="Tickets Sold" fill="#FF9800" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  const handleBack = () => {
    navigate("/organiser-dash");
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="analytics-container">
      <header className="dashboard-header3">
        <img
          src="/XPRESS TICKETS LOGO2.png"
          alt="EventXpress Logo"
          className="dashboard-logo1"
        />
        <div className="profile-section">
          <button className="backbutton22" onClick={() => navigate("/")}>
            LogOut
          </button>
        </div>
      </header>

      <div className="back-button-container1">
        <button className="backbutton20" onClick={handleBack}>
          Back
        </button>
      </div>

      <div className="analytics-content">
        <div className="sidebar-filters">
          <button
            className={`filter-button ${activeFilter === "attendance" ? "active" : ""}`}
            onClick={() => setActiveFilter("attendance")}
          >
            Attendance
          </button>
          <button
            className={`filter-button ${activeFilter === "eventStatus" ? "active" : ""}`}
            onClick={() => setActiveFilter("eventStatus")}
          >
            Event Status
          </button>
          <button
            className={`filter-button ${activeFilter === "ticketsSold" ? "active" : ""}`}
            onClick={() => setActiveFilter("ticketsSold")}
          >
            Tickets Sold
          </button>
        </div>

        {/* Chart area */}
        <div className="chart-area">
          {/* Month and Year Filters */}
          <div className="filter-controls">
            <select
              className="filter-dropdown"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All">All Months</option>
              <option value="January">January</option>
              <option value="February">February</option>
              <option value="March">March</option>
              <option value="April">April</option>
              <option value="May">May</option>
              <option value="June">June</option>
              <option value="July">July</option>
              <option value="August">August</option>
              <option value="September">September</option>
              <option value="October">October</option>
              <option value="November">November</option>
              <option value="December">December</option>
            </select>
            <select
              className="filter-dropdown"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="All">All Years</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          <h2 className="chart-title">
            {activeFilter === "attendance" && "Attendance Analysis"}
            {activeFilter === "eventStatus" && "Event Status Analysis"}
            {activeFilter === "ticketsSold" && "Tickets Sold Analysis"}
          </h2>
          {renderChart()}
        </div>
      </div>
    </div>
  );
}