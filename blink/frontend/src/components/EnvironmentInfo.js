// Debug component to show environment info
import React from 'react';

const EnvironmentInfo = () => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      background: 'black', 
      color: 'white', 
      padding: '10px', 
      fontSize: '12px',
      zIndex: 9999 
    }}>
      <div>NODE_ENV: {process.env.NODE_ENV}</div>
      <div>REACT_APP_API_URL: {process.env.REACT_APP_API_URL}</div>
      <div>REACT_APP_API_BASE: {process.env.REACT_APP_API_BASE}</div>
    </div>
  );
};

export default EnvironmentInfo;
