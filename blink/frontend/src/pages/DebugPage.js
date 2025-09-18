// Test component to debug common issues
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';

const DebugPage = () => {
  const { user, loading } = useAuth();
  const [apiTest, setApiTest] = useState({ loading: true, result: null, error: null });
  const [sessionTest, setSessionTest] = useState({ loading: true, result: null, error: null });

  useEffect(() => {
    // Test API connectivity
    const testAPI = async () => {
      try {
        const result = await apiCall('/api/categories');
        setApiTest({ loading: false, result: `✅ API Working - ${result.length} categories found`, error: null });
      } catch (error) {
        setApiTest({ loading: false, result: null, error: `❌ API Error: ${error.message}` });
      }
    };

    // Test session endpoint with additional debugging
    const testSession = async () => {
      try {
        console.log('[DebugPage] Testing session...');
        
        // First test the session-test endpoint
        const testResult = await apiCall('/api/auth/session-test');
        console.log('[DebugPage] Session test result:', testResult);
        
        // Then test the regular user endpoint
        const userResult = await apiCall('/api/auth/user');
        console.log('[DebugPage] User endpoint result:', userResult);
        
        if (userResult.user) {
          setSessionTest({ 
            loading: false, 
            result: `✅ Session Working - User: ${userResult.user.email}`, 
            error: null 
          });
        } else {
          setSessionTest({ 
            loading: false, 
            result: `⚠️ Session Valid but No User. Session test data: ${JSON.stringify(testResult.data)}`, 
            error: null 
          });
        }
      } catch (error) {
        setSessionTest({ loading: false, result: null, error: `❌ Session Error: ${error.message}` });
      }
    };

    testAPI();
    testSession();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔧 Debug Dashboard</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>AuthContext Status</h2>
        <p><strong>Loading:</strong> {loading ? '🔄 Loading...' : '✅ Loaded'}</p>
        <p><strong>User:</strong> {user ? `✅ ${user.email} (ID: ${user.id})` : '❌ No User'}</p>
        <p><strong>Admin:</strong> {user?.isAdmin ? '✅ Admin User' : '❌ Regular User'}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>API Connectivity Test</h2>
        <p><strong>Status:</strong> {apiTest.loading ? '🔄 Testing...' : (apiTest.result || apiTest.error)}</p>
        <p><strong>Base URL:</strong> {import.meta.env.VITE_API_BASE || 'http://localhost:3001'}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Session Test</h2>
        <p><strong>Status:</strong> {sessionTest.loading ? '🔄 Testing...' : (sessionTest.result || sessionTest.error)}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Environment Info</h2>
        <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV || 'development'}</p>
        <p><strong>API Base:</strong> {import.meta.env.VITE_API_BASE || 'Not Set'}</p>
        <p><strong>User Agent:</strong> {navigator.userAgent}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Local Storage</h2>
        <p><strong>User Data:</strong> {localStorage.getItem('user') ? '✅ Present' : '❌ Missing'}</p>
        <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
          {localStorage.getItem('user') || 'No user data in localStorage'}
        </pre>
      </div>
    </div>
  );
};

export default DebugPage;