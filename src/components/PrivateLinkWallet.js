// import react.
import React from 'react';
// importing home component
import LinkWallet from './link-wallet';
// import react router.
import { Navigate, Route, useNavigate } from 'react-router-dom';

const PrivateLinkWallet = ({ component: Component, ...rest }) => {
    const isAuthenticated = localStorage.getItem('auth');
  
    return (
        
          isAuthenticated ? (
            <LinkWallet />
          ) : ( 
            <Navigate to="/login" />
          )
    );
  };

export default PrivateLinkWallet;