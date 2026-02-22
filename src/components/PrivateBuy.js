// import react.
import React from 'react';
// importing home component
import Buy from './buy-nft';
// import react router.
import { Navigate, Route, useNavigate } from 'react-router-dom';

const PrivateBuy = ({ component: Component, ...rest }) => {
    const isAuthenticated = localStorage.getItem('auth');
  
    return (
        
          isAuthenticated ? (
            <Buy />
          ) : ( 
            <Navigate to="/login" />
          )
    );
  };

export default PrivateBuy;