import React from "react";
import { useCookieConsent } from "../hooks/useCookieConsent";

const CookiePolicy = () => {
  const { consent, acceptConsent, resetConsent } = useCookieConsent();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🍪 Cookie Policy
        </h1>

        {/* Current Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            Your Current Cookie Preferences
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-blue-700">
              Status:{" "}
              <strong>
                {consent === "accepted" && "✅ All cookies accepted"}
                {consent === "essential" && "⚠️ Essential cookies only"}
                {consent === "declined" && "❌ Cookies declined"}
                {!consent && "🔄 No preference set"}
              </strong>
            </span>
            <button
              onClick={resetConsent}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors"
            >
              Change Preferences
            </button>
          </div>
        </div>

        {/* What are cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            What are cookies?
          </h2>
          <p className="text-gray-600 mb-4">
            Cookies are small text files that are stored on your computer or
            mobile device when you visit a website. They help us provide you
            with a better experience by remembering your preferences and keeping
            you logged in.
          </p>
        </section>

        {/* Types of cookies we use */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Types of cookies we use
          </h2>

          <div className="space-y-6">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-semibold text-green-700 mb-2">
                ✅ Essential Cookies (Required)
              </h3>
              <p className="text-gray-600 mb-2">
                These cookies are necessary for the website to function
                properly. They enable core functionality such as:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>User authentication and login sessions</li>
                <li>Shopping cart functionality</li>
                <li>Security and fraud prevention</li>
                <li>Website navigation and basic functionality</li>
              </ul>
              <p className="text-sm text-gray-500 mt-2">
                <strong>Cookie name:</strong> brandverse.sid |{" "}
                <strong>Duration:</strong> 7 days | <strong>Purpose:</strong>{" "}
                Session management
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="text-lg font-semibold text-yellow-700 mb-2">
                ⚡ Performance Cookies (Optional)
              </h3>
              <p className="text-gray-600 mb-2">
                These cookies help us understand how you use our website so we
                can improve it:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Page load times and performance metrics</li>
                <li>Error tracking and bug reporting</li>
                <li>Usage analytics (anonymized)</li>
              </ul>
              <p className="text-sm text-gray-500 mt-2">
                <strong>Note:</strong> Currently not implemented - we don't use
                tracking cookies
              </p>
            </div>
          </div>
        </section>

        {/* How we use cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            How we use cookies
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Keep you logged in during your visit</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Remember items in your shopping cart</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Ensure secure transactions and prevent fraud</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">✗</span>
                <span>Track you across other websites</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">✗</span>
                <span>Share your data with advertisers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">✗</span>
                <span>Store personal information like passwords</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Your choices */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Your choices
          </h2>
          <p className="text-gray-600 mb-4">
            You have full control over how we use cookies on your device:
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="border border-green-300 rounded-lg p-4 text-center">
              <h3 className="font-semibold text-green-700 mb-2">Accept All</h3>
              <p className="text-sm text-gray-600 mb-3">
                Enable all cookies for the best experience
              </p>
              <button
                onClick={() => acceptConsent("accepted")}
                className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
              >
                Accept All
              </button>
            </div>

            <div className="border border-yellow-300 rounded-lg p-4 text-center">
              <h3 className="font-semibold text-yellow-700 mb-2">
                Essential Only
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Only cookies needed for basic functionality
              </p>
              <button
                onClick={() => acceptConsent("essential")}
                className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors"
              >
                Essential Only
              </button>
            </div>

            <div className="border border-red-300 rounded-lg p-4 text-center">
              <h3 className="font-semibold text-red-700 mb-2">Decline All</h3>
              <p className="text-sm text-gray-600 mb-3">
                Disable all cookies (limited functionality)
              </p>
              <button
                onClick={() => acceptConsent("declined")}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
              >
                Decline All
              </button>
            </div>
          </div>
        </section>

        {/* Browser controls */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Browser controls
          </h2>
          <p className="text-gray-600 mb-4">
            You can also control cookies through your browser settings:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>
              <strong>Chrome:</strong> Settings → Privacy and security → Cookies
              and other site data
            </li>
            <li>
              <strong>Firefox:</strong> Settings → Privacy & Security → Cookies
              and Site Data
            </li>
            <li>
              <strong>Safari:</strong> Preferences → Privacy → Manage Website
              Data
            </li>
            <li>
              <strong>Edge:</strong> Settings → Cookies and site permissions →
              Cookies and site data
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            Questions about our cookie policy?
          </h2>
          <p className="text-gray-600 mb-4">
            If you have any questions about how we use cookies, please contact
            us:
          </p>
          <div className="text-gray-600">
            <p>
              <strong>Email:</strong>{" "}
              {process.env.REACT_APP_ADMIN_EMAIL || "privacy@brandverse.com"}
            </p>
            <p>
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CookiePolicy;
