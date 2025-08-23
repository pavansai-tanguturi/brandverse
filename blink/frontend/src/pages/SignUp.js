// Tailwind CSS is now used for styling
// src/pages/SignUp.js
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import '../styles/Signup.css';
function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',

    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [signupComplete, setSignupComplete] = useState(false);
  const [otpStep, setOtpStep] = useState(false);


  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // Request signup with Supabase (send email, password)
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.name } }
      });
      if (error) {
        setError(error.message);
      } else {
        setOtpStep(true);
        setMessage('An OTP has been sent to your email. Please enter the 6-digit code to verify.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: formData.otp,
        type: 'signup'
      });
      if (error) {
        setError(error.message);
      } else {
        setSignupComplete(true);
        setMessage('Your account is verified! You can now log in.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Customer Sign Up</h2>
        {!signupComplete && !otpStep && (
          <form onSubmit={handleSignup} className="space-y-4">
            <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required className="w-full p-2 border rounded" />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="w-full p-2 border rounded" />
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required minLength="6" className="w-full p-2 border rounded" />
            <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required minLength="6" className="w-full p-2 border rounded" />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">{loading ? 'Creating Account...' : 'Sign Up'}</button>
            <div className="text-center mt-4">
              <p>Already have an account? <Link to="/login" className="text-blue-600 underline font-bold ml-2">Login</Link></p>
            </div>
          </form>
        )}
        {otpStep && !signupComplete && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input type="text" name="otp" placeholder="Enter 6-digit OTP" value={formData.otp} onChange={handleChange} required maxLength="6" className="w-full p-2 border rounded text-center tracking-widest" />
            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded">{loading ? 'Verifying...' : 'Verify OTP'}</button>
          </form>
        )}
        {signupComplete && (
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold mb-2">🎉 Account Created!</h3>
            <p>Your account has been successfully created.</p>
            <p>Please check your email for a verification link before logging in.</p>
            <Link to="/login" className="inline-block mt-6 px-6 py-2 bg-blue-600 text-white rounded">Go to Login</Link>
            <button onClick={() => { setSignupComplete(false); setFormData({ name: '', email: '', password: '', confirmPassword: '' }); setMessage(''); setError(''); }} className="mt-4 px-4 py-2 border rounded text-gray-700">Create Another Account</button>
          </div>
        )}
        {message && <div className="text-green-500 mt-2">{message}</div>}
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    </div>
  );
}

export default SignUp;
