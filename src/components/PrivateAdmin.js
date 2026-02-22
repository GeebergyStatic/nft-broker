import React from 'react';
import UserManagement from './UserManagement';
import { useUserContext } from './UserRoleContext';
import { Navigate } from 'react-router-dom';

const PrivateAdmin = () => {
    const { userData } = useUserContext(); // Assuming userData is obtained here
    const isAuthenticated = localStorage.getItem('auth');
    const isAdmin = userData?.role === 'agent'; // Checks if user is 'agent'
    console.log(isAdmin);

    // If no userData or role, redirect to login
    if (!userData || !userData.role) {
        return <span>loading...</span>;
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // If user is authenticated and is an admin, render UserManagement
    if (isAdmin) {
        return <UserManagement />;
    }

    // If the user isn't admin, redirect to another route (or show something else)
    return <Navigate to="/" />;
};

export default PrivateAdmin;
