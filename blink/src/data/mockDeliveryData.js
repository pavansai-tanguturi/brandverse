// Mock data for delivery times and locations
export const deliveryLocations = [
  {
    id: 1,
    name: "Enikepadu, Vijayawada, Andhra Pradesh",
    shortName: "Enikepadu, Vijayawada, Andhra...",
    deliveryTime: Math.floor(Math.random() * 20) + 5, // Random time between 5-24 minutes
    pincode: "520010"
  },
  {
    id: 2,
    name: "Benz Circle, Vijayawada, Andhra Pradesh",
    shortName: "Benz Circle, Vijayawada, Andhra...",
    deliveryTime: Math.floor(Math.random() * 20) + 5,
    pincode: "520008"
  },
  {
    id: 3,
    name: "Governorpet, Vijayawada, Andhra Pradesh",
    shortName: "Governorpet, Vijayawada, Andhra...",
    deliveryTime: Math.floor(Math.random() * 20) + 5,
    pincode: "520002"
  },
  {
    id: 4,
    name: "Labbipet, Vijayawada, Andhra Pradesh",
    shortName: "Labbipet, Vijayawada, Andhra...",
    deliveryTime: Math.floor(Math.random() * 20) + 5,
    pincode: "520010"
  },
  {
    id: 5,
    name: "Patamata, Vijayawada, Andhra Pradesh",
    shortName: "Patamata, Vijayawada, Andhra...",
    deliveryTime: Math.floor(Math.random() * 20) + 5,
    pincode: "520007"
  }
];

// Function to get random delivery time for a location
export const getRandomDeliveryTime = () => {
  return Math.floor(Math.random() * 20) + 5; // Random time between 5-24 minutes
};

// Function to get delivery info for current location
export const getDeliveryInfo = (locationName) => {
  const deliveryTime = getRandomDeliveryTime();
  const shortName = locationName.length > 35 
    ? locationName.substring(0, 35) + "..." 
    : locationName;
  
  return {
    deliveryTime,
    shortName,
    fullName: locationName
  };
};

// Function to search locations (for future search functionality)
export const searchLocations = (query) => {
  if (!query) return deliveryLocations;
  
  return deliveryLocations.filter(location => 
    location.name.toLowerCase().includes(query.toLowerCase()) ||
    location.pincode.includes(query)
  );
};
