import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useMatch, useLocation, useResolvedPath, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { Navbar, Nav, Offcanvas, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars, faPlus, faHome, faInfoCircle, faReceipt, faSignOutAlt, faBolt, faUser, faMobileAlt, faSignal, faTv, faPlug, faCompass, faShoppingCart, faHeart, faShoppingBag, faCogs, faWallet, faGaugeHigh, faUnlockKeyhole, faUserCheck, faRightLeft,
  faListCheck, faArrowRightToBracket, faArrowUpFromBracket,
  faShapes, faBagShopping, faLink, faShieldHalved
} from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import Context from '../Context';
import { useUserContext } from './UserRoleContext';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Navigation() {
  const [showNav, setShowNav] = useState(false);
  const { user, setUser } = useContext(Context);
  const { userData, currentUser } = useUserContext();
  const location = useLocation();
  const history = useNavigate();

  const [show, setShow] = useState(false);
  // const navigate = useNavigate();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);




  const logout = () => {
    const isLogout = window.confirm('Do you want to log out ?');
    if (isLogout) {
      const auth = getAuth();
      signOut(auth)
        .then(() => {
          console.log('User signed out');
          // You can also redirect the user or perform other actions upon sign-out.
        })
        .catch((error) => {
          console.error('Error signing out:', error);
        });
      // remove local storage.
      localStorage.removeItem('auth');
      // redirect to login page.
      history('/login');
    }
  }
  const initializeTooltip = (element) => {
    if (element) {
      const tooltip = new window.bootstrap.Tooltip(element, {
        placement: 'top', // Adjust placement as needed
        title: element.title,
      });
    }
  };


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



  const menuIconStyle = {
    backgroundColor: 'transparent',
    color: '#262A36',
    padding: '10px',
    borderRadius: '12px',
    fontSize: '24px', // Adjust size as needed
  };


  const getPosition = () => {
    if (window.innerWidth < 576) {
      return { left: "11%", transform: "translate(10%, -50%)" }; // Extra small screens (mobile)
    } else if (window.innerWidth < 768) {
      return { left: "12%", transform: "translate(10%, -50%)" }; // Small screens (larger mobile)
    } else if (window.innerWidth < 992) {
      return { left: "15%", transform: "translate(-50%, -50%)" }; // Medium screens (tablets)
    }
    return { left: "26.5%", transform: "translate(-24%, -50%)" }; // Large screens (desktops)
  };

  const getTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Dashboard";
      case "/login":
        return "Login";
      case "/signup":
        return "Sign Up";
      case "/withdraw":
        return "Withdraw";
      case "/transactions":
        return "Transactions";
      case "/deposit":
        return "Deposit";
      case "/upload":
        return "Upload Art";
      case "/mints":
        return "Minted Art";
      case "/buy-project":
        return "Buy Project";
      case "/link-wallet":
        return "Link Wallet";
      case "/my-projects":
        return "My Projects";
      case "/profile":
        return "Profile";
      case "/admin":
        return "Admin Panel";
      default:
        return "DeepSea"; // Default title
    }
  };



  return (
    <>
      <ToastContainer />
      {showNav && (
        <div className="backdrop"></div>
      )}

      {/* Navbar with toggle button */}
      <Navbar
        variant="dark"
        expand="lg"
        style={{ minHeight: "60px" }}
        className={`scrolled fixed-top shadow-blur ${location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/forgot-password" ? "d-none" : ""
          }`}
      >
        {/* Navbar Toggle (Hamburger) */}
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          className="d-lg-none"
          onClick={handleShow}
          style={{
            display: "flex",
            alignItems: "center",
            border: "none",
            boxShadow: "none",
            color: "#555555"
          }}
        >
          <FontAwesomeIcon icon={faBars} style={{ fontSize: "24px" }} />
        </Navbar.Toggle>

        {/* Dynamic Title */}
        <h3
          className="text-dark"
          style={{
            position: "absolute",
            top: "50%",
            ...getPosition(), // Dynamically apply styles
          }}
        >
          {getTitle()} {/* Dynamic title based on route */}
        </h3>

        {/* Right-side Buttons */}
        <div className="ms-auto me-4 d-flex align-items-center">
          {/* Create New Project Button */}
          <Button
            as={Link} to="/upload"
            variant="success"
            className="d-flex align-items-center me-3"
            style={{
              backgroundColor: "#28A745", // Green shade
              border: "none",
              padding: "6px 12px",
            }}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2 ms-2" />
            <span className="d-none d-lg-inline">Create New Project</span>
          </Button>

          {/* Profile Button */}
          <Button
            as={Link} to="/profile"
            variant="light"
            className="d-flex justify-content-center align-items-center"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#ccc", // Light gray
              border: "none",
            }}
          >
            <FontAwesomeIcon icon={faUser} />
          </Button>
        </div>
      </Navbar>

      {/* Offcanvas for small screens */}
      <Offcanvas show={show} onHide={handleClose} placement="start" className={location.pathname === '/login' || location.pathname === '/signup' || location.pathname === "/forgot-password" ? 'd-none' : 'd-lg-none offcanvas'}>
        <Offcanvas.Header className='offcanvas-header'>
          {/* <Offcanvas.Title>G<span style={{color: '#E7772F'}}>o</span> SUBME</Offcanvas.Title> */}
          <img className="img-fluid" src="asdf.PNG" width="40px" height="40px" alt="Logo" />
          <span className="gradient-text">DeepSea</span>
        </Offcanvas.Header>
        <Offcanvas.Body className='offcanvas-body' style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flexGrow: 1 }}>
            <Nav className="flex-column">
              <Nav.Link as={Link} to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faGaugeHigh} className={`nav-icon ${location.pathname === '/' ? 'active' : ''}`} />
                Dashboard
              </Nav.Link>
              <Nav.Link as={Link} to="/upload" className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faArrowUpFromBracket} className={`nav-icon ${location.pathname === '/upload' ? 'active' : ''}`} />
                Upload Artwork
              </Nav.Link>

              <Nav.Link as={Link} to="/mints" className={`nav-link ${location.pathname === '/mints' ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faShapes} className={`nav-icon ${location.pathname === '/mints' ? 'active' : ''}`} />
                Minted Artworks
              </Nav.Link>
              <Nav.Link as={Link} to="/deposit" className={`nav-link ${location.pathname === '/deposit' ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faArrowRightToBracket} className={`nav-icon ${location.pathname === '/deposit' ? 'active' : ''}`} />
                Deposit
              </Nav.Link>
              <Nav.Link as={Link} to="/withdraw" className={`nav-link ${location.pathname === '/withdraw' ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faRightLeft} className={`nav-icon ${location.pathname === '/withdraw' ? 'active' : ''}`} />
                Withdraw
              </Nav.Link>
              <Nav.Link as={Link} to="/buy-project" className={`nav-link ${location.pathname === '/buy-project' ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faBagShopping} className={`nav-icon ${location.pathname === '/buy-project' ? 'active' : ''}`} />
                Buy Artwork
              </Nav.Link>
              <Nav.Link as={Link} to="/transactions" className={`nav-link ${location.pathname === '/transactions' ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faListCheck} className={`nav-icon ${location.pathname === '/transactions' ? 'active' : ''}`} />
                Transaction History
              </Nav.Link>
              <Nav.Link as={Link} to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faUser} className={`nav-icon ${location.pathname === '/profile' ? 'active' : ''}`} />
                Profile
              </Nav.Link>
              <Nav.Link onClick={logout} className="nav-link">
                <FontAwesomeIcon icon={faSignOutAlt} className="nav-icon" />
                Logout
              </Nav.Link>
            </Nav>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      <div className={`sidebar ${location.pathname === '/login' || location.pathname === '/signup' || location.pathname === "/forgot-password" ? 'd-none' : 'd-none d-lg-block'}`}>
        <Navbar.Brand href="#home" className="offcanvas-header">
          <img className="img-fluid" src="asdf.PNG" width="40px" height="40px" alt="Logo" />
          <span className="gradient-text">DeepSea</span>
        </Navbar.Brand>

        <div style={{ flexGrow: 1 }}>
          <Nav className="flex-column">
            <Nav.Link as={Link} to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              <FontAwesomeIcon icon={faGaugeHigh} className={`nav-icon ${location.pathname === '/' ? 'active' : ''}`} />
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/upload" className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}>
              <FontAwesomeIcon icon={faArrowUpFromBracket} className={`nav-icon ${location.pathname === '/upload' ? 'active' : ''}`} />
              Upload Artwork
            </Nav.Link>

            <Nav.Link as={Link} to="/mints" className={`nav-link ${location.pathname === '/mints' ? 'active' : ''}`}>
              <FontAwesomeIcon icon={faShapes} className={`nav-icon ${location.pathname === '/mints' ? 'active' : ''}`} />
              Minted Artworks
            </Nav.Link>
            <Nav.Link as={Link} to="/deposit" className={`nav-link ${location.pathname === '/deposit' ? 'active' : ''}`}>
              <FontAwesomeIcon icon={faArrowRightToBracket} className={`nav-icon ${location.pathname === '/deposit' ? 'active' : ''}`} />
              Deposit
            </Nav.Link>
            <Nav.Link as={Link} to="/withdraw" className={`nav-link ${location.pathname === '/withdraw' ? 'active' : ''}`}>
              <FontAwesomeIcon icon={faRightLeft} className={`nav-icon ${location.pathname === '/withdraw' ? 'active' : ''}`} />
              Withdraw
            </Nav.Link>
            <Nav.Link as={Link} to="/buy-project" className={`nav-link ${location.pathname === '/buy-project' ? 'active' : ''}`}>
              <FontAwesomeIcon icon={faBagShopping} className={`nav-icon ${location.pathname === '/buy-project' ? 'active' : ''}`} />
              Buy Artwork
            </Nav.Link>
            <Nav.Link as={Link} to="/transactions" className={`nav-link ${location.pathname === '/transactions' ? 'active' : ''}`}>
              <FontAwesomeIcon icon={faListCheck} className={`nav-icon ${location.pathname === '/transactions' ? 'active' : ''}`} />
              Transaction History
            </Nav.Link>
            <Nav.Link as={Link} to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
              <FontAwesomeIcon icon={faUser} className={`nav-icon ${location.pathname === '/profile' ? 'active' : ''}`} />
              Profile
            </Nav.Link>
            <Nav.Link onClick={logout} className="nav-link">
              <FontAwesomeIcon icon={faSignOutAlt} className="nav-icon" />
              Logout
            </Nav.Link>
          </Nav>
        </div>

      </div>

    </>
  );
}

export default Navigation;
