// src/Signup.js
import React, { useState } from 'react';
import './Signup.css';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignup = (e) => {
    e.preventDefault();

    // Simulate OTP sending
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setOtpSent(true);

    alert(`OTP sent to your email (simulated): ${otp}`);
  };

  const handleOtpVerify = (e) => {
    e.preventDefault();

    if (enteredOtp === generatedOtp) {
      alert('Signup successful!');
      // Here you can add logic to store user or redirect
    } else {
      alert('Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>

      {!otpSent ? (
        <form className="signup-form" onSubmit={handleSignup}>
          <label>Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            required
            value={formData.name}
            onChange={handleChange}
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            value={formData.email}
            onChange={handleChange}
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            required
            value={formData.password}
            onChange={handleChange}
          />

          <button type="submit">Send OTP</button>
        </form>
      ) : (
        <form className="otp-form" onSubmit={handleOtpVerify}>
          <label>Enter OTP</label>
          <input
            type="text"
            placeholder="Enter OTP"
            value={enteredOtp}
            onChange={(e) => setEnteredOtp(e.target.value)}
            required
          />

          <button type="submit">Verify OTP</button>
        </form>
      )}
    </div>
  );
}

export default Signup;
