import React, { useState } from 'react';

const HealthCheck = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch('https://brandverse-46he.vercel.app/health');
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus('Backend is reachable!');
      } else {
        setStatus('Backend responded, but not healthy.');
      }
    } catch (err) {
      setStatus('Network error: Backend not reachable.');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Backend Health Check</h2>
        <button onClick={checkHealth} className="bg-blue-600 text-white py-2 px-4 rounded mb-4" disabled={loading}>
          {loading ? 'Checking...' : 'Check Backend'}
        </button>
        {status && <p className="mt-2 text-lg">{status}</p>}
      </div>
    </div>
  );
};

export default HealthCheck;
