import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ScreenLoad from "./screenLoad";

const UserContext = createContext(null);

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({});
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [isLoading, setIsLoading] = useState(true);

  const loadingTimeout = useRef(null);
  const retryTimeout = useRef(null);
  const isMounted = useRef(true);

  // new: manage retry counts and abort controller
  const retryCount = useRef(0);
  const maxRetries = useRef(3);
  const abortController = useRef(null);

  const fetchUserData = useCallback(async (userId) => {
    if (!userId) return;

    // only show the full-screen loader on the *first* attempt
    if (retryCount.current === 0) {
      setIsLoading(true);
    }

    // abort any previous fetch
    if (abortController.current) {
      try { abortController.current.abort(); } catch (e) { }
    }
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    try {
      // show "slow network" toast after 15s only if still pending
      loadingTimeout.current = setTimeout(() => {
        if (isMounted.current) {
          // if we've already exhausted retries and failed, it's okay to show this
          setIsLoading(false);
          toast.error("Check your internet connection and refresh the page.", {
            className: "custom-toast",
          });
        }
      }, 15000);

      const response = await fetch(`https://nft-broker-mroz.onrender.com/api/userDetail/${userId}`, { signal });
      // if fetch was aborted, this will either throw or be skipped; handle below
      if (!response.ok) {
        // For some statuses (e.g., 404) it doesn't make sense to keep retrying.
        if (response.status === 404 || response.status === 400) {
          clearTimeout(loadingTimeout.current);
          retryCount.current = 0;
          if (isMounted.current) {
            setIsLoading(false);
            toast.error("User data not found.", { className: "custom-toast" });
          }
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (isMounted.current) {
        setUserData({
          avatar: data.avatar,
          email: data.email,
          fullName: data.name,
          userID: data.userId,
          agentID: data.agentID,
          agentCode: data.agentCode,
          phoneNo: data.number,
          role: data.role,
          isUserActive: data.isUserActive,
          hasPaid: data.hasPaid,
          deposit: data.deposit,
          currencySymbol: data.currencySymbol,
          country: data.country,
          balance: data.balance,
          referralsBalance: data.referralsBalance,
          referredUsers: data.referredUsers,
          referralCode: data.referralCode,
          returns: data.returns,
        });
      }

      // success -> reset retry state & clear timers
      retryCount.current = 0;
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
        retryTimeout.current = null;
      }
      clearTimeout(loadingTimeout.current);
    } catch (error) {
      // ignore abort errors
      if (error && error.name === "AbortError") {
        return;
      }

      console.error("Error fetching user data:", error);

      // schedule a retry only up to maxRetries
      if (isMounted.current) {
        retryCount.current += 1;
        if (retryCount.current <= maxRetries.current) {
          // do retries in background (don't re-show the full-screen loader)
          retryTimeout.current = setTimeout(() => {
            fetchUserData(userId);
          }, 5000);
        } else {
          // give up after maxRetries
          retryCount.current = 0;
          if (isMounted.current) {
            setIsLoading(false);
            toast.error("Failed to fetch user data. Please check your connection or try again later.", {
              className: "custom-toast",
            });
          }
        }
      }
    } finally {
      // only hide loader if this was the initial attempt (not between retries)
      if (isMounted.current && retryCount.current === 0) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // reset retries whenever a new user is seen
        retryCount.current = 0;
        setCurrentUser(user);
        // no need to await here; start the fetch
        fetchUserData(user.uid);
      } else {
        setCurrentUser(null);
        setUserData({});
        setIsLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
      // abort any in-flight fetch
      if (abortController.current) {
        try { abortController.current.abort(); } catch (e) { }
      }
    };
  }, [fetchUserData]);

  return (
    <UserContext.Provider value={{ userData, setUserData, currentUser, isLoading, setIsLoading }}>
      {isLoading && <ScreenLoad />}
      {children}
      <ToastContainer />
    </UserContext.Provider>
  );
};
