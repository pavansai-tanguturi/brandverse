import React, { useState, useEffect } from 'react';
import AdminNav from '../../components/admin/AdminNav';

const AdminDeliveryLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [formData, setFormData] = useState({
    country: '',
    region: '',
    city: ''
  });

  useEffect(() => {
    fetchDeliveryLocations();
  }, []);

  const fetchDeliveryLocations = async () => {
    setLoading(true);
    setError('');
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const res = await fetch(`${API_BASE}/api/admin/delivery-locations`, {
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch delivery locations');
      }

      const data = await res.json();
      setLocations(data.deliveryLocations || []);
    } catch (err) {
      setError('Failed to fetch delivery locations: ' + err.message);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!formData.country.trim()) {
      setError('Country is required');
      return;
    }

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const url = editingLocation 
        ? `${API_BASE}/api/admin/delivery-locations/${editingLocation.id}`
        : `${API_BASE}/api/admin/delivery-locations`;
      
      const method = editingLocation ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          country: formData.country.trim(),
          region: formData.region.trim() || null,
          city: formData.city.trim() || null
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save delivery location');
      }

      const data = await res.json();
      setMessage(data.message);
      setFormData({ country: '', region: '', city: '' });
      setShowAddForm(false);
      setEditingLocation(null);
      await fetchDeliveryLocations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (location) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const res = await fetch(`${API_BASE}/api/admin/delivery-locations/${location.id}/toggle`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to toggle location status');
      }

      const data = await res.json();
      setMessage(data.message);
      await fetchDeliveryLocations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (location) => {
    if (!window.confirm(`Are you sure you want to delete delivery to ${location.country}?`)) {
      return;
    }

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const res = await fetch(`${API_BASE}/api/admin/delivery-locations/${location.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete delivery location');
      }

      const data = await res.json();
      setMessage(data.message);
      await fetchDeliveryLocations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      country: location.country || '',
      region: location.region || '',
      city: location.city || ''
    });
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingLocation(null);
    setFormData({ country: '', region: '', city: '' });
    setShowAddForm(false);
  };

  const handleBulkAction = async (action) => {
    if (!selectedLocations.length) {
      setError('Please select locations first');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${selectedLocations.length} locations?`)) {
      return;
    }

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      let url;
      let body;

      switch (action) {
        case 'delete':
          url = `${API_BASE}/api/admin/delivery-locations/bulk-delete`;
          body = { ids: selectedLocations };
          break;
        case 'enable':
        case 'disable':
          url = `${API_BASE}/api/admin/delivery-locations/bulk-toggle`;
          body = { 
            ids: selectedLocations,
            is_active: action === 'enable'
          };
          break;
        default:
          throw new Error('Invalid bulk action');
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to perform bulk action');
      }

      const data = await res.json();
      setMessage(data.message);
      setSelectedLocations([]);
      setBulkAction('');
      await fetchDeliveryLocations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBulkImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target.result;
          let locations;

          if (file.type === 'application/json') {
            locations = JSON.parse(text);
          } else if (file.type === 'text/csv') {
            // Simple CSV parsing
            locations = text.split('\\n').slice(1) // Skip header
              .filter(line => line.trim())
              .map(line => {
                const [country, region, city] = line.split(',').map(val => val.trim().replace(/^"(.*)"$/, '$1'));
                return { country, region, city };
              });
          } else {
            throw new Error('Unsupported file format. Please use CSV or JSON.');
          }

          const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
          const res = await fetch(`${API_BASE}/api/admin/delivery-locations/bulk-add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ locations })
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to import locations');
          }

          const data = await res.json();
          setMessage(`Successfully imported ${data.count} locations`);
          await fetchDeliveryLocations();
        } catch (err) {
          setError(err.message);
        }
      };

      reader.readAsText(file);
    } catch (err) {
      setError('Error reading file: ' + err.message);
    }

    // Reset file input
    event.target.value = '';
  };

  const handleExport = async (format = 'csv') => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const res = await fetch(`${API_BASE}/api/admin/delivery-locations/export?format=${format}`, {
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to export locations');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `delivery-locations.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedLocations(locations.map(loc => loc.id));
    } else {
      setSelectedLocations([]);
    }
  };

  const handleSelectLocation = (locationId) => {
    setSelectedLocations(prev => {
      if (prev.includes(locationId)) {
        return prev.filter(id => id !== locationId);
      } else {
        return [...prev, locationId];
      }
    });
  };

  const getLocationDisplay = (location) => {
    const parts = [location.country];
    if (location.region) parts.push(location.region);
    if (location.city) parts.push(location.city);
    return parts.join(', ');
  };

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-gray-50" style={{ paddingTop: '64px' }}>
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Delivery Locations</h1>
                <p className="text-gray-600 mt-1">Manage where you deliver your products</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 text-white rounded-lg font-medium transition-all duration-200 shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Add Location
                </button>

                <div className="relative">
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleBulkImport}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-200 text-white rounded-lg font-medium transition-all duration-200 shadow-sm cursor-pointer"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                    </svg>
                    Import
                  </label>
                </div>

                <button
                  onClick={() => handleExport('csv')}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 focus:ring-4 focus:ring-gray-200 text-white rounded-lg font-medium transition-all duration-200 shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  Export
                </button>
              </div>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">
                  {editingLocation ? 'Edit Delivery Location' : 'Add New Delivery Location'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country *
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., India, USA, Canada"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Region/State (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., California, Maharashtra"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Mumbai, Los Angeles"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      {editingLocation ? 'Update Location' : 'Add Location'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-green-800 font-medium">{message}</p>
                </div>
                <button onClick={() => setMessage('')} className="text-green-600 hover:text-green-800">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
                <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Locations List */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading delivery locations...</p>
              </div>
            </div>
          ) : locations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery locations</h3>
                <p className="text-gray-600">Add delivery locations to start managing where you deliver.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                {selectedLocations.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedLocations.length} locations selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction('enable')}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
                    >
                      Enable All
                    </button>
                    <button
                      onClick={() => handleBulkAction('disable')}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded transition-colors"
                    >
                      Disable All
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
                    >
                      Delete All
                    </button>
                  </div>
                </div>
              )}

              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedLocations.length === locations.length}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Country</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Region</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">City</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {locations.map((location) => (
                      <tr key={location.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedLocations.includes(location.id)}
                            onChange={() => handleSelectLocation(location.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getLocationDisplay(location)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{location.country}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{location.region || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{location.city || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            location.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {location.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(location)}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(location)}
                              className={`px-3 py-1 text-xs rounded transition-colors ${
                                location.is_active
                                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {location.is_active ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleDelete(location)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDeliveryLocations;