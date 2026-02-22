import React, { useState, useContext, useEffect } from 'react';
import { useUserContext } from './UserRoleContext';
import { doc, getDoc, updateDoc, getFirestore, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ToastContainer, toast } from "react-toastify";
import myRedImage from '../red-loader.gif';
import "react-toastify/dist/ReactToastify.css";
import { v4 as uuidv4 } from "uuid";
import axios from 'axios';
import Loading from './Loading';


const PaymentModal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const user = auth.currentUser;
  const { userData, currentUser } = useUserContext();
  const userID = userData.userId;
  const userEmail = userData.email;
  const userBalance = userData.balance;
  const [isBtnLoading, setIsBtnLoading] = useState(false);
  const [selectedFundValue, setSelectedFundValue] = useState('');
  const [selectedStarterValue, setSelectedStarterValue] = useState('');
  const [isFundBtnLoading, setIsFundBtnLoading] = useState(false);
  const [fundAddress, setFundAddress] = useState('');
  const [fundAmount, setFundAmount] = useState(null);

  const [paymentAddress, setPaymentAddress] = useState('');
  const [goldPaymentAddress, setGoldPaymentAddress] = useState('');
  const [professionalPaymentAddress, setProfessionalPaymentAddress] = useState('');
  const [expertPaymentAddress, setExpertPaymentAddress] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  const getUniqueId = uuidv4();

  const generatePaymentAddress = async (price) => {
    setIsBtnLoading(true);
    setIsLoading(true);
    try {
      if (selectedStarterValue.trim() !== '') {
        const data = {
          price_amount: price,
          price_currency: 'usd',
          pay_currency: selectedStarterValue,
          ipn_callback_url: 'https://nft-broker-mroz.onrender.com/api/crypto-callback',
          order_id: getUniqueId,
          order_description: 'Crypto Deposit'
        };

        const response = await axios.post('https://nft-broker-mroz.onrender.com/api/payment', { data });

        const reference = uuidv4();
        if (price === 10000) {
          setExpertPaymentAddress(response.data.pay_address);
        }
        else if (price === 5000) {
          setProfessionalPaymentAddress(response.data.pay_address);
        }
        else if (price === 2000) {
          setGoldPaymentAddress(response.data.pay_address);
        }
        else if (price === 300) {
          setPaymentAddress(response.data.pay_address);
        }

        saveBtcTransactionData(reference, userEmail, price, userID, 'pending', response.data.payment_id);
        saveTempCryptoData(userID, response.data.payment_id, response.data.payment_status, response.data.pay_address, response.data.price_amount, response.data.order_description)
        setIsBtnLoading(false);
        setIsLoading(false);
        setErrorMessage('');
      }
      else {
        setIsBtnLoading(false);
        setIsLoading(false);
        toast.error(`Select a payment option!`, {
          toastId: 'toast-gen-failed',
        });
      }

    } catch (error) {
      const reference = uuidv4();
      console.error('Error generating payment address:', error.response.data);
      setErrorMessage('Error generating payment address');
      setPaymentAddress('');
      saveBtcTransactionData(reference, userEmail, price, userID, 'failed');
      setIsBtnLoading(false);
      setIsLoading(false);
    }
  };

  // generate fund address
  const generateFundAddress = async () => {
    if (selectedFundValue.trim() !== '') {
      if (fundAmount < 200) {
        toast.error(`Minimum deposit is $200!`, {
          toastId: 'toast-fund-failed',
        });
      }
      else {

        setIsLoading(true);
        try {
          const data = {
            price_amount: fundAmount,
            price_currency: 'usd',
            pay_currency: selectedFundValue,
            ipn_callback_url: 'https://nft-broker-mroz.onrender.com/api/crypto-callback',
            order_id: getUniqueId,
            order_description: 'Crypto Deposit'
          };

          const response = await axios.post('https://nft-broker-mroz.onrender.com/api/payment', { data });

          // Assuming the payment address is returned in the response

          const reference = uuidv4();
          setFundAddress(response.data.pay_address);
          saveBtcTransactionData(reference, userEmail, fundAmount, userID, 'pending', response.data.payment_id);
          saveTempCryptoData(userID, response.data.payment_id, response.data.payment_status, response.data.pay_address, response.data.price_amount, response.data.order_description);
          setIsLoading(false);
          setErrorMessage('');
        } catch (error) {
          const reference = uuidv4();
          console.error('Error generating payment address:', error.response.data);
          setErrorMessage('Error generating payment address');
          setPaymentAddress('');
          saveBtcTransactionData(reference, userEmail, fundAmount, userID, 'failed');
          setIsBtnLoading(false);
          setIsLoading(false);
        }
      }
    }
    else {
      setIsBtnLoading(false);
      setIsLoading(false);
      toast.error(`Select a payment option!`, {
        toastId: 'toast-gen-failed',
      });
    }
  };


  const handleCopy = () => {
    // Create a temporary input element to facilitate copying
    const tempInput = document.createElement('input');

    // Set the value of the input to the referral ID
    tempInput.value = paymentAddress;

    // Append the input element to the DOM (not visible)
    document.body.appendChild(tempInput);

    // Select the text in the input
    tempInput.select();

    // Execute the copy command
    document.execCommand('copy');

    // Remove the temporary input element from the DOM
    document.body.removeChild(tempInput);

    // Optionally, provide feedback to the user (e.g., a tooltip or notification)
    toast.info('Wallet Address Copied!', {
      position: toast.POSITION.TOP_CENTER,
    });
  };

  // gold copy

  const handleCopyGold = () => {
    // Create a temporary input element to facilitate copying
    const tempInput = document.createElement('input');

    // Set the value of the input to the referral ID
    tempInput.value = goldPaymentAddress;

    // Append the input element to the DOM (not visible)
    document.body.appendChild(tempInput);

    // Select the text in the input
    tempInput.select();

    // Execute the copy command
    document.execCommand('copy');

    // Remove the temporary input element from the DOM
    document.body.removeChild(tempInput);

    // Optionally, provide feedback to the user (e.g., a tooltip or notification)
    toast.info('Wallet Address Copied!', {
      position: toast.POSITION.TOP_CENTER,
    });
  };
  // prof copy

  const handleCopyPro = () => {
    // Create a temporary input element to facilitate copying
    const tempInput = document.createElement('input');

    // Set the value of the input to the referral ID
    tempInput.value = professionalPaymentAddress;

    // Append the input element to the DOM (not visible)
    document.body.appendChild(tempInput);

    // Select the text in the input
    tempInput.select();

    // Execute the copy command
    document.execCommand('copy');

    // Remove the temporary input element from the DOM
    document.body.removeChild(tempInput);

    // Optionally, provide feedback to the user (e.g., a tooltip or notification)
    toast.info('Wallet Address Copied!', {
      position: toast.POSITION.TOP_CENTER,
    });
  };

  // copy expert

  const handleCopyExpert = () => {
    // Create a temporary input element to facilitate copying
    const tempInput = document.createElement('input');

    // Set the value of the input to the referral ID
    tempInput.value = expertPaymentAddress;

    // Append the input element to the DOM (not visible)
    document.body.appendChild(tempInput);

    // Select the text in the input
    tempInput.select();

    // Execute the copy command
    document.execCommand('copy');

    // Remove the temporary input element from the DOM
    document.body.removeChild(tempInput);

    // Optionally, provide feedback to the user (e.g., a tooltip or notification)
    toast.info('Wallet Address Copied!', {
      position: toast.POSITION.TOP_CENTER,
    });
  };
  // 
  const [email, setEmail] = useState(''); // Initialize email with user's email


  //  save crypto transaction (deposit)
  const saveBtcTransactionData = async (transactionReference, email, amount, userID, status, paymentID) => {
    // const db = getFirestore();
    // const transactionsCollection = collection(db, 'transactions');
    // const txID = uuidv4(); 
    if (user) {
      const txDetails = {
        transactionReference: 'tx-' + transactionReference,
        email,
        amount,
        userID,
        status, // Include the status field
        timestamp: new Date(),
        transactionType: 'Deposit',
        paymentID,
      };
      await fetch(`https://nft-broker-mroz.onrender.com/api/createTransactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add any other headers as needed
          },
          body: JSON.stringify(txDetails),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          try {

          } catch (error) {
            console.log('Error adding transaction document: ', JSON.stringify(error));
          }
        })
        .catch(error => {
          console.log('Error:', JSON.stringify(error.message));
        });
    }

  };
  // end of crypto tx record

  // save temp crypto tx
  const saveTempCryptoData = async (userID, payment_id, payment_status, pay_address, price_amount, order_description) => {
    // const db = getFirestore();
    // const transactionsCollection = collection(db, 'transactions');
    // const txID = uuidv4(); 
    if (user) {
      const paymentData = {
        userID,
        payment_id,
        payment_status,
        pay_address,
        price_amount,
        order_description
      };
      await fetch(`https://nft-broker-mroz.onrender.com/api/saveCryptoPayments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add any other headers as needed
          },
          body: JSON.stringify(paymentData),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

        })
        .then(data => {
          try {


          } catch (error) {

          }
        })
        .catch(error => {

        });
    }

  };


  // 
  const handleDropdownChange = (event) => {
    setSelectedStarterValue(event.target.value);
  };
  const handleFundDropdownChange = (event) => {
    setSelectedFundValue(event.target.value);
  };
  // ...

  const debitUser = (ticketFee) => {
    setIsLoading(true);
    if (userBalance >= ticketFee && ticketFee !== null) {
      const addParticipant = async () => {
        try {
          await fetch('https://nft-broker-mroz.onrender.com/api/addParticipant', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userData.userId,
              fee: ticketFee // Example user ID
              // Other user information...
            }),
          });
          // next function
          setIsLoading(false);
          toast.success(`Investment plan activated!`, {
            toastId: 'toast-fund-success',
          });

        } catch (error) {
          console.error('Error adding participant:', error);
          setIsLoading(false);
          toast.error(`Failed to activate investmnent!`, {
            toastId: 'toast-add-failed',
          });
        }
      };
      addParticipant();

    }
    else {
      setIsLoading(false);
      toast.error(`Insufficient Funds! - Fund your Wallet to continue`, {
        toastId: 'toast-fund-failed',
      });
    }
  }
  // ...
  // ,,,



  return (
    <div className="payment-container" style={{ background: '#13151b', overflowY: 'auto' }}>
      <ToastContainer />
      <div className='row'>
        {/* deposit */}
        <div className='col-sm-6'>
          <div className="payment-modal container-fluid text-secondary mt-5" style={{ width: '75%', maxWidth: '400px', marginLeft: '18%', backgroundColor: '#1F222D', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)' }}>

            <div className="mt-3">
              <h4 className='mb-3'>Fund your Wallet</h4>
              {fundAddress && <p className='bold'>Make sure to send the exact amount specified to avoid missing transactions.</p>}


              {fundAddress ? (<><p>Amount: <span className='fw-bold text-white'>${fundAmount}</span></p><p>Send your {selectedFundValue} to this wallet address:</p>
                <div className='d-flex align-items-center justify-content-between'>
                  <input className='bg-light-sec border border-secondary p-3' type="text" readOnly value={fundAddress} />
                  {/* place your handle copy on this button */}
                  <button className='remove-btn-style'><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-copy text-theme mx-2" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6ZM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z" />
                  </svg></button>
                </div>
              </>) : (
                <>
                  {!fundAddress &&
                    <>
                      <input
                        type="number"
                        placeholder={`Enter amount`}
                        className='border border-secondary rounded p-3'
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                      // onChange={(e) => setEmail(e.target.value)}
                      />

                      {/* select funding option */}
                      {/* select withdrawal from */}

                      <div className='mt-1'>
                        <select className='form-control mt-4 mb-3' id="myDropdown" value={selectedFundValue} onChange={handleFundDropdownChange}>
                          <option value="">Select Payment Option</option>
                          <option value="btc">Bitcoin</option>
                          <option value="eth">Ethereum</option>
                          {/* <option value="bnb">BNB (BEP20 Network)</option> */}
                        </select>
                      </div>
                    </>
                  }
                </>
              )

              }

              {!fundAddress && <button className="border-theme text-white rounded-pill p-2 no-bg mt-5" onClick={() => generateFundAddress()}>
                {isFundBtnLoading ? <><img src={myRedImage} alt="Loading" width="20" height="20" style={{
                  borderRadius: '50%',
                }} /></> : 'Make a deposit'}
              </button>}
              {/* deposit with bank */}
              <div className='mt-2 justify-content-end'>
                <a href="mailto:minterfxpro@gmail.com">Send us an email </a> to deposit with your bank.
              </div>
            </div>

          </div>
        </div>
        {/* investment plans */}

        <div className='col-sm-6'>
          <div className="payment-modal mt-5 container-fluid text-secondary" style={{ width: '75%', maxWidth: '400px', marginLeft: '18%', backgroundColor: '#1F222D', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)' }}>
            <h2 className='text-theme'>Starter Plan</h2>
            <span className='d-flex align-items-center justify-content-center'>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" className="mx-2 text-secondary bi bi-info-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
              </svg>
              <p>investment plan</p>
            </span>
            <h3 className='text-white display-5'>$300</h3>

            {/* Add an input field for email */}

            <div>

              <p className='bold'>Make sure to send the exact amount specified to avoid missing transactions.</p>

              {/* select withdrawal from */}
              {!paymentAddress &&
                <div className='mt-1'>
                  <select className='form-control mt-4 mb-3' id="myDropdown" value={selectedStarterValue} onChange={handleDropdownChange}>
                    <option value="">Select Payment Option</option>
                    <option value="btc">Bitcoin</option>
                    <option value="eth">Ethereum</option>
                    {/* <option value="usdt">Tether (USDT)</option> */}
                  </select>
                </div>
              }

              {paymentAddress && <><p>Send your {selectedStarterValue} to this wallet address:</p>
                <div className='d-flex align-items-start justify-content-between'>
                  <input className='bg-light-sec' type="text" readOnly value={paymentAddress} />
                  <button className='remove-btn-style' onClick={handleCopy}><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-copy text-theme mx-2" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6ZM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z" />
                  </svg></button>
                </div>

              </>}
              {errorMessage && <p>{errorMessage}</p>}
            </div>



            {!paymentAddress &&
              <div className='row justify-content-between'>
                <div className='col-md-6'>
                  <button className="paystack-button" onClick={() => generatePaymentAddress(300)}>
                    {isBtnLoading ? <img src={myRedImage} alt="Loading" width="20" height="20" /> : 'Make Payment'}
                  </button>
                </div>
                <div className='col-md-6'>
                  <button className="border-theme text-white rounded-pill p-2 no-bg mt-5" onClick={() => debitUser(300)}>
                    {isBtnLoading ? <><img src={myRedImage} alt="Loading" width="20" height="20" style={{
                      borderRadius: '50%',
                    }} /></> : 'Pay from balance'}
                  </button>
                </div>
              </div>
            }

            {/* deposit with bank */}
            <div className='mt-2 justify-content-end'>
              <a href="mailto:minterfxpro@gmail.com">Send us an email </a> to deposit with your bank.
            </div>
          </div>
        </div>
      </div>
      {/* investment sections */}
      <div className='row'>


        {/* first column */}
        <div className='col-lg-4'>
          <div className="payment-modal mt-5 container-fluid text-secondary" style={{ width: '75%', maxWidth: '400px', marginLeft: '18%', backgroundColor: '#1F222D', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)' }}>
            <h2 className='text-theme'>Gold Plan</h2>
            <span className='d-flex align-items-center justify-content-center'>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" className="mx-2 text-secondary bi bi-info-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
              </svg>
              <p>investment plan</p>
            </span>
            <h3 className='text-white display-5'>$2,000</h3>

            {/* Add an input field for email */}

            <div>

              <p className='bold'>Make sure to send the exact amount specified to avoid missing transactions.</p>

              {/* select withdrawal from */}
              {!goldPaymentAddress &&
                <div className='mt-1'>
                  <select className='form-control mt-4 mb-3' id="myDropdown" value={selectedStarterValue} onChange={handleDropdownChange}>
                    <option value="">Select Payment Option</option>
                    <option value="btc">Bitcoin</option>
                    <option value="eth">Ethereum</option>
                    {/* <option value="usdt">Tether (USDT)</option> */}
                  </select>
                </div>
              }

              {goldPaymentAddress && <><p>Send your {selectedStarterValue} to this wallet address:</p>
                <div className='d-flex align-items-start justify-content-between'>
                  <input className='bg-light-sec' type="text" readOnly value={goldPaymentAddress} />
                  <button className='remove-btn-style' onClick={handleCopyGold}><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-copy text-theme mx-2" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6ZM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z" />
                  </svg></button>
                </div>
              </>}
              {errorMessage && <p>{errorMessage}</p>}
            </div>





            {!goldPaymentAddress &&
              <div className='row justify-content-between'>
                <div className='col-md-6'>
                  <button className="paystack-button" onClick={() => generatePaymentAddress(2000)}>
                    {isBtnLoading ? <img src={myRedImage} alt="Loading" width="20" height="20" /> : 'Make Payment'}
                  </button>
                </div>
                <div className='col-md-6'>
                  <button className="border-theme text-white rounded-pill p-2 no-bg mt-5" onClick={() => debitUser(2000)}>
                    {isBtnLoading ? <><img src={myRedImage} alt="Loading" width="20" height="20" style={{
                      borderRadius: '50%',
                    }} /></> : 'Pay from balance'}
                  </button>
                </div>
              </div>
            }

            {/* deposit with bank */}
            <div className='mt-2 justify-content-end'>
              <a href="mailto:minterfxpro@gmail.com">Send us an email </a> to deposit with your bank.
            </div>


          </div>
        </div>
        {/* second column */}
        <div className='col-lg-4'>
          <div className="payment-modal mt-5 container-fluid text-secondary" style={{ width: '75%', maxWidth: '400px', marginLeft: '18%', backgroundColor: '#1F222D', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)' }}>
            <h2 className='text-theme'>Professional</h2>
            <span className='d-flex align-items-center justify-content-center'>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" className="mx-2 text-secondary bi bi-info-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
              </svg>
              <p>investment plan</p>
            </span>
            <h3 className='text-white display-5'>$5,000</h3>

            {/* Add an input field for email */}

            <div>

              <p className='bold'>Make sure to send the exact amount specified to avoid missing transactions.</p>

              {/* select withdrawal from */}
              {!professionalPaymentAddress &&
                <div className='mt-1'>
                  <select className='form-control mt-4 mb-3' id="myDropdown" value={selectedStarterValue} onChange={handleDropdownChange}>
                    <option value="">Select Payment Option</option>
                    <option value="btc">Bitcoin</option>
                    <option value="eth">Ethereum</option>
                    {/* <option value="usdt">Tether (USDT)</option> */}
                  </select>
                </div>
              }

              {professionalPaymentAddress && <><p>Send your {selectedStarterValue} to this wallet address:</p>
                <div className='d-flex align-items-start justify-content-between'>
                  <input className='bg-light-sec' type="text" readOnly value={professionalPaymentAddress} />
                  <button className='remove-btn-style' onClick={handleCopyPro}><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-copy text-theme mx-2" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6ZM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z" />
                  </svg></button>
                </div>
              </>}
              {errorMessage && <p>{errorMessage}</p>}
            </div>





            {!professionalPaymentAddress &&
              <div className='row justify-content-between'>
                <div className='col-md-6'>
                  <button className="paystack-button" onClick={() => generatePaymentAddress(5000)}>
                    {isBtnLoading ? <img src={myRedImage} alt="Loading" width="20" height="20" /> : 'Make Payment'}
                  </button>
                </div>
                <div className='col-md-6'>
                  <button className="border-theme text-white rounded-pill p-2 no-bg mt-5" onClick={() => debitUser(5000)}>
                    {isBtnLoading ? <><img src={myRedImage} alt="Loading" width="20" height="20" style={{
                      borderRadius: '50%',
                    }} /></> : 'Pay from balance'}
                  </button>
                </div>
              </div>
            }

            {/* deposit with bank */}
            <div className='mt-2 justify-content-end'>
              <a href="mailto:minterfxpro@gmail.com">Send us an email </a> to deposit with your bank.
            </div>

          </div>
        </div>
        {/* third column */}
        <div className='col-lg-4'>
          <div className="payment-modal mt-5 container-fluid text-secondary" style={{ width: '75%', maxWidth: '400px', marginLeft: '18%', backgroundColor: '#1F222D', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)', marginBottom: '10%' }}>
            <h2 className='text-theme'>Expert</h2>
            <span className='d-flex align-items-center justify-content-center'>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" className="mx-2 text-secondary bi bi-info-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
              </svg>
              <p>investment plan</p>
            </span>
            <h3 className='text-white display-5'>$10,000</h3>

            {/* Add an input field for email */}

            <div>

              <p className='bold'>Make sure to send the exact amount specified to avoid missing transactions.</p>

              {/* select withdrawal from */}
              {!expertPaymentAddress &&
                <div className='mt-1'>
                  <select className='form-control mt-4 mb-3' id="myDropdown" value={selectedStarterValue} onChange={handleDropdownChange}>
                    <option value="">Select Payment Option</option>
                    <option value="btc">Bitcoin</option>
                    <option value="eth">Ethereum</option>
                    {/* <option value="usdt">Tether (USDT)</option> */}
                  </select>
                </div>
              }

              {expertPaymentAddress && <><p>Send your {selectedStarterValue} to this wallet address:</p>
                <div className='d-flex align-items-start justify-content-between'>
                  <input className='bg-light-sec' type="text" readOnly value={expertPaymentAddress} />
                  <button className='remove-btn-style' onClick={handleCopyExpert}><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-copy text-theme mx-2" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6ZM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z" />
                  </svg></button>
                </div>
              </>}
              {errorMessage && <p>{errorMessage}</p>}
            </div>





            {!expertPaymentAddress &&
              <div className='row justify-content-between'>
                <div className='col-md-6'>
                  <button className="paystack-button" onClick={() => generatePaymentAddress(10000)}>
                    {isBtnLoading ? <img src={myRedImage} alt="Loading" width="20" height="20" /> : 'Make Payment'}
                  </button>
                </div>
                <div className='col-md-6'>
                  <button className="border-theme text-white rounded-pill p-2 no-bg mt-5" onClick={() => debitUser(10000)}>
                    {isBtnLoading ? <><img src={myRedImage} alt="Loading" width="20" height="20" style={{
                      borderRadius: '50%',
                    }} /></> : 'Pay from balance'}
                  </button>
                </div>
              </div>
            }

            {/* deposit with bank */}
            <div className='mt-2 justify-content-end'>
              <a href="mailto:minterfxpro@gmail.com">Send us an email </a> to deposit with your bank.
            </div>

          </div>
        </div>
      </div>
      {isLoading && <Loading />}
    </div>
  );
};

export default PaymentModal;
