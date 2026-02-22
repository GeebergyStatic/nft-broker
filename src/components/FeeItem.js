import React from 'react';
import UseCurrencyConverter from './useCurrencyConverter';
import { useUserContext } from './UserRoleContext';

const FeeItem = ({ amountInUSD }) => {
  const { userData, currentUser } = useUserContext();
  const currencySymbol = userData.currencySymbol;
  const localCurrencyAmount = UseCurrencyConverter(amountInUSD, currencySymbol);
  const formattedBalance  = (Number(localCurrencyAmount) + 0.0).toFixed(2);

  return (
    <div>
      <span>{formattedBalance}</span>
    </div>
  );
};

export default FeeItem;
