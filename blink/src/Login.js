// src/Login.js
import React, { useState } from 'react';
import './Login.css';

function Login() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    console.log('Mobile:', mobile);
    console.log('OTP:', otp);
    alert('Login submitted!');
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form className="login-form" onSubmit={handleLogin}>
        {/* Mobile Number */}
        <label>Mobile Number</label>
        <input
          type="tel"
          placeholder="Enter your mobile number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          pattern="[0-9]{10}"
          maxLength="10"
          required
        />

        {/* OTP */}
        <label>OTP</label>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength="6"
          required
        />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
