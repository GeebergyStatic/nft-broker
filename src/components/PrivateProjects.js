// import react.
import React from 'react';
// importing home component
import MyProjects from './my-projects';
// import react router.
import { Navigate, Route, useNavigate } from 'react-router-dom';

const PrivateProjects = ({ component: Component, ...rest }) => {
    const isAuthenticated = localStorage.getItem('auth');
  
    return (
        
          isAuthenticated ? (
            <MyProjects />
          ) : ( 
            <Navigate to="/login" />
          )
    );
  };

export default PrivateProjects;