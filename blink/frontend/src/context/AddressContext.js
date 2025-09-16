import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { API_BASE_URL } from '../utils/api';

const AddressContext = createContext();

// Address action types
const ADDRESS_ACTIONS = {
  SET_ADDRESSES: 'SET_ADDRESSES',
  ADD_ADDRESS: 'ADD_ADDRESS',
  UPDATE_ADDRESS: 'UPDATE_ADDRESS',
  DELETE_ADDRESS: 'DELETE_ADDRESS',
  SET_DEFAULT_ADDRESS: 'SET_DEFAULT_ADDRESS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

// Address reducer
const addressReducer = (state, action) => {
  switch (action.type) {
    case ADDRESS_ACTIONS.SET_ADDRESSES:
      return {
        ...state,
        addresses: action.payload,
        loading: false,
        error: null
      };
    
    case ADDRESS_ACTIONS.ADD_ADDRESS:
      return {
        ...state,
        addresses: [...state.addresses, action.payload],
        loading: false,
        error: null
      };
    
    case ADDRESS_ACTIONS.UPDATE_ADDRESS:
      return {
        ...state,
        addresses: state.addresses.map(addr => 
          addr.id === action.payload.id ? action.payload : addr
        ),
        loading: false,
        error: null
      };
    
    case ADDRESS_ACTIONS.DELETE_ADDRESS:
      return {
        ...state,
        addresses: state.addresses.filter(addr => addr.id !== action.payload),
        loading: false,
        error: null
      };
    
    case ADDRESS_ACTIONS.SET_DEFAULT_ADDRESS:
      return {
        ...state,
        addresses: state.addresses.map(addr => ({
          ...addr,
          is_default: addr.id === action.payload.id
        })),
        loading: false,
        error: null
      };
    
    case ADDRESS_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case ADDRESS_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    default:
      return state;
  }
};

const initialState = {
  addresses: [],
  loading: false,
  error: null
};

export const AddressProvider = ({ children }) => {
  const [state, dispatch] = useReducer(addressReducer, initialState);

  // API Base URL
  const API_BASE = `${API_BASE_URL}/api`;

  // Fetch addresses for a customer
  const fetchAddresses = useCallback(async (customerId) => {
    dispatch({ type: ADDRESS_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const response = await fetch(`${API_BASE}/addresses`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch addresses: ${response.status}`);
      }
      
      const addresses = await response.json();
      dispatch({ type: ADDRESS_ACTIONS.SET_ADDRESSES, payload: addresses });
    } catch (error) {
      console.error('Error fetching addresses:', error);
      dispatch({ type: ADDRESS_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [API_BASE]);

  // Create a new address
  const createAddress = useCallback(async (customerId, addressData) => {
    dispatch({ type: ADDRESS_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const response = await fetch(`${API_BASE}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(addressData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create address');
      }
      
      const newAddress = await response.json();
      dispatch({ type: ADDRESS_ACTIONS.ADD_ADDRESS, payload: newAddress });
      return newAddress;
    } catch (error) {
      console.error('Error creating address:', error);
      dispatch({ type: ADDRESS_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [API_BASE]);

  // Update an address
  const updateAddress = useCallback(async (addressId, addressData) => {
    dispatch({ type: ADDRESS_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const response = await fetch(`${API_BASE}/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(addressData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update address');
      }
      
      const updatedAddress = await response.json();
      dispatch({ type: ADDRESS_ACTIONS.UPDATE_ADDRESS, payload: updatedAddress });
      return updatedAddress;
    } catch (error) {
      console.error('Error updating address:', error);
      dispatch({ type: ADDRESS_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [API_BASE]);

  // Delete an address
  const deleteAddress = useCallback(async (addressId) => {
    dispatch({ type: ADDRESS_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const response = await fetch(`${API_BASE}/addresses/${addressId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete address');
      }
      
      dispatch({ type: ADDRESS_ACTIONS.DELETE_ADDRESS, payload: addressId });
    } catch (error) {
      console.error('Error deleting address:', error);
      dispatch({ type: ADDRESS_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [API_BASE]);

  // Set default address
  const setDefaultAddress = useCallback(async (addressId) => {
    dispatch({ type: ADDRESS_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const response = await fetch(`${API_BASE}/addresses/${addressId}/default`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set default address');
      }
      
      const updatedAddress = await response.json();
      dispatch({ 
        type: ADDRESS_ACTIONS.SET_DEFAULT_ADDRESS, 
        payload: { id: addressId } 
      });
      return updatedAddress;
    } catch (error) {
      console.error('Error setting default address:', error);
      dispatch({ type: ADDRESS_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [API_BASE]);

  // Get default address by type
  const getDefaultAddress = (type) => {
    return state.addresses.find(addr => addr.type === type && addr.is_default);
  };

  // Get addresses by type
  const getAddressesByType = (type) => {
    return state.addresses.filter(addr => addr.type === type || addr.type === 'both');
  };

  const value = {
    ...state,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress,
    getAddressesByType
  };

  return (
    <AddressContext.Provider value={value}>
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return context;
};
