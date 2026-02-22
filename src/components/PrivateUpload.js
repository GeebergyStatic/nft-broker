// import react.
import React from 'react';
// importing home component
import Upload from './upload-nft';
// import react router.
import { Navigate, Route, useNavigate } from 'react-router-dom';

const PrivateUpload = ({ component: Component, ...rest }) => {
    const isAuthenticated = localStorage.getItem('auth');
  
    return (
        
          isAuthenticated ? (
            <Upload />
          ) : ( 
            <Navigate to="/login" />
          )
    );
  };

export default PrivateUpload;