import { useContext, useRef, useEffect, useState, useCallback, Component } from 'react';
import { Link, useMatch, useResolvedPath, useNavigate } from 'react-router-dom';
import Loading from './Loading';
import TradingViewWidget from './TradingViewWidget';
import { auth, realTimeDb } from '../firebase';
import { useUserContext } from './UserRoleContext';
import { ToastContainer, toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { faWallet, faExchangeAlt, faChartLine, faUser } from "@fortawesome/free-solid-svg-icons"
import FeeItem from './FeeItem';
import NftDepositList from './adminNFTDeposit';
import { Spinner } from "react-bootstrap"; // Import Bootstrap spinner
import { Button } from "react-bootstrap";
import NftWithdrawList from './adminNFTWithdraw';
import NftSubmittedList from './adminSubmittedNFT';
import ScreenLoad from './screenLoad';
import path from 'path-browserify';

function Home() {
  const user = auth.currentUser;
  const { userData, currentUser } = useUserContext();
  const currencySymbol = userData.currencySymbol;
  const [isCheckLoading, setIsCheckLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('deposit');


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

  const initializeTooltip = (element) => {
    if (element) {
      const tooltip = new window.bootstrap.Tooltip(element, {
        placement: 'top', // Adjust placement as needed
        title: element.title,
      });
    }
  };


  const tooltipRefTrophy = useRef();
  const tooltipTitleTrophy = `Events`;


  useEffect(() => {
    initializeTooltip(tooltipRefTrophy.current);
  }, []);

  useEffect(() => {
    // Remove the 'new' key from localStorage
    localStorage.removeItem('new');
  }, []);

  const loading = !userData || !("balance" in userData); // Simple loading check

  const spinner = (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "100px" }}>
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );


  const userStyle = {
    fontSize: '15px',
  };

  const iconStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(100, 0, 255, 0.8), rgba(0, 200, 255, 0.8))",
    boxShadow: "0px 0px 4px rgba(100, 0, 255, 0.6)",
  };

  const accBox = {
    background: "linear-gradient(90deg, rgba(200, 220, 240, 0.9) 0%, rgba(220, 230, 250, 0.85) 100%)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 3px 12px rgba(0, 0, 0, 0.1)",
    borderBottom: "1px solid rgba(0, 0, 0, 0.15)",
    borderRadius: "10px",
    minHeight: "140px",
  };
  const accHead = {
    fontSize: '25px',
    // fontWeight: 'bold',
  }

  const smaller = {
    fontSize: '14px'
  }

  const avatar = {
    height: '2rem',
    width: '2rem',
    borderRadius: '50%'
  }
  const taskBoxStyle = {
    width: '85%',
    marginLeft: '16.5%',
    marginRight: '3.5%',
    height: '330px',
    backgroundColor: '#1F222D', // White background color
    color: '#000', // Text color
    boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
    overflowY: 'auto',
  };

  const moreOptions = {
    width: '85%',
    marginLeft: '16.5%',
    marginRight: '3.5%',
    marginBottom: '10%',
    height: '170px',
    backgroundColor: '#1F222D',
    boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
    overflowY: 'auto',

  }

  const pointer = {
    cursor: 'pointer'
  }

  return (
    <>
      <ToastContainer />
      <div className='container-large'>
        <div className='container'>
          {/* link wallet */}
          <div
            className="d-flex align-items-center justify-content-between flex-wrap gap-3 p-4 rounded-4 shadow-lg mb-4"
            style={{
              background: 'linear-gradient(135deg, #1e3a8a, #312e81)',
              color: 'white',
              borderRadius: '16px',
            }}
          >
            <div className="d-flex align-items-center flex-grow-1 gap-3">
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <FontAwesomeIcon icon={faWallet} style={{ fontSize: '26px', color: 'white' }} />
              </div>

              <div>
                <h5 className="mb-1 fw-semibold">Link Your Wallet</h5>
                <p className="mb-0" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  Connect to access your assets securely on the blockchain.
                </p>
              </div>
            </div>

            <Button
              as={Link}
              to="/link-wallet"
              variant="dark"
              className="px-4 py-2 fw-medium shadow-sm"
              style={{
                borderRadius: '10px',
                minWidth: '160px',
              }}
            >
              Connect Wallet
            </Button>
          </div>

          <div className='main-container'>
            {userData.role === 'agent' ? (
              <>
                {/* Toggle Buttons */}
                <div
                  className="d-flex flex-wrap justify-content-center mb-4"
                  style={{ gap: '0.5rem' }}
                >
                  <button
                    className={`btn ${activeTab === 'deposit' ? 'btn-primary' : 'btn-outline-primary'}`}
                    style={{ minWidth: '120px', flex: '1 1 auto' }}
                    onClick={() => setActiveTab('deposit')}
                  >
                    Deposits
                  </button>
                  <button
                    className={`btn ${activeTab === 'withdraw' ? 'btn-primary' : 'btn-outline-primary'}`}
                    style={{ minWidth: '120px', flex: '1 1 auto' }}
                    onClick={() => setActiveTab('withdraw')}
                  >
                    Withdrawals
                  </button>
                  <button
                    className={`btn ${activeTab === 'submitted' ? 'btn-primary' : 'btn-outline-primary'}`}
                    style={{ minWidth: '120px', flex: '1 1 auto' }}
                    onClick={() => setActiveTab('submitted')}
                  >
                    Submitted Artworks
                  </button>
                </div>


                {/* Content based on selected tab */}
                <div>
                  {activeTab === 'deposit' && (
                    <div>
                      <NftDepositList />
                    </div>
                  )}
                  {activeTab === 'withdraw' && (
                    <div>
                      <NftWithdrawList />
                    </div>
                  )}
                  {activeTab === 'submitted' && (
                    <div>
                      <NftSubmittedList />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* first row */}
                <div className="row justify-content-around">
                  {[
                    { title: "ETH:", subtext: "BALANCE", icon: faEthereum, value: userData.balance ? (userData.balance).toFixed(2) : 0.00 || 0, link: '/deposit' },
                    { title: "ETH:", subtext: "PROFIT", icon: faExchangeAlt, value: userData.returns ? (userData.returns).toFixed(2) : 0.00 || 0, link: '/deposit' },
                    { title: "Account Status", subtext: userData.isUserActive ? 'VERIFIED' : 'NOT VERIFIED', icon: faUser, link: '/profile' },
                  ].map(({ title, subtext, icon, value, link }, index) => (
                    <div key={index} className="col-lg-4 mt-2">
                      <Link to={link} style={{ textDecoration: "none" }}>
                        <div className="card bg-secondary" style={{ ...accBox, cursor: "pointer" }}>
                          <div className="card-body">
                            <div className="d-flex align-items-start justify-content-between">
                              <div className="d-block text-start">
                                <div className="d-flex" style={accHead}>
                                  <span style={{ maxWidth: "115px", display: "inline-block" }} className="fw-bold">
                                    {title}
                                  </span>

                                  {loading ? "---" : <span className="mx-2">{value}</span>}
                                </div>
                                <span className="clearFont">{subtext}</span>
                              </div>
                              <div style={iconStyle}>
                                <FontAwesomeIcon icon={icon} style={{ fontSize: "26px", color: "white" }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>


  );
}

export default Home;