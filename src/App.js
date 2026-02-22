import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Context from './Context';
import ErrorBoundary from './components/ErrorBoundary';
import { UserProvider } from './components/UserRoleContext';
import Home from './components/Home';
import Login from './components/Login';
import Loading from './components/Loading';
import PrivateAdmin from './components/PrivateAdmin';
import PrivateRoute from './components/PrivateRoute';
import PrivateActivate from './components/PrivateActivate';
import PrivateBalance from './components/PrivateBalance';
import PrivateTx from './components/PrivateTx';
import PrivateLinkWallet from './components/PrivateLinkWallet';
import PrivateProjects from './components/PrivateProjects';
import PrivateUpload from './components/PrivateUpload';
import PrivateMinted from './components/PrivateMinted';
import PrivateBuy from './components/PrivateBuy';
import SignUp from './components/SignUp';
import Navigation from './components/Navbar';
import WalletBalance from './components/WalletBalance';
import PaymentModal from './components/PaymentModal';
import TransactionList from './components/Transactions';
import PrivateDashboard from './components/PrivateDashboard';
import Dashboard from './components/dashboard';
import LinkWallet from './components/link-wallet';
import MyProjects from './components/my-projects';
import Upload from './components/upload-nft';
import Minted from './components/minted-nft';
import Buy from './components/buy-nft';
import UserManagement from './components/UserManagement';
import ForgotPassword from './components/ForgotPasswordModal';
import ToastProvider from './components/ToastProvider';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const hasPaid = true;


  const initAuthUser = () => {
    const authenticatedUser = localStorage.getItem('auth');
    if (authenticatedUser) {
      setUser(JSON.parse(authenticatedUser));
    }
  };
  return (
    <Context.Provider value={{ isLoading, setIsLoading }}>
      <UserProvider>
        {hasPaid ? (
          <Router>
            <ErrorBoundary>
              {/* <ToastProvider> */}
              <Navigation />
              <Routes>
                <Route exact path="/" element={<PrivateRoute exact path="/" element={<Home />} />} />
                <Route exact path="/login" element={<Login />} />
                <Route exact path="/signup" element={<SignUp />} />
                <Route exact path="/forgot-password" element={<ForgotPassword />} />
                <Route exact path="/withdraw" element={<PrivateBalance exact path="/withdraw" element={<WalletBalance />} />} />
                <Route exact path="/transactions" element={<PrivateTx exact path="/transactions" element={<TransactionList />} />} />
                <Route exact path="/deposit" element={<PrivateActivate exact path="/deposit" element={<PaymentModal />} />} />
                <Route exact path="/upload" element={<PrivateUpload exact path="/upload" element={<Upload />} />} />
                <Route exact path="/mints" element={<PrivateMinted exact path="/mints" element={<Minted />} />} />
                <Route exact path="/buy-project" element={<PrivateBuy exact path="/buy-project" element={<Buy />} />} />
                <Route exact path="/link-wallet" element={<PrivateLinkWallet exact path="/link-wallet" element={<LinkWallet />} />} />
                <Route exact path="/my-projects" element={<PrivateProjects exact path="/my-projects" element={<MyProjects />} />} />
                <Route exact path="/profile" element={<PrivateDashboard exact path="/profile" element={<Dashboard />} />} />
                <Route exact path="/admin" element={<PrivateAdmin exact path="/admin" element={<UserManagement />} />} />
              </Routes>
              {/* </ToastProvider> */}
            </ErrorBoundary>
            {isLoading && <Loading />}
          </Router>
        ) : (
          <div>Service is no longer active</div>
        )}
      </UserProvider>
    </Context.Provider>
  );

}

export default App;
