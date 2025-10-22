import React, { useState, useEffect } from "react";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consentGiven = localStorage.getItem("cookieConsent");
    if (!consentGiven) {
      // Small delay to ensure page is loaded
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem("cookieConsent", "accepted");
    localStorage.setItem("cookieConsentDate", new Date().toISOString());
    setIsVisible(false);

    // Reload page to ensure cookies work properly
    window.location.reload();
  };

  const acceptEssential = () => {
    localStorage.setItem("cookieConsent", "essential");
    localStorage.setItem("cookieConsentDate", new Date().toISOString());
    setIsVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookieConsent", "declined");
    localStorage.setItem("cookieConsentDate", new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop overlay - Glass morphism effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-900/30 via-gray-900/40 to-emerald-800/30 z-40 backdrop-blur-md backdrop-saturate-150"></div>

      {/* Cookie consent banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Cookie icon and main content */}
            <div className="flex items-start gap-3 sm:gap-4 flex-1">
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21.598 11.064a1.006 1.006 0 0 0-.854-.172A2.938 2.938 0 0 1 20 11c-1.654 0-3-1.346-3.003-2.938.005-.034.016-.134.017-.168a.998.998 0 0 0-1.254-1.006A3.002 3.002 0 0 1 15 7c-1.654 0-3-1.346-3-3 0-.217.031-.444.099-.716a1 1 0 0 0-1.067-1.236A9.956 9.956 0 0 0 2 12c0 5.514 4.486 10 10 10s10-4.486 10-10c0-.049-.003-.097-.007-.16a1.004 1.004 0 0 0-.395-.776zM8.5 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-2 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm2.5-6.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm3.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"></path>
                  </svg>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">
                  🍪 We value your privacy
                </h3>

                <p className="text-gray-600 text-xs sm:text-sm mb-3 leading-relaxed">
                  We use essential cookies to provide you with the best shopping
                  experience. These help us keep you logged in and remember your
                  cart items.
                </p>

                {showDetails && (
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-3 sm:p-4 rounded-xl mb-3 text-xs sm:text-sm border border-emerald-100">
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-emerald-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      What we use cookies for:
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold mt-0.5">
                          ✓
                        </span>
                        <span>
                          <strong className="text-gray-900">
                            Authentication:
                          </strong>{" "}
                          Keep you securely logged in
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold mt-0.5">
                          ✓
                        </span>
                        <span>
                          <strong className="text-gray-900">
                            Shopping Cart:
                          </strong>{" "}
                          Remember your selected items
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold mt-0.5">
                          ✓
                        </span>
                        <span>
                          <strong className="text-gray-900">Security:</strong>{" "}
                          Protect against fraud and unauthorized access
                        </span>
                      </li>
                    </ul>
                    <div className="mt-3 pt-3 border-t border-emerald-200">
                      <p className="text-xs text-gray-600 flex items-start gap-2">
                        <svg
                          className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          We respect your privacy. No tracking or third-party
                          advertising cookies are used.
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-emerald-600 hover:text-emerald-700 text-xs sm:text-sm font-medium inline-flex items-center gap-1 group"
                >
                  {showDetails ? (
                    <>
                      <svg
                        className="w-4 h-4 transition-transform group-hover:-translate-y-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                      Hide Details
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 transition-transform group-hover:translate-y-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      Show Cookie Details
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto lg:flex-shrink-0">
              <button
                onClick={acceptAll}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
              >
                Accept All Cookies
              </button>

              <button
                onClick={acceptEssential}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-all duration-200 border border-gray-300 hover:border-gray-400 text-sm sm:text-base"
              >
                Essential Only
              </button>

              <button
                onClick={decline}
                className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium rounded-xl transition-all duration-200 hover:bg-gray-50 text-sm sm:text-base"
              >
                Decline
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-3 sm:mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              By continuing to browse, you agree to our use of essential
              cookies.
              <a
                href="/cookie-policy"
                className="text-emerald-600 hover:text-emerald-700 font-medium ml-1"
              >
                Learn more
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsent;
