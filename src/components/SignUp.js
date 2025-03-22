// import useRef, useContext
import { useRef, useContext, useEffect, useState } from "react";
// import Context to get shared data.
import Context from "../Context";
// import validator to validate user's information.
import validator from "validator";
// import firebase authentication.
import { auth, realTimeDb, db } from "../firebase";
import {getAuth,createUserWithEmailAndPassword} from 'firebase/auth'
import { ref, set} from 'firebase/database'
// import uuid to generate id for users.
import { v4 as uuidv4 } from "uuid";
import { getFirestore, getDoc, setDoc, doc, updateDoc, collection, query, where, getDocs, increment } from 'firebase/firestore';
import { ToastContainer, toast } from "react-toastify";
import { getStorage, ref as Ref, getDownloadURL, listAll } from "firebase/storage";
import "react-toastify/dist/ReactToastify.css";
import {useLocation} from 'react-router-dom';
import Loading from './Loading';
import Select from 'react-select';
import fetchCurrencies from "./fetchCurrencies";
import fetchCountries from "./fetchCountries";


function SignUp(props) {
  // get toggleModal functin from higher order components.
  const { toggleModal } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [avatars, setAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [checkPassword, setCheckPassword] = useState('');
  const [refParam, setRefParam] = useState('');
  const [loading, setLoading] = useState(true); // Loading state
  
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [country, setCountry] = useState("");

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

  const [currencyOptions, setCurrencyOptions] = useState([]);

  useEffect(() => {
      const fetchCurrencyData = async () => {
          const currencies = await fetchCurrencies();
          setCurrencyOptions(currencies);
      };

      fetchCurrencyData();
  }, []);

  const handleCurrencyChange = (selectedOption) => {
      // Save selectedOption.value to your database
      setCurrencySymbol(selectedOption.value);
  };

  // country choose

  const [countryOptions, setCountryOptions] = useState([]);

  useEffect(() => {
    const fetchCountryData = async () => {
        try {
            setLoading(true); // Set loading to true before fetching
            const countries = await fetchCountries();
            setCountryOptions(countries);
        } catch (error) {
            console.error("Error fetching countries:", error);
        } finally {
            setLoading(false); // Set loading to false after fetching
        }
    };

    fetchCountryData();
}, []);

const handleCountryChange = (selectedOption) => {
  setCountry(selectedOption.value);
  // console.log("Selected country:", selectedOption.value);
};

  const location = useLocation();

  // Extract referral code from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const referralCode = params.get('ref');
    
    // Associate referral code with the sign-up process
    // This could involve storing the referral code in state or passing it to an API call
    setRefParam(referralCode);
  }, [location.search]);

  // create refs to get user's email, user's password, user's confirm password.
  const fullNameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const roleRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const referralRef = useRef(null);
  const agentRef = useRef(null);


  const Client = 'client';
  const Admin = 'admin';

  /**
   * generate random avatar for demo purpose
   * @returns 
   */
  useEffect(() => {
    const fetchAvatars = async () => {
      const storage = getStorage();
      const avatarsRef = Ref(storage, 'avatars');

      try {
        const result = await listAll(avatarsRef);
        const downloadURLs = await Promise.all(
          result.items.map(async (item) => {
            const url = await getDownloadURL(item);
            return url;
          })
        );

        setAvatars(downloadURLs);

        if (downloadURLs.length > 0) {
          // Select a random avatar from the list
          const randomIndex = Math.floor(Math.random() * downloadURLs.length);
          setSelectedAvatar(downloadURLs[randomIndex]);
        }
      } catch (error) {
        console.error('Error fetching avatars:', error);
      }
    };

    fetchAvatars();
  }, []); // Run once when the component mounts


  /**
   * validate user's informatin.
   * @param {*} param0 
   * @returns 
   */
  const isSignupValid = ({ fullName, email, phone, role, password, confirmPassword, countryCheck, symbolCheck }) => {
    if (validator.isEmpty(fullName)){
      // alert("Please input your full name");
      toast.warning("Please input your full name", {
        position: toast.POSITION.TOP_CENTER,
      });
      return false
    }
    if (!validator.isEmail(email)) {
      // alert("Please input your email");
      toast.warning("Please input a valid email", {
        position: toast.POSITION.TOP_CENTER,
      });
      return false;
    }
    if (!validator.isMobilePhone(phone)) {
      // alert("Please input a valid phone number");
      toast.warning("Please input a valid phone number", {
        position: toast.POSITION.TOP_CENTER,
      });
      return false;
    }
    if (validator.isEmpty(role)) {
      // alert("Please select field");
      toast.warning("Please select field", {
        position: toast.POSITION.TOP_CENTER,
      });
      return false;
    }
    if (countryCheck.trim() === '') {
      // alert("Please select field");
      toast.warning("Please select country", {
        position: toast.POSITION.TOP_CENTER,
      });
      return false;
    }
    if (symbolCheck.trim() === '') {
      // alert("Please select field");
      toast.warning("Please select currency", {
        position: toast.POSITION.TOP_CENTER,
      });
      return false;
    }
    if (validator.isEmpty(password) || !validator.isLength(password, {min: 6})) {
      // alert("Please input your password. You password must have at least 6 characters");
      toast.warning("Please input your password. Your password must have at least 6 characters", {
        position: toast.POSITION.TOP_CENTER,
      });
      return false;
    }
    if (validator.isEmpty(confirmPassword)) {
      // alert("Please input your confirm password");
      toast.warning("Please input your confirm password", {
        position: toast.POSITION.TOP_CENTER,
      });
      return false;
    }
    if (password !== confirmPassword) {
      // alert("Confirm password and password must be the same");
      toast.warning("Confirm password and password must be the same", {
        position: toast.POSITION.TOP_CENTER,
      });
      return false;
    }
    return true;
  };

  // Helper function to fetch data from API
  const fetchAPI = async (url, options = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
    }
    return response.json();
  };

  // Helper function to create user in Firebase
  const registerWithFirebase = async (email, password) => {
    const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
    return userCredentials.user;
  };

  // Helper function to create user in backend
  const createUserInBackend = async (payLoad) => {
    return await fetchAPI('https://broker-app-4xfu.onrender.com/api/createUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payLoad),
    });
  };

  // Helper function to update referrer data
  const updateReferrerData = async (referrerID) => {
    const userDetails = { userId: referrerID };
    return await fetchAPI('https://broker-app-4xfu.onrender.com/api/updateInfo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userDetails),
    });
  };

  // Helper function to check if referral code exists
  const checkReferralCode = async (referralCode) => {
    const data = await fetchAPI(`https://broker-app-4xfu.onrender.com/api/checkUserReferral/${referralCode}`);
    return data;
  };

  const checkAgentCode = async (agentCode) => {
    const data = await fetchAPI(`https://broker-app-4xfu.onrender.com/api/checkAgentCode/${agentCode}`);
    return data;
  };


  // Helper function to handle user creation
  const handleUserCreation = async (user, payLoad) => {
    await createUserInBackend(payLoad);
    localStorage.setItem('new', true);
    toast.success(`${user.email} was created successfully! Please sign in with your created account`, {
      position: toast.POSITION.TOP_CENTER,
    });
    setIsLoading(false);
    toggleModal(false);
  };

  const handleInput = (e) => {
    // Allow only numbers
    const value = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
    e.target.value = value; // Set the cleaned value back to the input
  };

  // Main signup function
  // Main signup function
  const signup = async () => {
    // Extract and clean form data
    const formData = {
      fullName: fullNameRef.current.value.trim(),
      email: emailRef.current.value.trim(),
      phone: phoneRef.current.value.trim(),
      role: roleRef.current.value.trim(),
      password: passwordRef.current.value.trim(),
      confirmPassword: confirmPasswordRef.current.value.trim(),
      referralCode: referralRef.current.value.trim(),
      agentCode: agentRef.current.value.trim(),
      countryCheck: country || '',
      symbolCheck: currencySymbol || '',
    };
  
    // Validate signup data
    if (!isSignupValid(formData)) {
      return;
    }
  
    setIsLoading(true);
  
    try {
      const createUserPayload = async (user) => {
        const userID = user.uid;
        const userReferralCode = uuidv4();
        return {
          avatar: selectedAvatar, // Ensure selectedAvatar is defined
          email: formData.email,
          name: formData.fullName,
          userId: userID,
          number: formData.phone,
          role: formData.role,
          balance: 0,
          deposit: 0,
          referralsBalance: 0,
          isUserActive: false,
          referralCode: userReferralCode,
          referredBy: formData.referralCode ? (await checkReferralCode(formData.referralCode)).referrerInfo.userId : 'none',
          agentCode: formData.agentCode || 'none',
          hasPaid: false,
          referralRedeemed: false,
          referredUsers: 0,
          currencySymbol: formData.symbolCheck,
          country: formData.countryCheck,
          returns: 0,
        };
      };
  
      let referralData = null;
      if (formData.referralCode) {
        // Process referral signup
        referralData = await checkReferralCode(formData.referralCode);
  
        if (referralData.status === 'false') {
          throw new Error(referralData.message || 'Invalid Referral Code');
        }
      }
  
      let agentCodeData = null;
      if (formData.agentCode) {
        // Process agent code
        agentCodeData = await checkAgentCode(formData.agentCode);
  
        if (agentCodeData.status === 'false') {
          throw new Error(agentCodeData.message || 'Invalid Agent Code');
        }
      }
  
      const user = await registerWithFirebase(formData.email, formData.password);
      const payLoad = await createUserPayload(user);
  
      // Create user in backend
      await handleUserCreation(user, payLoad);
  
      // Update referrer data if referral code exists
      if (referralData && referralData.status === 'true') {
        await updateReferrerData(referralData.referrerInfo.userId);
      }
  
    } catch (error) {
      console.error('Signup Error:', error.message);
      setIsLoading(false);
  
      const errorMessage = error.message || 'An error occurred';
      if (error.code === 'auth/email-already-in-use') {
        toast.error(`Cannot create your account, ${formData.email} already exists, please try again!`, {
          position: toast.POSITION.TOP_CENTER,
        });
      } else if (!isOnline) {
        toast.error('Check your internet connection', {
          position: toast.POSITION.TOP_CENTER,
        });
      } else {
        toast.error(errorMessage, {
          position: toast.POSITION.TOP_CENTER,
        });
      }
    }
  };
  
  



  return (
    
    <div className="signup">
      <ToastContainer />
      <div className="signup__content">
      <p className="fw-bold font-italic m-2 text-end">Minter<span className="bg-theme border-theme text-white rounded-pill">Fx</span>Pro</p>
        <div className="signup__container">
          <div className="signup__title text-theme">Sign Up</div>
          <div className="signup__close">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" alt="close"
          onClick={() => toggleModal(false)} height="20" fill="currentColor" className="bi bi-x-lg" viewBox="0 0 16 16">
           <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
          </svg>
          </div>
        </div>
        <div className="signup__subtitle"></div>
        <div className="signup__form">
        <input type="text" placeholder="Username" ref={fullNameRef} />
          <input type="text" placeholder="Email" ref={emailRef} />
          <input
            type="text"
            placeholder="Phone"
            ref={phoneRef}
            onInput={handleInput} // Restrict input to numbers
          />
          <select ref={roleRef} defaultValue={Client} >
            <option value={Client}>Stay Updated</option>
            <option value={Client}>Don't receive updates</option>
          </select>
          {loading ? (
                // Render a spinner while loading
                <div className="spinner-container">
                    <div className="spinner"></div>
                    <p>Loading countries...</p>
                </div>
            ) : (
                // Render the Select component once countries are loaded
                <Select
                    defaultValue={country}
                    className="mb-3"
                    options={countryOptions}
                    onChange={handleCountryChange}
                    placeholder="Select a country"
                />
            )}
          <Select
            defaultValue={currencySymbol}
            className="mb-3"
            options={currencyOptions}
            onChange={handleCurrencyChange}
            placeholder="Select a currency"
        />
          <input type="text" defaultValue={refParam || ''} placeholder="Referral code (optional)" ref={referralRef} />
          <input type="text" placeholder="Agent Code (Only If Applies - Optional)" ref={agentRef} />
          <div className='d-flex' style={{ position: 'relative' }}>
          <input
            id="password"
            placeholder="Password"
            ref={passwordRef} 
            type={showPassword ? 'text' : 'password'}
            onChange={(e) => setCheckPassword(e.target.value)}
          />
          {checkPassword && (
            <button className='p-btn' onClick={()=> setShowPassword(!showPassword)}>{showPassword ? (
            <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-slash" viewBox="0 0 16 16">
              <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486z"/>
              <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
              <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708"/>
            </svg>
            </>
          ) : (
            <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16">
              <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
              <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
            </svg>
            </>
          )}</button>
          )}
          
          </div>
            {/* confirm password field */}

            <div className='d-flex' style={{ position: 'relative' }}>
          <input
            id="password"
            placeholder="Confirm Password"
            ref={confirmPasswordRef}
            type={showPassword ? 'text' : 'password'}
            onChange={(e) => setCheckPassword(e.target.value)}
          />
          {checkPassword && (
            <button className='p-btn' onClick={()=> setShowPassword(!showPassword)}>{showPassword ? (
            <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-slash" viewBox="0 0 16 16">
              <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486z"/>
              <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
              <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708"/>
            </svg>
            </>
          ) : (
            <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16">
              <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
              <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
            </svg>
            </>
          )}</button>
          )}
          
          </div>
          <button className="signup__btn" onClick={signup}>
            
            Sign Up
          </button>
          
        </div>
      </div>
      {isLoading && <Loading />}
    </div>
  );
}

export default SignUp;