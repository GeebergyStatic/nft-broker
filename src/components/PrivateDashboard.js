// import react.
import React from 'react';
// importing home component
import Dashboard from './dashboard';
// import react router.
import { Navigate, Route, useNavigate } from 'react-router-dom';

const PrivateDashboard = ({ component: Component, ...rest }) => {
    const isAuthenticated = localStorage.getItem('auth');
  
    return (
        
          isAuthenticated ? (
            <Dashboard />
          ) : ( 
            <Navigate to="/login" />
          )
    );
  };

export default PrivateDashboard;