// countryAPI.js

import axios from 'axios';

const ONLINE_URL = 'https://countriesnow.space/api/v0.1/countries';
const LOCAL_URL = '/countries.json'; // assuming this is in your public folder

const fetchCountries = async () => {
  try {
    // Try fetching from Countries Now API
    const response = await axios.get(ONLINE_URL);

    if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      const countries = response.data.data.map((country) => ({
        value: country.country,
        label: country.country,
      }));
      return countries;
    } else {
      throw new Error('Unexpected API response format');
    }
  } catch (error) {
    console.warn('Primary API failed, falling back to local file:', error.message);

    try {
      // Fallback to local file
      const localResponse = await fetch(LOCAL_URL);
      const localData = await localResponse.json();

      const countries = localData.map((country) => ({
        value: country.name,
        label: country.name,
      }));
      return countries;
    } catch (localError) {
      console.error('Failed to load countries from local file:', localError);
      return [];
    }
  }
};

export default fetchCountries;
