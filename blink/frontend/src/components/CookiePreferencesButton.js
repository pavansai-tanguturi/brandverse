import React from "react";
import { useCookieConsent } from "../hooks/useCookieConsent";

const CookiePreferencesButton = ({ className = "", variant = "link" }) => {
  const { resetConsent } = useCookieConsent();

  const handleOpenPreferences = () => {
    resetConsent();
    // Scroll to top to ensure banner is visible
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (variant === "button") {
    return (
      <button
        onClick={handleOpenPreferences}
        className={`px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors ${className}`}
      >
        🍪 Cookie Preferences
      </button>
    );
  }

  return (
    <button
      onClick={handleOpenPreferences}
      className={`text-blue-500 hover:text-blue-700 underline text-sm ${className}`}
    >
      Cookie Preferences
    </button>
  );
};

export default CookiePreferencesButton;
