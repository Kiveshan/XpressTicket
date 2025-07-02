import React, { useState, useEffect } from 'react';
import './InformationForm.css';
import { useNavigate } from 'react-router-dom';

const InformationForm = () => {
  const nav = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    institutionLocation: '',
    facultyId: '',
    departmentId: '',
    ieeeNum: '',
    organVAT: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    institutionLocation: '',
    facultyId: '',
    departmentId: '',
    ieeeNum: '',
    organVAT: '',
    password: '',
    server: '',
  });

  // Validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const numberRegex = /^\d*$/;

  // Pre-fill email and password from sessionStorage on component load
  useEffect(() => {
    const email = sessionStorage.getItem("reg_email") || "";
    const password = sessionStorage.getItem("reg_password") || "";
    setFormData(prev => ({
      ...prev,
      email,
      password,
    }));
  }, []);

  // Fetch faculties on mount
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/faculties');
        if (!res.ok) throw new Error(`Failed to fetch faculties: ${res.status}`);
        const data = await res.json();
        setFaculties(Array.isArray(data) ? data : []);
        console.log('Faculties fetched:', data);
      } catch (err) {
        console.error('Error fetching faculties:', err);
        setErrors(prev => ({ ...prev, server: 'Failed to load faculties. Please try again later.' }));
      }
    };
    fetchFaculties();
  }, []);

  // Fetch departments when faculty changes
  useEffect(() => {
    if (!formData.facultyId) {
      setDepartments([]);
      return;
    }
    const fetchDepartments = async () => {
      try {
        console.log('Fetching departments for faculty ID:', formData.facultyId);
        const res = await fetch(`http://localhost:5000/api/departments?facultyId=${formData.facultyId}`);
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Failed to fetch departments:', res.status, errorText);
          throw new Error(`Failed to fetch departments: ${res.status} ${errorText}`);
        }
        const data = await res.json();
        console.log('Departments API response:', data);
        if (data.length === 0) {
          setErrors(prev => ({ ...prev, server: `No departments found for faculty ID ${formData.facultyId}.` }));
        }
        setDepartments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching departments:', err);
        setErrors(prev => ({ ...prev, server: err.message || 'Failed to load departments. Please try again later.' }));
      }
    };
    fetchDepartments();
  }, [formData.facultyId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['phoneNumber', 'ieeeNum', 'organVAT'].includes(name)) {
      if (value === '' || numberRegex.test(value)) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          ...(name === 'facultyId' ? { departmentId: '' } : {}),
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'email' ? value.toLowerCase() : value,
        ...(name === 'facultyId' ? { departmentId: '' } : {}),
      }));
    }
    setErrors(prev => ({ ...prev, [name]: '', server: '' }));
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      phoneNumber: '',
      institutionLocation: '',
      facultyId: '',
      departmentId: '',
      ieeeNum: '',
      organVAT: '',
      password: '',
      server: '',
    };

    if (!formData.name) newErrors.name = "Full name is required.";
    if (!formData.email || !emailRegex.test(formData.email)) newErrors.email = "Valid email required (e.g., example@domain.com).";
    if (!formData.password) newErrors.password = "Password is required.";
    if (!formData.phoneNumber) newErrors.phoneNumber = "Phone number is required.";
    if (!numberRegex.test(formData.phoneNumber) || formData.phoneNumber.length !== 10) newErrors.phoneNumber = "Must be 10 digits.";
    if (!formData.ieeeNum) newErrors.ieeeNum = "IEEE Number is required.";
    if (!numberRegex.test(formData.ieeeNum) || formData.ieeeNum.length !== 8) newErrors.ieeeNum = "Must be 8 digits.";
    if (!formData.organVAT) newErrors.organVAT = "Organ VAT is required.";
    if (!numberRegex.test(formData.organVAT) || formData.organVAT.length !== 9) newErrors.organVAT = "Must be 9 digits.";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Submit button clicked");
    setIsSubmitting(true);
    setErrors(prev => ({ ...prev, server: '' }));

    const validationErrors = validateForm();
    if (Object.values(validationErrors).some(error => error !== '')) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    const userData = {
      name: formData.name,
      email: formData.email.toLowerCase(),
      password: formData.password,
      phone: formData.phoneNumber,
      institution: formData.institutionLocation,
      faculty_id: formData.facultyId,
      department_id: formData.departmentId,
      ieee_number: formData.ieeeNum,
      vat_number: formData.organVAT,
    };

    try {
      console.log('Sending registration data:', JSON.stringify(userData, null, 2));
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', [...res.headers.entries()]);

      const data = await res.json();
      console.log('Registration response:', JSON.stringify(data, null, 2));

      if (!res.ok) {
        throw new Error(data.message || 'Error registering user');
      }

      sessionStorage.removeItem("reg_email");
      sessionStorage.removeItem("reg_password");
      nav('/', { state: { registrationSuccess: true } });
    } catch (err) {
      console.error('Registration error:', err);
      setErrors(prev => ({ ...prev, server: err.message || 'Registration failed. Please try again later.' }));
      setIsSubmitting(false);
    }
  };

  const isSubmitButtonDisabled = isSubmitting;

  return (
    <>
      <div className="back-header" onClick={() => nav("/")}>Back</div>
      <div className="form-container">
        {errors.server && (
          <div style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>
            {errors.server}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Full name</h2>
            <div className="input-group">
              <input
                type="text"
                name="name"
                placeholder="Name here"
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
          </div>

          <div className="form-section">
            <h2>Email</h2>
            <div className="input-group">
              <input
                className="inputselect"
                type="email"
                name="email"
                placeholder="example.email@domain.com"
                value={formData.email}
                onChange={handleChange}
                readOnly
                disabled={isSubmitting}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
              <input
                className="inputselect"
                type="text"
                name="phoneNumber"
                placeholder="Enter 10-digit Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={isSubmitting}
                maxLength={10}
              />
              {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
            </div>
          </div>

          <div className="form-section">
            <h2>Institution Name</h2>
            <div className="input-group">
              <input
                className="inputselect"
                type="text"
                name="institutionLocation"
                placeholder="Institution Location"
                value={formData.institutionLocation}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.institutionLocation && <span className="error-message">{errors.institutionLocation}</span>}
              <select
                className="inputselect"
                name="facultyId"
                value={formData.facultyId}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="">Select Faculty</option>
                {Array.isArray(faculties) && faculties.length > 0 ? (
                  faculties.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))
                ) : (
                  <option value="">No faculties available</option>
                )}
              </select>
              {errors.facultyId && <span className="error-message">{errors.facultyId}</span>}
              <select
                className="inputselect"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                disabled={isSubmitting || !formData.facultyId}
              >
                <option value="">Select Department</option>
                {Array.isArray(departments) && departments.length > 0 ? (
                  departments.map(dept => (
                    <option key={dept.value} value={dept.value}>{dept.label}</option>
                  ))
                ) : (
                  <option value="">{formData.facultyId ? 'No departments available' : 'Select a faculty first'}</option>
                )}
              </select>
              {errors.departmentId && <span className="error-message">{errors.departmentId}</span>}
            </div>
          </div>

          <div className="form-section">
            <h2>IEEE Number</h2>
            <div className="input-group">
              <input
                className="inputselect"
                type="text"
                name="ieeeNum"
                placeholder="Enter 8-digit IEEE Number"
                value={formData.ieeeNum}
                onChange={handleChange}
                disabled={isSubmitting}
                maxLength={8}
              />
              {errors.ieeeNum && <span className="error-message">{errors.ieeeNum}</span>}
            </div>
            <h2>Organ VAT</h2>
            <div className="input-group">
              <input
                className="inputselect"
                type="text"
                name="organVAT"
                placeholder="Enter 9-digit Organ VAT"
                value={formData.organVAT}
                onChange={handleChange}
                disabled={isSubmitting}
                maxLength={9}
              />
              {errors.organVAT && <span className="error-message">{errors.organVAT}</span>}
            </div>
          </div>

          <div className="form-section">
            <h2>Password</h2>
            <div className="input-group">
              <input
                className="inputselect"
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                readOnly
                disabled={isSubmitting}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>
          </div>

          <div className="submit-container">
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitButtonDisabled}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default InformationForm;