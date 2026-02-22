// import useRef and useContext
import { useRef, useContext, useEffect, useState } from "react";
// import Context to get shared data from React context.
import Context from "../Context";
// import firebase authentication and real time database.
import { auth, db, realTimeDb } from "../firebase";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, onValue, orderByChild, equalTo, query, orderByValue, child } from 'firebase/database';
// import validator to validate user's credentials.
import validator from "validator";
// import custom componnets.
import withModal from "./Modal";
import SignUp from "./SignUp";
// import history
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from './Loading';
import ForgotPassword from "./ForgotPasswordModal";

function Login(props) {
  // get shared data from context.
  const [isLoading, setIsLoading] = useState(false);
  // get toggle modal function from withModal - higher order component.
  const { toggleModal } = props;
  // create ref to get user's email and user's password.
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [checkPassword, setCheckPassword] = useState('');


  const history = useNavigate();

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * validate user's credentials.
   * @param {*} email 
   * @param {*} password 
   * @returns 
   */
  const isUserCredentialsValid = (email, password) => {
    return validator.isEmail(email) && password;
  };

  /**
   * login
   */
  const login = () => {
    // show loading indicator.
    setIsLoading(true);
    // get the user's creadentials.
    const cleanedEmail = emailRef.current.value;
    const email = cleanedEmail.trim();
    const cleanedPassword = passwordRef.current.value;
    const password = cleanedPassword.trim();
    if (isUserCredentialsValid(email, password)) {
      // if the user's credentials are valid, call Firebase authentication service.
      signInWithEmailAndPassword(auth, email, password).then((userCredential) => {


        const userEmail = userCredential.user.email;
        const userID = userCredential.user.uid;
        const dbRef = ref(realTimeDb, `users/${userID}`);
        const ID = auth.currentUser.uid;
        localStorage.setItem('auth', JSON.stringify(ID));
        // save authenticated user to context.
        // hide loading.
        setIsLoading(false);
        // redirect to home page.
        history('/');
        window.location.reload(); // This refreshes the page



        // end of then promise
      })
        .catch((error) => {
          // hide loading indicator.
          setIsLoading(false);
          if (isOnline) {
            setIsLoading(false);
            toast.warning(`Your username or password is not correct`, {
              position: toast.POSITION.TOP_CENTER,
              className: "custom-toast",
            });
          }
          else {
            toast.error(`Check your internet connection`, {
              position: toast.POSITION.TOP_CENTER,
              className: "custom-toast",
            });
          }
        });
    } else {
      // hide loading indicator.
      setIsLoading(false);
      if (isOnline) {
        setIsLoading(false);
        toast.warning(`Your username or password is not correct`, {
          position: toast.POSITION.TOP_CENTER,
          className: "custom-toast",
        });
      }
      else {
        toast.error(`Check your internet connection`, {
          position: toast.POSITION.TOP_CENTER,
          className: "custom-toast",
        });
      }
    }
  };

  return (
    // main login
    <>
      <div className="signup">
        <ToastContainer />
        <div className="signup__content">
          <div className="signup__container d-flex align-items-center justify-content-between p-2">
            <div className="signup__title">Login</div>
          </div>
          <div className="signup__subtitle"></div>
          <div className="signup__form">
            <input
              type="text"
              placeholder="Email"
              ref={emailRef}
            />
            <div className="password-container">
              <input
                id="password"
                className="password-input"
                placeholder="Password"
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                onChange={(e) => setCheckPassword(e.target.value)}
              />
              {checkPassword && (
                <button className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-slash" viewBox="0 0 16 16">
                      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486z" />
                      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
                      <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16">
                      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0" />
                    </svg>
                  )}
                </button>
              )}
            </div>

            <button type="submit" className="signup__btn" onClick={login}>
              Login
            </button>
            <div className="d-flex justify-content-end mb-3 mt-3">
              <button
                type="button"
                className="remove-default-btn-clear text-primary text-end"
                onClick={() => history('/forgot-password')}
              >
                Forgot Password
              </button>
            </div>


            <span className="login__signup" onClick={() => toggleModal(true)}>Create Account</span>
          </div>
        </div>
        {isLoading && <Loading />}
      </div>
    </>
  );
}

export default withModal(SignUp)(Login);