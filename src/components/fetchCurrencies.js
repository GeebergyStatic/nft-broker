// currencyAPI.js

import axios from 'axios';

const BASE_URL = 'https://open.er-api.com/v6/latest';
const LOCAL_URL = '/currencies.json'; // Place this JSON in your /public folder

const fetchCurrencies = async () => {
  try {
    // Try fetching from the live API
    const response = await axios.get(BASE_URL);
    const { data } = response;

    if (data && data.rates) {
      const currencies = Object.keys(data.rates).map((code) => ({
        value: code,
        label: code, // Optional: add `- ${data.rates[code]}` if you want to show exchange rates
      }));
      return currencies;
    }

    throw new Error('Unexpected live API response format');
  } catch (error) {
    console.warn('Live API failed, falling back to local JSON:', error.message);

    try {
      const localResponse = await fetch(LOCAL_URL);
      const localData = await localResponse.json();

      const currencies = Object.entries(localData.main.en.numbers.currencies).map(
        ([code, details]) => ({
          value: code,
          label: `${code}`,
        })
      );

      return currencies;
    } catch (localError) {
      console.error('Failed to load local currency data:', localError);
      return [];
    }
  }
};

export default fetchCurrencies;
