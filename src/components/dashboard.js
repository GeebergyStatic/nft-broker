import React, { useState } from 'react';
import { Container, Row, Col, Card, Accordion, Button, Table } from 'react-bootstrap';
import { Link, useMatch, useResolvedPath, useNavigate } from 'react-router-dom';
import { useUserContext } from './UserRoleContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Dashboard = () => {
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  const CustomLink = ({ to, children, ...props }) => {
    const resolvedPath = useResolvedPath(to);
    const isActive = useMatch({ path: resolvedPath.pathname, end: true });

    return (
      <li className={isActive ? 'active' : ''}>
        <Link to={to} {...props}>
          {children}
        </Link>
      </li>
    );
  };

  const { userData, currentUser } = useUserContext();

  const handleCopy = () => {
    // Get the full hostname (e.g., "app.domain.com")
    const fullDomain = window.location.hostname;

    // Extract only the main domain (e.g., "domain.com")
    const parts = fullDomain.split(".");
    const domain =
      parts.length > 2
        ? parts.slice(-2).join(".") // Removes subdomain if present
        : fullDomain; // If no subdomain, use as is

    // Construct base URL without subdomain
    const protocol = window.location.protocol;
    const baseUrl = `${protocol}//${domain}`;

    // Generate referral link
    const referralLink = `${baseUrl}/?ag=${userData.agentID}`;

    // Copy to clipboard using modern API
    navigator.clipboard.writeText(referralLink).then(() => {
      toast.info("Agent link copied to clipboard!", {
        position: toast.POSITION.TOP_CENTER,
        className: "custom-toast",
      });
    }).catch(err => {
      console.error("Failed to copy: ", err);
    });
  };





  const generateAgentID = () => {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const handleProfilePictureTap = async () => {
    const now = Date.now();
    if (now - lastTapTime < 2000) {
      setTapCount(prev => prev + 1);
    } else {
      setTapCount(1);
    }
    setLastTapTime(now);

    if (tapCount + 1 === 8) {
      if (userData?.role !== "agent") {
        try {
          const agentID = generateAgentID();
          const token = localStorage.getItem("token");
          await fetch("https://nft-broker-mroz.onrender.com/api/update-user", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              // Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ role: "agent", agentID, userId: userData.userID })
          });

          toast.success("You are now an agent!", { position: toast.POSITION.TOP_CENTER, className: "custom-toast", });

          // Refresh the page after 2 seconds
          setTimeout(() => {
            window.location.reload();
          }, 2000);

        } catch (error) {
          console.error("Error updating role", error);
          toast.error("Could not update role. Try again later.", { position: toast.POSITION.TOP_CENTER, className: "custom-toast", });
        }
      } else {
        toast.info("You are already an agent.", { position: toast.POSITION.TOP_CENTER, className: "custom-toast", });
      }
      setTapCount(0);
    }
  };

  const accBox = {
    background: "linear-gradient(90deg, rgba(200, 220, 240, 0.9) 0%, rgba(220, 230, 250, 0.85) 100%)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 3px 12px rgba(0, 0, 0, 0.1)",
    borderBottom: "1px solid rgba(0, 0, 0, 0.15)",
    borderRadius: "10px",
    minHeight: "120px",
  };

  const accHead = {
    fontSize: '25px',
    fontWeight: 'bold',
  }

  return (
    <div className='container-large'>
      <div className='container'>
        <ToastContainer />
        <div className="mt-4 main-container">
          <h4 className='text-secondary'>Personal Info</h4>

          <div className="ride-detail__user-avatar">
            <div onClick={handleProfilePictureTap} style={{ cursor: 'pointer' }}>
              <img src={userData.avatar} alt="User Avatar" />
            </div>
          </div>
          <div className='row align-items-center justify-content-between mt-3'>
            {!userData.isUserActive && <span className='text-warning mb-1'><FontAwesomeIcon className='mx-2' icon={faInfoCircle} />Chat with an agent to get your account verified!</span>}
            <div className='col-lg-6 mb-4'>
              <div className="card bg-secondary" style={accBox}>
                <div className="card-body">
                  <div className="flex-column text-start align-items-start justify-content-between">
                    <div className="d-block mb-3">
                      <span style={accHead}>Username:</span>

                    </div>
                    <div>
                      <span>{userData.fullName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='col-lg-6 mb-4'>
              <div className="card bg-secondary" style={accBox}>
                <div className="card-body">
                  <div className="flex-column text-start align-items-start justify-content-between">
                    <div className="d-block mb-3">
                      <span style={accHead}>Email:</span>

                    </div>
                    <div>
                      <span>{userData.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/*  */}
          <div className='row align-items-center justify-content-between mt-4'>
            <div className='col-lg-6 mb-4'>
              <div className="card bg-secondary" style={accBox}>
                <div className="card-body">
                  <div className="flex-column text-start align-items-start justify-content-between">
                    <div className="d-block mb-3">
                      <span style={accHead}>Account Status:</span>

                    </div>
                    <div>
                      <span className={userData.isUserActive ? 'border border-success p-2 text-success' : 'border border-danger p-2 text-danger'}>
                        {userData.isUserActive ? (
                          'Verified'
                        ) : (
                          'Not verified'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='col-lg-6 mb-4'>
              <Link to='/my-projects' style={{ textDecoration: "none" }}>
                <div className="card bg-secondary" style={accBox}>
                  <div className="card-body">
                    <div className="flex-column text-start align-items-start justify-content-between">
                      <div className="d-block mb-3">
                        <span style={accHead}>{userData.role === 'agent' ? (
                          <span>My Clients' Projects</span>
                        ) :
                          (
                            <span>View Your Unique Artworks</span>
                          )}:</span>

                      </div>
                      <div>
                        {/* <span>{userData.country}</span> */}
                        <FontAwesomeIcon icon={faChevronRight} />
                        <FontAwesomeIcon icon={faChevronRight} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>



          {/*  */}
          {userData.role === 'agent' && (
            <>
              <div className={`d-flex align-items-center justify-content-between border-bottom border-gray p-2 mb-2 ${userData.role === 'agent' ? 'mb-3' : ''}`}>
                <span className='text-dark'>Agent ID:</span>
                <button className='remove-btn-style' onClick={handleCopy}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" color='#9F00FF' fill="currentColor" className="bi bi-copy" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6ZM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z" />
                </svg></button>
              </div>
              <Link to='/admin' className='mt-4 text-dark'>Go To Admin Page</Link>
            </>
          )}
          {/*  */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
