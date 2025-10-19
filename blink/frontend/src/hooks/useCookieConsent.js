import { useState, useEffect } from "react";

// Custom hook to manage cookie consent
export const useCookieConsent = () => {
  const [consent, setConsent] = useState(null);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    const storedConsent = localStorage.getItem("cookieConsent");
    const consentDate = localStorage.getItem("cookieConsentDate");

    if (storedConsent) {
      setConsent(storedConsent);
      setHasConsented(true);

      // Check if consent is older than 1 year (GDPR requirement)
      if (consentDate) {
        const consentDateTime = new Date(consentDate);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        if (consentDateTime < oneYearAgo) {
          // Consent expired, reset
          resetConsent();
        }
      }
    }
  }, []);

  const acceptConsent = (type = "accepted") => {
    localStorage.setItem("cookieConsent", type);
    localStorage.setItem("cookieConsentDate", new Date().toISOString());
    setConsent(type);
    setHasConsented(true);
  };

  const resetConsent = () => {
    localStorage.removeItem("cookieConsent");
    localStorage.removeItem("cookieConsentDate");
    setConsent(null);
    setHasConsented(false);
  };

  const isEssentialOnly = consent === "essential";
  const isDeclined = consent === "declined";
  const isAccepted = consent === "accepted";

  return {
    consent,
    hasConsented,
    isEssentialOnly,
    isDeclined,
    isAccepted,
    acceptConsent,
    resetConsent,
  };
};

// Utility functions for cookie management
export const cookieUtils = {
  // Check if cookies are enabled in the browser
  areCookiesEnabled: () => {
    try {
      document.cookie = "test=test; SameSite=Lax";
      const enabled = document.cookie.indexOf("test=test") !== -1;
      // Clean up test cookie
      document.cookie =
        "test=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      return enabled;
    } catch (e) {
      return false;
    }
  },

  // Get consent status
  getConsentStatus: () => {
    return localStorage.getItem("cookieConsent");
  },

  // Check if user has made a consent choice
  hasConsentChoice: () => {
    return localStorage.getItem("cookieConsent") !== null;
  },

  // Clear all site cookies (for declined consent)
  clearSiteCookies: () => {
    document.cookie.split(";").forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  },

  // Show cookie notification
  shouldShowNotification: () => {
    const consent = localStorage.getItem("cookieConsent");
    const consentDate = localStorage.getItem("cookieConsentDate");

    if (!consent) return true;

    // Check if consent is older than 1 year
    if (consentDate) {
      const consentDateTime = new Date(consentDate);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      if (consentDateTime < oneYearAgo) {
        return true; // Need to ask for consent again
      }
    }

    return false;
  },
};

export default useCookieConsent;
