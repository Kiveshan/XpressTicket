import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import "../Organiser/Analytics.css";
import { useNavigate } from "react-router-dom";

export default function Analytics() {
  const [activeFilter, setActiveFilter] = useState("profitVsTickets");
  const [chartData, setChartData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const navigate = useNavigate();

  // Sample data for events
  const eventAnalyticsData = {
    profitVsTickets: [
      { event: "Tech Conference", profit: 50000, ticketsSold: 200, month: "June", year: "2023" },
      { event: "Music Festival", profit: 75000, ticketsSold: 300, month: "July", year: "2023" },
      { event: "Art Expo", profit: 30000, ticketsSold: 150, month: "June", year: "2022" },
      { event: "Food Carnival", profit: 60000, ticketsSold: 250, month: "August", year: "2023" },
    ],
    attendance: [
      { event: "Tech Conference", attendance: 180, capacity: 200, month: "June", year: "2023" },
      { event: "Music Festival", attendance: 290, capacity: 300, month: "July", year: "2023" },
      { event: "Art Expo", attendance: 140, capacity: 150, month: "June", year: "2022" },
      { event: "Food Carnival", attendance: 230, capacity: 250, month: "August", year: "2023" },
    ],
    revenueVsExpenses: [
      { event: "Tech Conference", revenue: 100000, expenses: 50000, month: "June", year: "2023" },
      { event: "Music Festival", revenue: 150000, expenses: 75000, month: "July", year: "2023" },
      { event: "Art Expo", revenue: 60000, expenses: 30000, month: "June", year: "2022" },
      { event: "Food Carnival", revenue: 120000, expenses: 60000, month: "August", year: "2023" },
    ],
    ratings: [
      { event: "Tech Conference", rating: 4.5, month: "June", year: "2023" },
      { event: "Music Festival", rating: 4.8, month: "July", year: "2023" },
      { event: "Art Expo", rating: 4.2, month: "June", year: "2022" },
      { event: "Food Carnival", rating: 4.6, month: "August", year: "2023" },
    ],
  };

  // Update chart data when the filter changes
  useEffect(() => {
    let filteredData = eventAnalyticsData[activeFilter];

    // Apply month and year filters
    if (selectedMonth !== "All") {
      filteredData = filteredData.filter((item) => item.month === selectedMonth);
    }
    if (selectedYear !== "All") {
      filteredData = filteredData.filter((item) => item.year === selectedYear);
    }

    setChartData(filteredData);
  }, [activeFilter, selectedMonth, selectedYear]);

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

  // Render different charts based on the active filter
  const renderChart = () => {
    switch (activeFilter) {
      case "profitVsTickets":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <XAxis dataKey="event" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="profit" name="Profit (R)" fill="#4CAF50" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ticketsSold" name="Tickets Sold" fill="#FFC107" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
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
      case "revenueVsExpenses":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <XAxis dataKey="event" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue (R)" fill="#4CAF50" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses (R)" fill="#F44336" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case "ratings":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <XAxis dataKey="event" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="rating" name="Event Rating" stroke="#FFC107" />
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  const handleBack = () => {
    navigate("/event-list");
  };

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
        {/* Sidebar filters */}
        <div className="sidebar-filters">
          <button
            className={`filter-button ${activeFilter === "profitVsTickets" ? "active" : ""}`}
            onClick={() => setActiveFilter("profitVsTickets")}
          >
            Profit vs Tickets Sold
          </button>
          <button
            className={`filter-button ${activeFilter === "attendance" ? "active" : ""}`}
            onClick={() => setActiveFilter("attendance")}
          >
            Attendance
          </button>
          <button
            className={`filter-button ${activeFilter === "revenueVsExpenses" ? "active" : ""}`}
            onClick={() => setActiveFilter("revenueVsExpenses")}
          >
            Revenue vs Expenses
          </button>
          <button
            className={`filter-button ${activeFilter === "ratings" ? "active" : ""}`}
            onClick={() => setActiveFilter("ratings")}
          >
            Event Ratings
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
            <option value="June">June</option>
            <option value="July">July</option>
            <option value="August">August</option>
          </select>
          <select
            className="filter-dropdown"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="All">All Years</option>
            <option value="2022">2022</option>
            <option value="2023">2023</option>
          </select>
        </div>
          <h2 className="chart-title">
            {activeFilter === "profitVsTickets" && "Profit vs Tickets Sold"}
            {activeFilter === "attendance" && "Attendance Analysis"}
            {activeFilter === "revenueVsExpenses" && "Revenue vs Expenses"}
            {activeFilter === "ratings" && "Event Ratings"}
          </h2>
          {renderChart()}
        </div>
      </div>
    </div>
  );
}
