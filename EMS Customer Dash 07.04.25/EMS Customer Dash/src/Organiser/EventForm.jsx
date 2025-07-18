import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./EventForm.css"

export default function EventForm() {
  const navigate = useNavigate()

  // Helper functions
  const getTodayDateString = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const getCurrentTimeString = () => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    return `${hours}:${minutes}`
  }

  const computeDuration = (startDate, endDate, startTime, endTime) => {
    try {
      const start = new Date(`${startDate}T${startTime}`)
      const end = new Date(`${endDate}T${endTime}`)
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return ""
      const diffMs = end - start
      if (diffMs < 0) return ""
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}h ${minutes}m`
    } catch (error) {
      console.error("Error computing duration:", error)
      return ""
    }
  }

  // State management
  const [formData, setFormData] = useState(() => {
    const today = getTodayDateString()
    const now = getCurrentTimeString()
    return {
      name: "",
      location: "",
      startdate: today,
      enddate: today,
      start_time: now,
      end_time: now,
      deadlinedate: today,
      deadlinetime: now,
      type: "",
      capacity: 1,
      description: "",
      terms_and_conditions: "",
      duration: "",
    }
  })

  const [errors, setErrors] = useState({})
  const [isFormValid, setIsFormValid] = useState(false)
  const [selectedClientTypes, setSelectedClientTypes] = useState([])
  const [clientTypeSelection, setClientTypeSelection] = useState("")
  const [customClientType, setCustomClientType] = useState("")
  const [customEventType, setCustomEventType] = useState("")
  const [packages, setPackages] = useState([
    {
      selectType: "Full Package",
      packageType: "",
      location: "",
      duration: "",
      startDate: getTodayDateString(),
      endDate: getTodayDateString(),
      pricing: "",
      details: "",
      typeOptions: ["Full Package", "Day"],
    },
  ])
  const [tabs, setTabs] = useState([{ name: "", content: "" }])
  const [coverImageFile, setCoverImageFile] = useState(null)
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentSection, setCurrentSection] = useState("eventInfo")

  // Effect for computing duration
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      duration: computeDuration(prev.startdate, prev.enddate, prev.start_time, prev.end_time),
    }))
  }, [formData.startdate, formData.enddate, formData.start_time, formData.end_time])

  // Effect for form validation
  useEffect(() => {
    validateForm()
  }, [
    formData.name,
    formData.location,
    formData.startdate,
    formData.enddate,
    formData.start_time,
    formData.end_time,
    formData.deadlinedate,
    formData.deadlinetime,
    formData.type,
    formData.capacity,
    formData.description,
    formData.terms_and_conditions,
    formData.duration,
    selectedClientTypes,
    tabs,
    packages,
    coverImageFile,
  ])

  // ValidateForm function
  const validateForm = () => {
    const newErrors = {};
    const createDate = (dateStr, timeStr = "") => {
      if (!dateStr) return null;
      try {
        if (dateStr.includes("T")) return new Date(dateStr);
        const [year, month, day] = dateStr.split("-").map(Number);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        if (!timeStr) return new Date(year, month - 1, day);
        const [hours, minutes] = timeStr.split(":").map(Number);
        return new Date(year, month - 1, day, hours || 0, minutes || 0);
      } catch (error) {
        console.error("Error creating date:", error);
        return null;
      }
    };

    if (!formData.name.trim()) newErrors.name = "Event name is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.startdate) newErrors.startdate = "Start date is required";
    if (!formData.enddate) newErrors.enddate = "End date is required";
    if (!formData.start_time) newErrors.start_time = "Start time is required";
    if (!formData.end_time) newErrors.end_time = "End time is required";
    if (!formData.deadlinedate) newErrors.deadlinedate = "Registration deadline date is required";
    if (!formData.deadlinetime) newErrors.deadlinetime = "Registration deadline time is required";
    if (!formData.type.trim()) newErrors.type = "Event type is required";
    if (formData.type === "Other" && !customEventType.trim()) newErrors.type = "Custom event type is required when 'Other' is selected";
    if (!formData.capacity || formData.capacity <= 0) newErrors.capacity = "Capacity must be greater than 0";
    if (!formData.description.trim()) newErrors.description = "Event details are required";
    if (!formData.terms_and_conditions.trim()) newErrors.terms_and_conditions = "Terms and conditions are required";
    if (!formData.duration) newErrors.duration = "Duration cannot be computed (check dates/times)";
    if (selectedClientTypes.length === 0) newErrors.attendees = "At least one client type is required";

    if (formData.startdate && formData.enddate) {
      const startDate = new Date(formData.startdate);
      const endDate = new Date(formData.enddate);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        newErrors.startdate = "Invalid date format";
      } else if (endDate < startDate) {
        newErrors.enddate = "End date cannot be before start date";
      }
    }

    if (formData.startdate && formData.enddate && formData.start_time && formData.end_time) {
      const startTime = createDate(formData.startdate, formData.start_time);
      const endTime = createDate(formData.enddate, formData.end_time);
      if (endTime <= startTime) {
        newErrors.end_time = "End time must be after start time";
      }
    }

    if (formData.deadlinedate) {
      const deadlineDate = new Date(formData.deadlinedate);
      if (isNaN(deadlineDate.getTime())) {
        newErrors.deadlinedate = "Invalid deadline date format";
      }
    }

    if (tabs.length === 0) {
      newErrors.tabs = "At least one tab is required";
    } else {
      tabs.forEach((tab, idx) => {
        if (!tab.name.trim()) newErrors[`tab_name_${idx}`] = `Tab ${idx + 1} name is required`;
        if (!tab.content.trim()) newErrors[`tab_content_${idx}`] = `Tab ${idx + 1} content is required`;
      });
    }

    if (packages.length === 0) {
      newErrors.packages = "At least one package is required";
    } else {
      packages.forEach((pkg, idx) => {
        if (!pkg.selectType.trim()) newErrors[`package_selectType_${idx}`] = `Package ${idx + 1} select type is required`;
        if (!pkg.packageType.trim()) newErrors[`package_type_${idx}`] = `Package ${idx + 1} type is required`;
        if (!pkg.location.trim()) newErrors[`package_location_${idx}`] = `Package ${idx + 1} location is required`;
        if (!pkg.duration || !/^\d+$/.test(pkg.duration) || parseInt(pkg.duration, 10) <= 0)
          newErrors[`package_duration_${idx}`] = `Package ${idx + 1} duration must be a positive number`;
        if (!pkg.startDate) newErrors[`package_startDate_${idx}`] = `Package ${idx + 1} start date is required`;
        if (!pkg.endDate) newErrors[`package_endDate_${idx}`] = `Package ${idx + 1} end date is required`;
        if (!pkg.pricing || !/^\d+(\.\d{1,2})?$/.test(pkg.pricing))
          newErrors[`package_pricing_${idx}`] = `Package ${idx + 1} pricing must be a valid number (e.g., 123.45)`;
        else if (parseFloat(pkg.pricing) <= 0)
          newErrors[`package_pricing_${idx}`] = `Package ${idx + 1} pricing must be greater than 0`;
        if (!pkg.details.trim()) newErrors[`package_details_${idx}`] = `Package ${idx + 1} details are required`;

        if (pkg.startDate && pkg.endDate) {
          const start = new Date(pkg.startDate);
          const end = new Date(pkg.endDate);
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            newErrors[`package_startDate_${idx}`] = `Package ${idx + 1} invalid date format`;
          } else if (end < start) {
            newErrors[`package_endDate_${idx}`] = `Package ${idx + 1} end date cannot be before start date`;
          }
        }

        if (pkg.startDate && formData.deadlinedate) {
          const packageStartDate = new Date(pkg.startDate);
          const deadlineDate = new Date(formData.deadlinedate);
          const minPackageDate = new Date(deadlineDate);
          minPackageDate.setDate(deadlineDate.getDate() - 7);
          if (isNaN(packageStartDate.getTime()) || isNaN(deadlineDate.getTime())) {
            newErrors[`package_startDate_${idx}`] = `Package ${idx + 1} invalid date format`;
          } else if (packageStartDate > minPackageDate) {
            newErrors[`package_startDate_${idx}`] = `Package ${idx + 1} start date must be at least one week before registration deadline`;
          }
        }
      });
    }

    if (
      !coverImageFile ||
      !(coverImageFile instanceof File) ||
      !["image/png", "image/jpeg"].includes(coverImageFile.type)
    ) {
      newErrors.cover_image = "A valid PNG or JPEG cover image is required";
    }

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  };

  // Input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleEventTypeChange = (e) => {
    const value = e.target.value
    setFormData({ ...formData, type: value })
    if (value !== "Other") {
      setCustomEventType("")
    }
  }

  const handleCustomEventTypeChange = (e) => {
    setCustomEventType(e.target.value)
  }

  const handleDateChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const updated = { ...prev, [name]: value }
      if (name === "startdate" && prev.enddate < value) {
        updated.enddate = value
      }
      if (name === "start_time" && prev.deadlinetime) {
        updated.deadlinetime = value
      }
      return updated
    })
  }

  const handleNumberInput = (e) => {
    const { name, value } = e.target
    if (value === "" || /^\d+$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 1 : Number.parseInt(value, 10),
      }))
    }
  }

  const handleClientTypeChange = (e) => {
    const value = e.target.value
    setClientTypeSelection(value)
    if (value && value !== "Other" && !selectedClientTypes.includes(value)) {
      setSelectedClientTypes((prev) => [...prev, value])
      setTimeout(() => setClientTypeSelection(""), 100)
    }
  }

  const handleAddCustomClientType = () => {
    const trimmedType = customClientType.trim()
    if (trimmedType && !selectedClientTypes.includes(trimmedType)) {
      setSelectedClientTypes([...selectedClientTypes, trimmedType])
      setCustomClientType("")
      setClientTypeSelection("")
    } else if (selectedClientTypes.includes(trimmedType)) {
      alert("This client type already exists.")
    }
  }

  const handleRemoveClientType = (typeToRemove) => {
    setSelectedClientTypes(selectedClientTypes.filter((type) => type !== typeToRemove))
  }

  const addPackage = () => {
    setPackages([
      ...packages,
      {
        selectType: "Full Package",
        packageType: "",
        location: "",
        duration: "",
        startDate: getTodayDateString(),
        endDate: getTodayDateString(),
        pricing: "",
        details: "",
        typeOptions: ["Full Package", "Day"],
      },
    ])
  }

  const handlePackageChange = (index, field, value) => {
    const updated = [...packages];
    if (field === "pricing") {
      if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
        updated[index][field] = value;
      }
    } else if (field === "duration") {
      if (value === "" || /^\d+$/.test(value)) {
        updated[index][field] = value;
      }
    } else {
      updated[index][field] = value;
    }
    setPackages(updated);
  }

  const addTab = () => {
    setTabs([...tabs, { name: "", content: "" }])
  }

  const handleTabChange = (index, field, value) => {
    const updated = [...tabs]
    updated[index][field] = value
    setTabs(updated)
  }

  const addDropdownOption = (index) => {
    const newOption = prompt("Enter new option:")
    if (newOption) {
      const updated = [...packages]
      updated[index].typeOptions.push(newOption)
      setPackages(updated)
    }
  }

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0]
    if (file && file instanceof File && ["image/png", "image/jpeg"].includes(file.type) && file.size > 0) {
      setCoverImageFile(file)
      alert(`Cover image selected: ${file.name}`)
    } else {
      alert("Please select a valid PNG or JPEG file for cover image.")
      setCoverImageFile(null)
    }
  }

  const handleSendRequest = async () => {
    setErrorMessage("")
    setShowSuccess(false)
    setIsSubmitting(true)

    if (!isFormValid) {
      alert("Please fill in all required fields correctly.")
      setIsSubmitting(false)
      return
    }

    try {
      const token = sessionStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found. Please log in.")
      }

      const formDataToSend = new FormData()
      formDataToSend.append("name", formData.name)
      formDataToSend.append("location", formData.location)
      formDataToSend.append("startdate", formData.startdate)
      formDataToSend.append("enddate", formData.enddate)
      formDataToSend.append("time", formData.start_time)
      formDataToSend.append("endtime", formData.end_time)
      formDataToSend.append("deadlinedate", formData.deadlinedate)
      formDataToSend.append("deadlinetime", formData.deadlinetime)
      formDataToSend.append("type", formData.type === "Other" ? customEventType : formData.type)
      formDataToSend.append("capacity", formData.capacity.toString())
      formDataToSend.append("description", formData.description)
      formDataToSend.append("terms_and_conditions", formData.terms_and_conditions)
      formDataToSend.append("duration", formData.duration)
      formDataToSend.append("attendees", JSON.stringify(selectedClientTypes))
      formDataToSend.append("tabs", JSON.stringify(tabs))
      formDataToSend.append("packages", JSON.stringify(packages))
      if (coverImageFile) {
        formDataToSend.append("cover_image", coverImageFile)
      }

      const response = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.details || "Failed to create event")
      }

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        navigate("/organiser-dash")
      }, 2000)
    } catch (error) {
      setErrorMessage(`Failed to create event: ${error.message}`)
      setIsSubmitting(false)
    }
  }

  // Section navigation handlers
  const showEventInfo = () => setCurrentSection("eventInfo")
  const showClientTypes = () => setCurrentSection("clientTypes")
  const showPackagesTabs = () => setCurrentSection("packagesTabs")
  const showTerms = () => setCurrentSection("terms")

  const eventTypeOptions = [
    "Conference",
    "Workshop",
    "Seminar",
    "Exhibition",
    "Concert",
    "Festival",
    "Corporate Event",
    "Sports Event",
    "Other",
  ]

  return (
    <div className="event">
      <div className="event-form-header">
        <button className="back-button" onClick={() => navigate("/organiser-dash")}>
          Back
        </button>
        <div className="section-navigation">
          <button className={`nav-button ${currentSection === "eventInfo" ? "active" : ""}`} onClick={showEventInfo}>
            Event Information
          </button>
          <button
            className={`nav-button ${currentSection === "clientTypes" ? "active" : ""}`}
            onClick={showClientTypes}
          >
            Client Types & Image
          </button>
          <button
            className={`nav-button ${currentSection === "packagesTabs" ? "active" : ""}`}
            onClick={showPackagesTabs}
          >
            Packages & Tabs
          </button>
          <button className={`nav-button ${currentSection === "terms" ? "active" : ""}`} onClick={showTerms}>
            Terms & Conditions
          </button>
        </div>
      </div>

      <div className="section-content">
        {/* Section 1: Event Information */}
        {currentSection === "eventInfo" && (
          <div className="section-wrapper">
            <h2 className="section-title">Event Information</h2>
            <div className="event-info-section">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={`form-input ${errors.name ? "error" : ""}`}
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="ICTAS"
                    required
                  />
                  {errors.name && <div className="error-message">{errors.name}</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="location" className="form-label">
                    Location *
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    className={`form-input ${errors.location ? "error" : ""}`}
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Ballito, Whatever Venue"
                    required
                  />
                  {errors.location && <div className="error-message">{errors.location}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startdate" className="form-label">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="startdate"
                    name="startdate"
                    className={`form-input ${errors.startdate ? "error" : ""}`}
                    value={formData.startdate}
                    onChange={handleDateChange}
                    required
                  />
                  {errors.startdate && <div className="error-message">{errors.startdate}</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="enddate" className="form-label">
                    End Date *
                  </label>
                  <input
                    type="date"
                    id="enddate"
                    name="enddate"
                    className={`form-input ${errors.enddate ? "error" : ""}`}
                    value={formData.enddate}
                    onChange={handleDateChange}
                    min={formData.startdate}
                    required
                  />
                  {errors.enddate && <div className="error-message">{errors.enddate}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_time" className="form-label">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    className={`form-input ${errors.start_time ? "error" : ""}`}
                    value={formData.start_time}
                    onChange={handleDateChange}
                    required
                  />
                  {errors.start_time && <div className="error-message">{errors.start_time}</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="end_time" className="form-label">
                    End Time *
                  </label>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    className={`form-input ${errors.end_time ? "error" : ""}`}
                    value={formData.end_time}
                    onChange={handleDateChange}
                    required
                  />
                  {errors.end_time && <div className="error-message">{errors.end_time}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="deadlinedate" className="form-label">
                    Registration Deadline Date *
                  </label>
                  <input
                    type="date"
                    id="deadlinedate"
                    name="deadlinedate"
                    className={`form-input ${errors.deadlinedate ? "error" : ""}`}
                    value={formData.deadlinedate}
                    onChange={handleDateChange}
                    max={
                      formData.startdate
                        ? new Date(new Date(formData.startdate).setDate(new Date(formData.startdate).getDate() - 1))
                            .toISOString()
                            .split("T")[0]
                        : undefined
                    }
                    required
                  />
                  {errors.deadlinedate && <div className="error-message">{errors.deadlinedate}</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="deadlinetime" className="form-label">
                    Registration Deadline Time *
                  </label>
                  <input
                    type="time"
                    id="deadlinetime"
                    name="deadlinetime"
                    className={`form-input ${errors.deadlinetime ? "error" : ""}`}
                    value={formData.deadlinetime}
                    onChange={handleDateChange}
                    required
                  />
                  {errors.deadlinetime && <div className="error-message">{errors.deadlinetime}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type" className="form-label">
                    Event Type *
                  </label>
                  <div className="select-wrapper">
                    <select
                      id="type"
                      name="type"
                      className={`form-input ${errors.type ? "error" : ""}`}
                      value={formData.type}
                      onChange={handleEventTypeChange}
                      required
                    >
                      <option value="">Select Event Type</option>
                      {eventTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.type === "Other" && (
                    <div className="custom-event-type mt-2">
                      <input
                        type="text"
                        value={customEventType}
                        onChange={handleCustomEventTypeChange}
                        placeholder="Enter custom event type"
                        className={`form-input ${errors.type ? "error" : ""}`}
                        required
                      />
                    </div>
                  )}
                  {errors.type && <div className="error-message">{errors.type}</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="capacity" className="form-label">
                    Max Capacity *
                  </label>
                  <div className="number-input">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          capacity: Math.max(1, prev.capacity - 1),
                        }))
                      }
                      className="number-btn minus"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      id="capacity"
                      name="capacity"
                      className={`form-input ${errors.capacity ? "error" : ""}`}
                      value={formData.capacity}
                      onChange={handleNumberInput}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          capacity: prev.capacity + 1,
                        }))
                      }
                      className="number-btn plus"
                    >
                      +
                    </button>
                  </div>
                  {errors.capacity && <div className="error-message">{errors.capacity}</div>}
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="description" className="form-label">
                  Event Details *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide detailed information about the event"
                  className={`form-textarea ${errors.description ? "error" : ""}`}
                  required
                ></textarea>
                {errors.description && <div className="error-message">{errors.description}</div>}
              </div>
            </div>
            <div className="section-footer">
              <div></div>
              <button className="next-button" onClick={showClientTypes}>
                Next: Client Types & Image
              </button>
            </div>
          </div>
        )}

        {/* Section 2: Client Types & Cover Image */}
        {currentSection === "clientTypes" && (
          <div className="section-wrapper">
            <h2 className="section-title">Client Types & Cover Image</h2>
            <div className="client-upload-grid">
              <div className="client-types-section">
                <div className="client-types">
                  <label>Client Types Available *</label>
                  <div className="client-types-list">
                    {selectedClientTypes.length === 0 ? (
                      <div className="no-client-types">
                        <p>No client types selected yet</p>
                        <p className="hint">Select from dropdown below to add client types</p>
                      </div>
                    ) : (
                      <div className="client-types-grid">
                        {selectedClientTypes.map((type, index) => (
                          <div key={index} className="client-type-badge">
                            <span className="client-type-text">{type}</span>
                            <button
                              type="button"
                              className="remove-btn"
                              onClick={() => handleRemoveClientType(type)}
                              aria-label={`Remove ${type}`}
                              title={`Remove ${type}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="client-type-dropdown">
                    <select value={clientTypeSelection} onChange={handleClientTypeChange} required>
                      <option value="">Select Client Type</option>
                      <option value="Guest">Guest</option>
                      <option value="Attendee">Attendee</option>
                      <option value="Key Speaker">Key Speaker</option>
                      <option value="Other">Other</option>
                    </select>

                    {clientTypeSelection === "Other" && (
                      <div className="custom-client-type">
                        <input
                          type="text"
                          value={customClientType}
                          onChange={(e) => setCustomClientType(e.target.value)}
                          placeholder="Enter custom client type"
                          onKeyPress={(e) => e.key === "Enter" && handleAddCustomClientType()}
                          required
                        />
                        <button
                          className="add-btn"
                          onClick={handleAddCustomClientType}
                          disabled={!customClientType.trim()}
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                  {errors.attendees && <div className="error-message">{errors.attendees}</div>}

                  {selectedClientTypes.length > 0 && (
                    <div className="client-type-actions">
                      <button type="button" className="clear-all-btn" onClick={() => setSelectedClientTypes([])}>
                        Clear All ({selectedClientTypes.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="upload-section">
                <h4>Upload Cover Image *</h4>
                <div className="upload-container">
                  <div className="upload-box">
                    <input
                      type="file"
                      id="cover_image"
                      name="cover_image"
                      onChange={handleCoverImageChange}
                      accept="image/png,image/jpeg"
                      style={{ display: "none" }}
                      required
                    />
                    {coverImageFile ? (
                      <div className="image-preview">
                        <img
                          src={URL.createObjectURL(coverImageFile) || "/placeholder.svg"}
                          alt="Preview"
                          className="preview-image"
                        />
                      </div>
                    ) : (
                      <div className="upload-instructions">
                        <p>Drop image here</p>
                        <p>Supported format: PNG, JPG</p>
                      </div>
                    )}
                  </div>
                  {!coverImageFile ? (
                    <label htmlFor="cover_image" className="browse-button">
                      Select Image
                    </label>
                  ) : (
                    <div className="file-actions">
                      <label htmlFor="cover_image" className="change-image-button">
                        Change Image
                      </label>
                      <button
                        type="button"
                        className="remove-image-button"
                        onClick={() => {
                          setCoverImageFile(null)
                          validateForm()
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {errors.cover_image && <div className="error-message">{errors.cover_image}</div>}
                </div>
              </div>
            </div>
            <div className="section-footer">
              <button className="back-button-nav" onClick={showEventInfo}>
                Back: Event Information
              </button>
              <button className="next-button" onClick={showPackagesTabs}>
                Next: Packages & Tabs
              </button>
            </div>
          </div>
        )}

        {/* Section 3: Packages & Tabs */}
        {currentSection === "packagesTabs" && (
          <div className="section-wrapper">
            <h2 className="section-title">Packages & Tabs</h2>
            <div className="packages-tabs-grid">
              <div className="tabs-section">
                <div className="section-header">
                  <h3>Event Tabs</h3>
                  <button onClick={addTab} className="add-button">
                    Add Tab
                  </button>
                </div>
                <div className="tabs-container">
                  {tabs.map((tab, idx) => (
                    <div key={idx} className="tab-item">
                      <div className="form-group">
                        <label>Tab Name *</label>
                        <input
                          type="text"
                          value={tab.name}
                          onChange={(e) => handleTabChange(idx, "name", e.target.value)}
                          placeholder={`Tab ${idx + 1} name`}
                          required
                        />
                        {errors[`tab_name_${idx}`] && <div className="error-message">{errors[`tab_name_${idx}`]}</div>}
                      </div>
                      <div className="form-group">
                        <label>Tab Content *</label>
                        <textarea
                          value={tab.content}
                          onChange={(e) => handleTabChange(idx, "content", e.target.value)}
                          placeholder={`Tab ${idx + 1} content`}
                          className="tab-textarea"
                          required
                        ></textarea>
                        {errors[`tab_content_${idx}`] && (
                          <div className="error-message">{errors[`tab_content_${idx}`]}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.tabs && <div className="error-message">{errors.tabs}</div>}
              </div>

              <div className="packages-section">
                <div className="section-header">
                  <h3>Event Packages</h3>
                  <button onClick={addPackage} className="add-button">
                    Add Package
                  </button>
                </div>
                <div className="packages-container">
                  {packages.map((pkg, idx) => (
                    <div key={idx} className="package-item">
                      <h4>Package {idx + 1}</h4>
                      <div className="package-grid">
                        <div className="form-group">
                          <label>Select Type *</label>
                          <div className="select-with-add">
                            <select
                              value={pkg.selectType}
                              onChange={(e) => handlePackageChange(idx, "selectType", e.target.value)}
                              required
                            >
                              <option value="">Select</option>
                              {pkg.typeOptions.map((opt, i) => (
                                <option key={i} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                            <button type="button" onClick={() => addDropdownOption(idx)} className="plus-button">
                              +
                            </button>
                          </div>
                          {errors[`package_selectType_${idx}`] && (
                            <div className="error-message">{errors[`package_selectType_${idx}`]}</div>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Package Type *</label>
                          <input
                            type="text"
                            value={pkg.packageType}
                            onChange={(e) => handlePackageChange(idx, "packageType", e.target.value)}
                            required
                          />
                          {errors[`package_type_${idx}`] && (
                            <div className="error-message">{errors[`package_type_${idx}`]}</div>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Location *</label>
                          <input
                            type="text"
                            value={pkg.location}
                            onChange={(e) => handlePackageChange(idx, "location", e.target.value)}
                            required
                          />
                          {errors[`package_location_${idx}`] && (
                            <div className="error-message">{errors[`package_location_${idx}`]}</div>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Duration (hours) *</label>
                          <div className="currency-input">
                            <input
                              type="text"
                              value={pkg.duration}
                              onChange={(e) => handlePackageChange(idx, "duration", e.target.value)}
                              required
                              className={`form-input ${errors[`package_duration_${idx}`] ? "error" : ""}`}
                              placeholder="Enter hours"
                            />
                            <span className="currency-symbol">hours</span>
                          </div>
                          {errors[`package_duration_${idx}`] && (
                            <div className="error-message">{errors[`package_duration_${idx}`]}</div>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Start Date *</label>
                          <input
                            type="date"
                            value={pkg.startDate}
                            onChange={(e) => handlePackageChange(idx, "startDate", e.target.value)}
                            required
                          />
                          {errors[`package_startDate_${idx}`] && (
                            <div className="error-message">{errors[`package_startDate_${idx}`]}</div>
                          )}
                        </div>
                        <div className="form-group">
                          <label>End Date *</label>
                          <input
                            type="date"
                            value={pkg.endDate}
                            onChange={(e) => handlePackageChange(idx, "endDate", e.target.value)}
                            min={pkg.startDate}
                            max={
                              formData.deadlinedate
                                ? new Date(new Date(formData.deadlinedate).setDate(new Date(formData.deadlinedate).getDate() - 1))
                                    .toISOString()
                                    .split("T")[0]
                                : undefined
                            }
                            required
                          />
                          {errors[`package_endDate_${idx}`] && (
                            <div className="error-message">{errors[`package_endDate_${idx}`]}</div>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Pricing (ZAR) *</label>
                          <div className="currency-input">
                            <span className="currency-symbol">R</span>
                            <input
                              type="text"
                              value={pkg.pricing}
                              onChange={(e) => handlePackageChange(idx, "pricing", e.target.value)}
                              placeholder="123.45"
                              required
                              className={`form-input ${errors[`package_pricing_${idx}`] ? "error" : ""}`}
                            />
                          </div>
                          {errors[`package_pricing_${idx}`] && (
                            <div className="error-message">{errors[`package_pricing_${idx}`]}</div>
                          )}
                        </div>
                      </div>
                      <div className="form-group full-width">
                        <label>Package Details *</label>
                        <textarea
                          value={pkg.details}
                          onChange={(e) => handlePackageChange(idx, "details", e.target.value)}
                          className="package-textarea"
                          required
                        ></textarea>
                        {errors[`package_details_${idx}`] && (
                          <div className="error-message">{errors[`package_details_${idx}`]}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.packages && <div className="error-message">{errors.packages}</div>}
              </div>
            </div>
            <div className="section-footer">
              <button className="back-button-nav" onClick={showClientTypes}>
                Back: Client Types & Image
              </button>
              <button className="next-button" onClick={showTerms}>
                Next: Terms & Conditions
              </button>
            </div>
          </div>
        )}

        {/* Section 4: Terms & Conditions */}
        {currentSection === "terms" && (
          <div className="section-wrapper">
            <h2 className="section-title">Terms & Conditions</h2>
            <div className="terms-section">
              <div className="form-group full-width">
                <label htmlFor="terms_and_conditions" className="form-label">
                  Terms and Conditions *
                </label>
                <textarea
                  id="terms_and_conditions"
                  name="terms_and_conditions"
                  value={formData.terms_and_conditions}
                  onChange={handleInputChange}
                  placeholder="Specify terms and conditions for your event..."
                  className={`form-textarea large ${errors.terms_and_conditions ? "error" : ""}`}
                  required
                ></textarea>
                {errors.terms_and_conditions && <div className="error-message">{errors.terms_and_conditions}</div>}
              </div>
            </div>
            <div className="section-footer">
              <button className="back-button-nav" onClick={showPackagesTabs}>
                Back: Packages & Tabs
              </button>
              <button onClick={handleSendRequest} className="submit-button" disabled={isSubmitting || !isFormValid}>
                {isSubmitting ? "Submitting..." : "Request Event"}
              </button>
            </div>
            {showSuccess && <div className="success-message">✅ Successfully sent event request!</div>}
            {errorMessage && <div className="error-message-box">❌ {errorMessage}</div>}
          </div>
        )}
      </div>
    </div>
  );
}