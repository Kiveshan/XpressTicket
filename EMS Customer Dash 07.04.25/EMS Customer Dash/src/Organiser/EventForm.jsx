"use client";

import { useState, useEffect } from "react";
import "./EventForm.css";
import { useNavigate } from "react-router-dom";

export default function EventForm() {
  const nav = useNavigate();

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper function to get current time in HH:MM format
  const getCurrentTimeString = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Compute duration in hours between start and end date/time
  const computeDuration = (startDate, endDate, startTime, endTime) => {
    try {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";
      const diffMs = end - start;
      if (diffMs < 0) return "";
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error("Error computing duration:", error);
      return "";
    }
  };

  const [formData, setFormData] = useState(() => {
    const today = getTodayDateString();
    const now = getCurrentTimeString();
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
    };
  });

  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [selectedClientTypes, setSelectedClientTypes] = useState([]);
  const [clientTypeSelection, setClientTypeSelection] = useState("");
  const [customClientType, setCustomClientType] = useState("");
  const [packages, setPackages] = useState([
    {
      selectType: "Full Package",
      packageType: "",
      location: "",
      duration: "",
      dateChoices: "",
      pricing: "",
      details: "",
      typeOptions: ["Full Package", "Day"],
    },
  ]);
  const [tabs, setTabs] = useState([{ name: "", content: "" }]);
  const [paymentType, setPaymentType] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [sponsor, setSponsor] = useState({
    name: "",
    phone: "",
    email: "",
    amount: "",
  });
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [proofOfPaymentFile, setProofOfPaymentFile] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [proofOfPaymentUrl, setProofOfPaymentUrl] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect for computing duration
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      duration: computeDuration(prev.startdate, prev.enddate, prev.start_time, prev.end_time),
    }));
  }, [formData.startdate, formData.enddate, formData.start_time, formData.end_time]);

  // Effect for form validation
  useEffect(() => {
    validateForm();
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
    paymentType,
    paymentAmount,
    sponsor,
    coverImageFile,
    proofOfPaymentFile,
  ]);

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
    if (!formData.capacity || formData.capacity <= 0) newErrors.capacity = "Capacity must be greater than 0";
    if (!formData.description.trim()) newErrors.description = "Event details are required";
    if (!formData.terms_and_conditions.trim()) newErrors.terms_and_conditions = "Terms and conditions are required";
    if (!formData.duration) newErrors.duration = "Duration cannot be computed (check dates/times)";

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

    if (formData.deadlinedate && formData.deadlinetime && formData.startdate && formData.start_time) {
      try {
        const deadline = createDate(formData.deadlinedate, formData.deadlinetime);
        const start = createDate(formData.startdate, formData.start_time);
        if (isNaN(deadline.getTime()) || isNaN(start.getTime())) {
          newErrors.deadlinedate = "Invalid deadline format";
        } else if (deadline >= start) {
          newErrors.deadlinedate = "Deadline must be before event start";
        }
      } catch (error) {
        newErrors.deadlinedate = "Error parsing deadline";
      }
    }

    if (selectedClientTypes.length === 0) newErrors.attendees = "At least one client type is required";

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
        if (!pkg.duration.trim()) newErrors[`package_duration_${idx}`] = `Package ${idx + 1} duration is required`;
        if (!pkg.dateChoices.trim()) newErrors[`package_dateChoices_${idx}`] = `Package ${idx + 1} date choices are required`;
        if (!pkg.pricing.trim()) newErrors[`package_pricing_${idx}`] = `Package ${idx + 1} pricing is required`;
        if (!pkg.details.trim()) newErrors[`package_details_${idx}`] = `Package ${idx + 1} details are required`;
      });
    }

    if (!paymentType) newErrors.payment_type = "Payment type is required";
    if (!paymentAmount && paymentType !== "Sponsor") newErrors.payment_amount = "Payment amount is required";
    if (paymentType === "Sponsor") {
      if (!sponsor.name.trim()) newErrors.sponsor_name = "Sponsor name is required";
      if (!sponsor.phone.trim()) newErrors.sponsor_phone = "Sponsor phone number is required";
      if (!sponsor.email.trim()) newErrors.sponsor_email = "Sponsor email is required";
      if (!sponsor.amount.trim()) newErrors.sponsor_amount = "Sponsor amount is required";
    }

    if (!coverImageFile || !(coverImageFile instanceof File) || !["image/png", "image/jpeg"].includes(coverImageFile.type)) {
      newErrors.cover_image = "A valid PNG or JPEG cover image is required";
    }
    if (paymentType !== "Sponsor" && (!proofOfPaymentFile || !(proofOfPaymentFile instanceof File))) {
      newErrors.proof_of_payment = "Proof of payment is required for non-Sponsor payment types";
    }
    if (paymentType !== "Sponsor" && proofOfPaymentFile && !["image/png", "image/jpeg", "application/pdf"].includes(proofOfPaymentFile.type)) {
      newErrors.proof_of_payment = "Proof of payment must be PNG, JPEG, or PDF";
    }

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "startdate" && prev.enddate < value) {
        updated.enddate = value;
      }
      if (name === "start_time" && prev.deadlinetime) {
        updated.deadlinetime = value;
      }
      return updated;
    });
  };

  const handleNumberInput = (e) => {
    const { name, value } = e.target;
    if (value === "" || /^\d+$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 1 : Number.parseInt(value, 10),
      }));
    }
  };

  const handleClientTypeChange = (e) => {
    const value = e.target.value;
    setClientTypeSelection(value);
    if (value !== "Other" && value && !selectedClientTypes.includes(value)) {
      setSelectedClientTypes([...selectedClientTypes, value]);
      setClientTypeSelection("");
    }
  };

  const handleAddCustomClientType = () => {
    if (customClientType.trim() && !selectedClientTypes.includes(customClientType)) {
      setSelectedClientTypes([...selectedClientTypes, customClientType]);
      setCustomClientType("");
      setClientTypeSelection("");
    } else if (selectedClientTypes.includes(customClientType)) {
      alert("This client type already exists.");
    }
  };

  const handleRemoveClientType = (typeToRemove) => {
    setSelectedClientTypes(selectedClientTypes.filter((type) => type !== typeToRemove));
  };

  const addPackage = () => {
    setPackages([
      ...packages,
      {
        selectType: "Full Package",
        packageType: "",
        location: "",
        duration: "",
        dateChoices: "",
        pricing: "",
        details: "",
        typeOptions: ["Full Package", "Day"],
      },
    ]);
  };

  const handlePackageChange = (index, field, value) => {
    const updated = [...packages];
    updated[index][field] = value;
    setPackages(updated);
  };

  const addTab = () => {
    setTabs([...tabs, { name: "", content: "" }]);
  };

  const handleTabChange = (index, field, value) => {
    const updated = [...tabs];
    updated[index][field] = value;
    setTabs(updated);
  };

  const addDropdownOption = (index) => {
    const newOption = prompt("Enter new option:");
    if (newOption) {
      const updated = [...packages];
      updated[index].typeOptions.push(newOption);
      setPackages(updated);
    }
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file instanceof File && ["image/png", "image/jpeg"].includes(file.type) && file.size > 0) {
      console.log("Cover image selected:", {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
      });
      setCoverImageFile(file);
      alert(`Cover image selected: ${file.name}`);
    } else {
      console.error("Invalid cover image:", file ? { type: file.type, size: file.size } : "No file selected");
      alert("Please select a valid PNG or JPEG file for cover image.");
      setCoverImageFile(null); // Clear invalid file
    }
  };

  const handleProofOfPaymentChange = (e) => {
    const file = e.target.files[0];
    if (file && file instanceof File && ["image/png", "image/jpeg", "application/pdf"].includes(file.type) && file.size > 0) {
      console.log("Proof of payment selected:", {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
      });
      setProofOfPaymentFile(file);
      alert(`Proof of payment selected: ${file.name}`);
    } else {
      console.error("Invalid proof of payment:", file ? { type: file.type, size: file.size } : "No file selected");
      alert("Please select a valid PNG, JPEG, or PDF file for proof of payment.");
      setProofOfPaymentFile(null); // Clear invalid file
    }
  };

  const handleSponsorChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      if (value === "" || /^\d*$/.test(value)) {
        setSponsor({ ...sponsor, [name]: value });
      }
    } else {
      setSponsor({ ...sponsor, [name]: value });
    }
  };

  const handleSendRequest = async () => {
    setErrorMessage("");
    setShowSuccess(false);
    setIsSubmitting(true);

    if (!isFormValid) {
      console.error("Form validation failed:", errors);
      alert("Please fill in all required fields correctly.");
      setIsSubmitting(false);
      return;
    }

    const userId = sessionStorage.getItem("userId");
    const token = sessionStorage.getItem("token");
    if (!userId || !token) {
      console.error("🚨 No userId or token found in sessionStorage. Redirecting to login.");
      alert("User not authenticated. Please log in.");
      nav("/");
      setIsSubmitting(false);
      return;
    }

    if (!coverImageFile || !(coverImageFile instanceof File)) {
      console.error("No valid cover image file selected");
      alert("A valid cover image is required.");
      setErrors((prev) => ({ ...prev, cover_image: "A valid PNG or JPEG cover image is required" }));
      setIsSubmitting(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("terms_and_conditions", formData.terms_and_conditions);
    formDataToSend.append("location", formData.location);
    formDataToSend.append("startdate", formData.startdate);
    formDataToSend.append("enddate", formData.enddate);
    formDataToSend.append("time", formData.start_time);
    formDataToSend.append("endtime", formData.end_time);
    formDataToSend.append("deadlinedate", formData.deadlinedate);
    formDataToSend.append("deadlinetime", formData.deadlinetime);
    formDataToSend.append("type", formData.type);
    formDataToSend.append("capacity", formData.capacity.toString());
    formDataToSend.append("duration", formData.duration);
    formDataToSend.append("attendees", JSON.stringify(selectedClientTypes));
    formDataToSend.append("tabs", JSON.stringify(tabs));
    formDataToSend.append("packages", JSON.stringify(packages));
    formDataToSend.append("sponsorData", JSON.stringify(sponsor));
    formDataToSend.append("payment_type", paymentType);
    formDataToSend.append("amount", paymentType === "Sponsor" ? sponsor.amount : paymentAmount);

    if (paymentType === "Sponsor") {
      if (!sponsor.phone || !sponsor.email) {
        console.error("Missing sponsor fields:", { phone: sponsor.phone, email: sponsor.email });
        alert("Sponsor phone and email are required for Sponsor payment type.");
        setIsSubmitting(false);
        return;
      }
      formDataToSend.append("contactnum", sponsor.phone);
      formDataToSend.append("email", sponsor.email);
    }

    formDataToSend.append("cover_image", coverImageFile);
    console.log("Appending cover_image:", {
      name: coverImageFile.name,
      type: coverImageFile.type,
      size: coverImageFile.size,
    });

    if (paymentType !== "Sponsor") {
      if (!proofOfPaymentFile || !(proofOfPaymentFile instanceof File)) {
        console.error("No valid proof of payment file selected for non-Sponsor payment");
        alert("Proof of payment is required for non-Sponsor payment types.");
        setErrors((prev) => ({ ...prev, proof_of_payment: "Proof of payment is required for non-Sponsor payment types" }));
        setIsSubmitting(false);
        return;
      }
      formDataToSend.append("proof_of_payment", proofOfPaymentFile);
      console.log("Appending proof_of_payment:", {
        name: proofOfPaymentFile.name,
        type: proofOfPaymentFile.type,
        size: proofOfPaymentFile.size,
      });
    }

    console.log("FormData contents:");
    for (const pair of formDataToSend.entries()) {
      console.log(`${pair[0]}:`, pair[1] instanceof File ? `${pair[1].name} (${pair[1].type}, ${pair[1].size} bytes)` : pair[1]);
    }

    try {
      const response = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      console.log("📡 Response status:", response.status, response.statusText);
      const responseData = await response.json();
      console.log("Server response:", responseData);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error("Unauthorized or session expired");
          alert("Session expired or unauthorized. Please log in again.");
          sessionStorage.removeItem("userId");
          sessionStorage.removeItem("token");
          nav("/");
          setIsSubmitting(false);
          return;
        }
        throw new Error(responseData.details || responseData.error || "Failed to create event");
      }

      console.log("✅ Event created successfully:", responseData);
      setCoverImageUrl(responseData.coverImageUrl || "/default-profile-picture.jpg");
      setProofOfPaymentUrl(responseData.proofOfPaymentUrl || "");
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        nav("/organiser-dash");
      }, 3000);
    } catch (error) {
      console.error("🚨 Error submitting form data:", error);
      alert(`Failed to create event: ${error.message}`);
      setErrorMessage(`Something went wrong: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="event-form">
      <button className="back-button" onClick={() => nav("/organiser-dash")}>
        Back
      </button>
      <div className="grid-two">
        <div className="event-info">
          <div className="form-grid">
            <div className="left-column">
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
                {errors.name && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    {errors.name}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="startdate" className="form-label">
                  Starting Date *
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
                {errors.startdate && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    {errors.startdate}
                  </div>
                )}
              </div>
              <div className="time-column">
                <div className="time-group">
                  <div className="form-group time-input">
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
                    {errors.start_time && (
                      <div className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        {errors.start_time}
                      </div>
                    )}
                  </div>
                  <div className="form-group time-input">
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
                    {errors.end_time && (
                      <div className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        {errors.end_time}
                      </div>
                    )}
                  </div>
                  <div className="form-group time-input">
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
                      max={formData.startdate}
                      required
                    />
                    {errors.deadlinedate && (
                      <div className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        {errors.deadlinedate}
                      </div>
                    )}
                  </div>
                  <div className="form-group time-input">
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
                    {errors.deadlinetime && (
                      <div className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        {errors.deadlinetime}
                      </div>
                    )}
                  </div>
                </div>
                <div className="time-group">
                  <div className="form-group time-input">
                    <label htmlFor="type" className="form-label">
                      Event Type *
                    </label>
                    <input
                      type="text"
                      id="type"
                      name="type"
                      className={`form-input ${errors.type ? "error" : ""}`}
                      value={formData.type}
                      onChange={handleInputChange}
                      placeholder="Conference"
                      required
                    />
                    {errors.type && (
                      <div className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        {errors.type}
                      </div>
                    )}
                  </div>
                  <div className="form-group time-input">
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
                    {errors.capacity && (
                      <div className="error-message">{errors.capacity}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="right-column">
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
                {errors.location && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    {errors.location}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="enddate" className="form-label">
                  Ending Date *
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
                {errors.enddate && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    {errors.enddate}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="event-details-container">
            <label htmlFor="description" className="form-label">
              Event Details *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide detailed information about the event"
              className={`form-input ${errors.description ? "error" : ""}`}
              required
            ></textarea>
            {errors.description && (
              <div className="error-message">{errors.description}</div>
            )}
          </div>
          <div className="event-details-container">
            <label htmlFor="terms_and_conditions" className="form-label">
              Terms and Conditions *
            </label>
            <textarea
              id="terms_and_conditions"
              name="terms_and_conditions"
              value={formData.terms_and_conditions}
              onChange={handleInputChange}
              placeholder="Specify terms and conditions"
              className={`form-input ${errors.terms_and_conditions ? "error" : ""}`}
              required
            ></textarea>
            {errors.terms_and_conditions && (
              <div className="error-message">{errors.terms_and_conditions}</div>
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
                    src={URL.createObjectURL(coverImageFile)}
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
                    setCoverImageFile(null);
                    validateForm(); // Re-validate to update errors
                  }}
                >
                  Remove
                </button>
              </div>
            )}
            {errors.cover_image && (
              <div className="error-message">{errors.cover_image}</div>
            )}
          </div>
          <div className="client-types">
            <label>Client Types Available *</label>
            <div className="client-types-list">
              {selectedClientTypes.map((type, index) => (
                <div key={index} className="client-type-item">
                  <span>{type}</span>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => handleRemoveClientType(type)}
                    aria-label={`Remove ${type}`}
                  >
                    ×
                  </button>
                </div>
              ))}
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
            {errors.attendees && (
              <div className="error-message">{errors.attendees}</div>
            )}
          </div>
        </div>
      </div>
      <button onClick={addTab}>Add a Tab *</button>
      {tabs.map((tab, idx) => (
        <div key={idx} className="form-item">
          <div className="form-grid">
            <div>
              <label>Tab Name *</label>
              <input
                type="text"
                value={tab.name}
                onChange={(e) => handleTabChange(idx, "name", e.target.value)}
                required
              />
              {errors[`tab_name_${idx}`] && (
                <div className="error-message">{errors[`tab_name_${idx}`]}</div>
              )}
            </div>
          </div>
          <label>Tab Content *</label>
          <textarea
            value={tab.content}
            onChange={(e) => handleTabChange(idx, "content", e.target.value)}
            required
          ></textarea>
          {errors[`tab_content_${idx}`] && (
            <div className="error-message">{errors[`tab_content_${idx}`]}</div>
          )}
        </div>
      ))}
      {errors.tabs && <div className="error-message">{errors.tabs}</div>}
      <button onClick={addPackage}>Add a Package *</button>
      {packages.map((pkg, idx) => (
        <div key={idx} className="form-item">
          <div className="form-grid">
            <div>
              <label>Select Type *</label>
              <select
                value={pkg.selectType}
                onChange={(e) => handlePackageChange(idx, "selectType", e.target.value)}
                required
              >
                <option value="">Select</option>
                {pkg.typeOptions.map((opt, i) => (
                  <option key={i}>{opt}</option>
                ))}
              </select>
              <button onClick={() => addDropdownOption(idx)} className="plus-button">
                +
              </button>
              {errors[`package_selectType_${idx}`] && (
                <div className="error-message">{errors[`package_selectType_${idx}`]}</div>
              )}
            </div>
            <div>
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
            <div>
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
            <div>
              <label>Duration *</label>
              <input
                type="text"
                value={pkg.duration}
                onChange={(e) => handlePackageChange(idx, "duration", e.target.value)}
                required
              />
              {errors[`package_duration_${idx}`] && (
                <div className="error-message">{errors[`package_duration_${idx}`]}</div>
              )}
            </div>
            <div>
              <label>Date Choices *</label>
              <input
                type="text"
                value={pkg.dateChoices}
                onChange={(e) => handlePackageChange(idx, "dateChoices", e.target.value)}
                required
              />
              {errors[`package_dateChoices_${idx}`] && (
                <div className="error-message">{errors[`package_dateChoices_${idx}`]}</div>
              )}
            </div>
            <div>
              <label>Pricing *</label>
              <input
                type="text"
                value={pkg.pricing}
                onChange={(e) => handlePackageChange(idx, "pricing", e.target.value)}
                required
              />
              {errors[`package_pricing_${idx}`] && (
                <div className="error-message">{errors[`package_pricing_${idx}`]}</div>
              )}
            </div>
          </div>
          <label>Package Details *</label>
          <textarea
            value={pkg.details}
            onChange={(e) => handlePackageChange(idx, "details", e.target.value)}
            required
          ></textarea>
          {errors[`package_details_${idx}`] && (
            <div className="error-message">{errors[`package_details_${idx}`]}</div>
          )}
        </div>
      ))}
      {errors.packages && <div className="error-message">{errors.packages}</div>}
      <div className="form-grid">
        <div>
          <label>Payment Type *</label>
          <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} required>
            <option value="">Select</option>
            <option value="Direct">Direct</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Credit">Credit</option>
            <option value="Sponsor">Sponsor</option>
          </select>
          {errors.payment_type && (
            <div className="error-message">{errors.payment_type}</div>
          )}
        </div>
        <table className="payment-table">
          <thead>
            <tr>
              {paymentType === "Sponsor" ? (
                <>
                  <th>Sponsor Name *</th>
                  <th>Cellphone Number *</th>
                  <th>Email *</th>
                  <th>Amount *</th>
                </>
              ) : (
                <>
                  <th>Amount *</th>
                  <th>Proof of Payment *</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            <tr>
              {paymentType === "Sponsor" ? (
                <>
                  <td>
                    <input
                      type="text"
                      name="name"
                      value={sponsor.name}
                      onChange={handleSponsorChange}
                      placeholder="Sponsor Name"
                      required
                    />
                    {errors.sponsor_name && (
                      <div className="error-message">{errors.sponsor_name}</div>
                    )}
                  </td>
                  <td>
                    <input
                      className="cellno"
                      type="text"
                      name="phone"
                      value={sponsor.phone}
                      onChange={handleSponsorChange}
                      placeholder="Cellphone Number"
                      required
                    />
                    {errors.sponsor_phone && (
                      <div className="error-message">{errors.sponsor_phone}</div>
                    )}
                  </td>
                  <td>
                    <input
                      type="email"
                      name="email"
                      value={sponsor.email}
                      onChange={handleSponsorChange}
                      placeholder="Email"
                      required
                    />
                    {errors.sponsor_email && (
                      <div className="error-message">{errors.sponsor_email}</div>
                    )}
                  </td>
                  <td>
                    <input
                      type="text"
                      name="amount"
                      value={sponsor.amount}
                      onChange={handleSponsorChange}
                      placeholder="Amount"
                      required
                    />
                    {errors.sponsor_amount && (
                      <div className="error-message">{errors.sponsor_amount}</div>
                    )}
                  </td>
                </>
              ) : (
                <>
                  <td>
                    <input
                      type="text"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount (e.g., 7000000.00)"
                      required
                    />
                    {errors.payment_amount && (
                      <div className="error-message">{errors.payment_amount}</div>
                    )}
                  </td>
                  <td className="upload-cell">
                    <input
                      type="file"
                      id="proof_of_payment"
                      name="proof_of_payment"
                      onChange={handleProofOfPaymentChange}
                      accept="image/png,image/jpeg,application/pdf"
                      style={{ display: "none" }}
                      required={paymentType !== "Sponsor"}
                    />
                    <label htmlFor="proof_of_payment" className="upload-button">
                      Upload
                    </label>
                    {proofOfPaymentFile && <span className="file-name">{proofOfPaymentFile.name}</span>}
                    {errors.proof_of_payment && (
                      <div className="error-message">{errors.proof_of_payment}</div>
                    )}
                  </td>
                </>
              )}
            </tr>
          </tbody>
        </table>
        {proofOfPaymentUrl && (
          <div className="uploaded-preview">
            <p>Proof of Payment Uploaded:</p>
            <a href={proofOfPaymentUrl} target="_blank" rel="noopener noreferrer">
              View File
            </a>
          </div>
        )}
      </div>
      <div className="p-4">
        <button
          onClick={handleSendRequest}
          className="request-button"
          disabled={isSubmitting || !isFormValid}
        >
          {isSubmitting ? "Submitting..." : "Request Event"}
        </button>
        {showSuccess && (
          <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ Successfully sent event request!
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            ❌ {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}