import React from "react";

/**
 * Standardized Address Display Component for Admin Panels
 * Handles both normalized addresses table data and legacy JSONB format
 */
const AddressDisplay = ({
  address,
  type = "shipping",
  className = "",
  showLabel = true,
}) => {
  if (!address) {
    return (
      <div className={`text-gray-400 text-sm italic ${className}`}>
        No {type} address provided
      </div>
    );
  }

  const renderAddress = () => {
    try {
      // Handle string addresses (legacy or simple text)
      if (typeof address === "string") {
        // Try to parse as JSON first
        try {
          const parsedAddr = JSON.parse(address);
          return renderAddressObject(parsedAddr);
        } catch {
          // If not JSON, display as plain text
          return <div className="text-gray-700">{address}</div>;
        }
      }

      // Handle object addresses
      return renderAddressObject(address);
    } catch (error) {
      console.error("Error rendering address:", error);
      return (
        <div className="text-red-500 text-xs">⚠️ Error displaying address</div>
      );
    }
  };

  const renderAddressObject = (addr) => {
    return (
      <div className="space-y-1">
        {addr.full_name && (
          <div className="font-medium text-gray-900">{addr.full_name}</div>
        )}
        {addr.phone && <div className="text-gray-700">{addr.phone}</div>}
        {addr.address_line_1 && (
          <div className="text-gray-800">{addr.address_line_1}</div>
        )}
        {addr.address_line_2 && (
          <div className="text-gray-700">{addr.address_line_2}</div>
        )}
        {addr.landmark && (
          <div className="text-gray-600">📍 {addr.landmark}</div>
        )}
        {(addr.city || addr.state || addr.postal_code) && (
          <div className="text-gray-700 font-medium">
            {[addr.city, addr.state, addr.postal_code]
              .filter(Boolean)
              .join(", ")}
          </div>
        )}
        {addr.country && <div className="text-gray-600">{addr.country}</div>}

        {/* Legacy format support */}
        {addr.street && !addr.address_line_1 && (
          <div className="text-gray-800">{addr.street}</div>
        )}
        {addr.zip && !addr.postal_code && (
          <div className="text-gray-700 font-medium">
            {[addr.city, addr.state, addr.zip].filter(Boolean).join(", ")}
          </div>
        )}
      </div>
    );
  };

  const getIcon = () => {
    switch (type) {
      case "shipping":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9l3-3 3 3"
            ></path>
          </svg>
        );
      case "billing":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            ></path>
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            ></path>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
        );
    }
  };

  return (
    <div className={`${className}`}>
      {showLabel && (
        <div className="flex items-center mb-2">
          <span className="text-gray-600 mr-2">{getIcon()}</span>
          <h5 className="font-medium text-gray-900 capitalize">
            {type} Address
          </h5>
        </div>
      )}
      <div className="text-sm">{renderAddress()}</div>
    </div>
  );
};

export default AddressDisplay;
