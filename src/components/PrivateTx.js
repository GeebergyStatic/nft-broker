// import react.
import React from 'react';
// importing home component
import Home from './Home';
import WalletBalance from './WalletBalance';
import PaymentModal from './PaymentModal';
import TransactionList from './Transactions';
// import react router.
import { Navigate, Route, useNavigate } from 'react-router-dom';

const PrivateTx = ({ component: Component, ...rest }) => {
    const isAuthenticated = localStorage.getItem('auth');
  
    return (
        
          isAuthenticated ? (
            < TransactionList/>
          ) : ( 
            <Navigate to="/login" />
          )
    );
  };

export default PrivateTx;