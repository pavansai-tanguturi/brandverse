import React, { useState, useEffect } from 'react';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consentGiven = localStorage.getItem('cookieConsent');
    if (!consentGiven) {
      // Small delay to ensure page is loaded
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setIsVisible(false);
    
    // Reload page to ensure cookies work properly
    window.location.reload();
    
    console.log('✅ Cookies accepted by user');
  };

  const acceptEssential = () => {
    localStorage.setItem('cookieConsent', 'essential');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setIsVisible(false);
    
    console.log('✅ Essential cookies accepted by user');
  };

  const decline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setIsVisible(false);
    
    console.log('❌ Cookies declined by user');
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
      
      {/* Cookie consent banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-blue-500 shadow-2xl">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Cookie icon and main content */}
            <div className="flex items-start gap-4 flex-1">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  🍪 We use cookies to enhance your experience
                </h3>
                
                <p className="text-gray-600 text-sm mb-3">
                  This website uses cookies to ensure you get the best experience on our website. 
                  We use essential cookies for authentication and shopping cart functionality.
                </p>

                {showDetails && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-3 text-sm">
                    <h4 className="font-semibold text-gray-800 mb-2">Cookie Details:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li><strong>Essential Cookies:</strong> Required for login, shopping cart, and basic site functionality</li>
                      <li><strong>Session Cookies:</strong> Keep you logged in during your visit</li>
                      <li><strong>Security Cookies:</strong> Protect against fraud and ensure secure transactions</li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-500">
                      We do not use tracking cookies or share your data with third parties for advertising.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-blue-500 hover:text-blue-700 text-sm underline mb-3"
                >
                  {showDetails ? 'Hide Details' : 'Show Cookie Details'}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
              <button
                onClick={acceptAll}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Accept All
              </button>
              
              <button
                onClick={acceptEssential}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Essential Only
              </button>
              
              <button
                onClick={decline}
                className="px-6 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium rounded-lg transition-colors duration-200"
              >
                Decline
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By continuing to use this site, you agree to our cookie policy. 
              You can change your preferences at any time in your browser settings.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsent;