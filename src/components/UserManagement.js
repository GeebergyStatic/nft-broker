import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import EditUserModal from './EditUserModal';
import { useUserContext } from './UserRoleContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const { userData } = useUserContext();
  const agentID = userData.agentID;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers(agentID);
  }, []);

  const fetchUsers = async (agentID) => {
    setIsLoading(true);
    try {
      // Include the agentID as a query parameter in the API request
      const response = await axios.get(`https://broker-app-4xfu.onrender.com/api/users?agentID=${agentID}`);
      setUsers(response.data); // Assuming response.data is an array of users
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // const fetchUsers = async () => {
  //   setIsLoading(true);
  //   try {
  //     // Include the agentID as a query parameter in the API request
  //     const response = await axios.get(`https://broker-app-4xfu.onrender.com/api/users`);
  //     setUsers(response.data); // Assuming response.data is an array of users
  //   } catch (error) {
  //     console.error('Error fetching users:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  
  const handleEditClick = (user) => {
    setSelectedUser(user); // Set the selected user for editing
  };

  const containerStyle = {
    position: 'absolute',
    minHeight: '100vh', // Ensures the background color covers the whole screen vertically
    width: '100%', // Ensures the background color covers the whole width
    background: '#13151b',
    overflowX: 'scroll',
    color: '#fff',
    padding: '30px',
    // borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    // marginTop: '20px',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  };

  const thStyle = {
    backgroundColor: '#444',
    color: '#fff',
    padding: '10px',
    textAlign: 'left',
  };

  const tdStyle = {
    padding: '10px',
    textAlign: 'left',
    borderBottom: '1px solid #ccc',
  };

  const buttonStyle = {
    backgroundColor: '#1f78d1',
    color: '#fff',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  };

  const buttonHoverStyle = {
    backgroundColor: '#165ea0',
  };

  return (
    <div style={containerStyle}>
        <Link to='/'><i class="fa fa-arrow-left"></i> Back to home</Link>
      <h1 className='mt-5'>User Management</h1>
      {isLoading ? (
        <div className="text-center">
          <i className="fa fa-spinner fa-spin fa-3x fa-fw text-light"></i>
          <p className="text-light">Loading users...</p>
        </div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Number</th>
              <th style={thStyle}>Deposit</th>
              <th style={thStyle}>Referrals Balance</th>
              <th style={thStyle}>Referred Users</th>
              <th style={thStyle}>Referred By (ID)</th>
              <th style={thStyle}>Account Active?</th>
              <th style={thStyle}>Currency</th>
              <th style={thStyle}>Country</th>
              <th style={thStyle}>Balance</th>
              <th style={thStyle}>Returns</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={tdStyle}>{user.userId}</td>
                <td style={tdStyle}>{user.name}</td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.number}</td>
                <td style={tdStyle}>{user.deposit}</td>
                <td style={tdStyle}>{user.referralsBalance}</td>
                <td style={tdStyle}>{user.referredUsers}</td>
                <td style={tdStyle}>{user.referredBy}</td>
                <td style={tdStyle}>{user.isUserActive ? 'true' : 'false'}</td>
                <td style={tdStyle}>{user.currencySymbol}</td>
                <td style={tdStyle}>{user.country}</td>
                <td style={tdStyle}>{user.balance}</td>
                <td style={tdStyle}>{user.returns}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleEditClick(user)}
                    style={buttonStyle}
                    onMouseOver={(e) => (e.target.style.backgroundColor = buttonHoverStyle.backgroundColor)}
                    onMouseOut={(e) => (e.target.style.backgroundColor = buttonStyle.backgroundColor)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedUser && (
        <EditUserModal user={selectedUser} onClose={() => setSelectedUser(null)} onUserUpdated={fetchUsers} />
      )}
    </div>
  );
};

export default UserManagement;
