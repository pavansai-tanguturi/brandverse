import React, { useState, useEffect } from "react";
import { useAddress } from "../context/AddressContext";
import { useAuth } from "../context/AuthContext";

const AddressManager = () => {
  const { user } = useAuth();
  const {
    addresses,
    loading,
    error,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAddress();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [actionError, setActionError] = useState("");
  const [formData, setFormData] = useState({
    is_default: false,
    full_name: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    landmark: "",
  });

  useEffect(() => {
    if (user?.id) {
      fetchAddresses(user.id);
    }
  }, [user?.id, fetchAddresses]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionError(""); // Clear any previous errors
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, formData);
        setEditingAddress(null);
      } else {
        await createAddress(user.id, formData);
      }
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      setActionError("Error saving address: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      is_default: false,
      full_name: "",
      phone: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "India",
      landmark: "",
    });
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData(address);
    setShowAddForm(true);
  };

  const handleDelete = async (addressId) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      setActionError(""); // Clear any previous errors
      try {
        await deleteAddress(addressId);
      } catch (error) {
        setActionError("Error deleting address: " + error.message);
      }
    }
  };

  const handleSetDefault = async (addressId) => {
    setActionError(""); // Clear any previous errors
    try {
      await setDefaultAddress(addressId);
    } catch (error) {
      setActionError("Error setting default address: " + error.message);
    }
  };

  const formatAddress = (address) => {
    return `${address.address_line_1}${address.address_line_2 ? ", " + address.address_line_2 : ""}, ${address.city}, ${address.state} ${address.postal_code}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2">Loading addresses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Manage Addresses
            </h3>
            <p className="text-gray-600">
              Add and manage your delivery addresses
            </p>
          </div>
          <button
            onClick={() => {
              setEditingAddress(null);
              resetForm();
              setShowAddForm(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add New Address
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-red-500 text-xl">⚠️</span>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Action Error Display */}
      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-red-500 text-xl">⚠️</span>
              <p className="text-red-700 font-medium">{actionError}</p>
            </div>
            <button
              onClick={() => setActionError("")}
              className="text-red-500 hover:text-red-700 font-bold text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            {editingAddress ? "Edit Address" : "Add New Address"}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="+91 9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                name="address_line_1"
                value={formData.address_line_1}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Street address, P.O. Box, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                name="address_line_2"
                value={formData.address_line_2}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                name="landmark"
                value={formData.landmark}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Near Central Mall, etc."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_default"
                id="is_default"
                checked={formData.is_default}
                onChange={handleInputChange}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label
                htmlFor="is_default"
                className="ml-2 block text-sm text-gray-900"
              >
                Set as default address
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {editingAddress ? "Update Address" : "Save Address"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAddress(null);
                  resetForm();
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address List */}
      <div className="space-y-6">
        {addresses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📍</span>
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-3">
              No addresses saved
            </h4>
            <p className="text-gray-500 mb-8 text-lg max-w-md mx-auto">
              Add your first delivery address to start shopping with ease
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Address
            </button>
          </div>
        ) : (
          addresses.map((address) => (
            <div
              key={address.id}
              className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 hover:border-orange-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                    {address.is_default && (
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full text-sm font-semibold border border-blue-300">
                        ⭐ Default
                      </span>
                    )}
                  </div>
                  <h5 className="font-bold text-gray-900 text-lg mb-2">
                    {address.full_name}
                  </h5>
                  <p className="text-gray-600 leading-relaxed mb-2">
                    {formatAddress(address)}
                  </p>
                  {address.phone && (
                    <p className="text-gray-600 flex items-center gap-2 mb-1">
                      <span className="text-orange-500">📞</span>{" "}
                      {address.phone}
                    </p>
                  )}
                  {address.landmark && (
                    <p className="text-gray-500 flex items-center gap-2">
                      <span className="text-orange-500">🏛️</span>{" "}
                      {address.landmark}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-3 ml-6">
                  <button
                    onClick={() => handleEdit(address)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </button>
                  {!address.is_default && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AddressManager;
