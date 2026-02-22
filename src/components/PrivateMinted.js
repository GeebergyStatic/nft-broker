// import react.
import React from 'react';
// importing home component
import Minted from './minted-nft';
// import react router.
import { Navigate, Route, useNavigate } from 'react-router-dom';

const PrivateMinted = ({ component: Component, ...rest }) => {
    const isAuthenticated = localStorage.getItem('auth');
  
    return (
        
          isAuthenticated ? (
            <Minted />
          ) : ( 
            <Navigate to="/login" />
          )
    );
  };

export default PrivateMinted;