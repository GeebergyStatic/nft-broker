import React, { createContext, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { useUserContext } from './UserRoleContext';
import firstNamesJson from './first-names.json';

const ToastContext = createContext();

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastProvider = ({ children }) => {
  const intervalRef = useRef(null); // Reference to store the interval ID
  const BASE_URL = 'https://restcountries.com/v3.1/all';

  useEffect(() => {
    // const fetchCountries = async () => {
    //   try {
    //     const response = await axios.get('https://api-proxy-leoa.onrender.com/countryInfo', {
    //       params: {
    //         username: 'thegilo', // Replace with your GeoNames username
    //       },
    //     });

    //     // Assume firstNamesJson is an array of names
    //     const names = Array.isArray(firstNamesJson) ? firstNamesJson : [];

    //     const countries = response.data.geonames.map((country) => ({
    //       value: country.countryName,
    //       label: country.countryName,
    //     }));

    //     startToastNotifications(names, countries);
    //   } catch (error) {
    //     console.error('Error fetching countries or names:', error);
    //   }
    // };

    const fetchCountries = async () => {
      try {
        const response = await axios.get(BASE_URL);

        const names = Array.isArray(firstNamesJson) ? firstNamesJson : [];
        
        // Map the response to extract country names
        const countries = response.data.map((country) => ({
          value: country.name.common, // Using the common name of the country
          label: country.name.common,
        }));
    
        startToastNotifications(names, countries);
      } catch (error) {
        console.error('Error fetching countries:', error);
        return [];
      }
    };

    const startToastNotifications = (names, countries) => {
      // Clear any existing interval before starting a new one
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    
      intervalRef.current = setInterval(() => {
        // Generate random cash-out amount
        const randomNumber = Math.floor(Math.random() * (25000 - 2000 + 1)) + 2000;
    
        // Format the number as currency with commas
        const formattedAmount = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD', // Change 'USD' to your desired currency code if needed
        }).format(randomNumber);
    
        // Select random name
        const randomName = names[Math.floor(Math.random() * names.length)];
    
        // Select random country
        const randomCountry = countries[Math.floor(Math.random() * countries.length)].label;
    
        // Show toast notification
        toast.success(`${randomName} just cashed out ${formattedAmount} from ${randomCountry}`, {
          position: toast.POSITION.TOP_RIGHT,
          style: { width: '100%' },
        });
      }, 20000);
    };
    

    fetchCountries();

    // Cleanup interval when the component unmounts or the effect re-runs
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  return (
    <ToastContext.Provider value={{}}>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        closeOnClick
        pauseOnHover
      />
      {children}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
