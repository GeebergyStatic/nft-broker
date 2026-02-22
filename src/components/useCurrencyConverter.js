import { useState, useEffect } from 'react';
import axios from 'axios';

const UseCurrencyConverter = (amountInUSD, localCurrencyCode) => {
  const [localCurrencyAmount, setLocalCurrencyAmount] = useState(null);
  
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/USD`);
        const exchangeRates = response.data.rates;
        const localCurrencyExchangeRate = exchangeRates[localCurrencyCode];
        const convertedAmount = amountInUSD * localCurrencyExchangeRate;
        setLocalCurrencyAmount(convertedAmount);
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
      }
    };

    fetchExchangeRate();
  }, [amountInUSD, localCurrencyCode]);

  return localCurrencyAmount;
};

export default UseCurrencyConverter;
