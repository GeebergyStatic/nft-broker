// PaymentBox.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PaymentBox = ({
  title,
  amount,
  saveCryptoTransaction,
  debitUser,
  paymentType
}) => {
  const [selectedValue, setSelectedValue] = useState('');
  const [paymentAddress, setPaymentAddress] = useState(null);
  const [showAddress, setShowAddress] = useState(false);
  const [tetherInfo, setTetherInfo] = useState({ usdtAddress: '', usdtMemo: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [isBtnLoading, setIsBtnLoading] = useState(false);

  const generatePaymentAddress = async (amount) => {
    setIsBtnLoading(true); // Show loading spinner
    // Simulating API call
    if (paymentAddress){
      setTimeout(() => {
        setShowAddress(true);
        saveCryptoTransaction(amount);
        setIsBtnLoading(false);
      }, 1500);
    }
    else{
      setShowAddress(false);
      setIsBtnLoading(false);
      toast.warning('Please select a payment method!', {
        position: toast.POSITION.TOP_CENTER,
        className: "custom-toast",
      });
    }
    
  };
  

  const handleDropdownChange = (e) => {
    const selectedOption = e.target.value;
    setSelectedValue(selectedOption);

    // Handle Tether separately
    if (selectedOption === 'xrp') {
      // Assuming you have access to the walletAddresses data here
      // You might need to pass it as a prop or manage it via context/state
      // For simplicity, let's assume it's passed as a prop or available globally
      const selectedWallet = paymentType.walletAddresses.find(wallet => wallet.type === selectedOption);
      if (selectedWallet) {
        setTetherInfo({ usdtAddress: selectedWallet.address, usdtMemo: selectedWallet.memo });
        setPaymentAddress(null);
        // saveCryptoTransaction(amount);
      }
    } else {
      const selectedWallet = paymentType.walletAddresses.find(wallet => wallet.type === selectedOption);
      setPaymentAddress(selectedWallet ? selectedWallet.address : null);
      setTetherInfo({ usdtAddress: '', usdtMemo: '' });
      // saveCryptoTransaction(amount);
    }
  };

  const handleCopy = (value) => {
    navigator.clipboard.writeText(value);
    // Optionally, add a toast notification here
    toast.info('Info Copied Successfully!', {
      position: toast.POSITION.TOP_CENTER,
      className: "custom-toast",
    });
  };

  return (
    <div className="payment-modal container-fluid text-secondary my-3" style={{ backgroundColor: '#1F222D', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', borderRadius: '8px', maxWidth: '300px' }}>
        <ToastContainer />
      <h2 className='text-secondary'>{title}</h2>
      <span className='d-flex align-items-start justify-content-center mb-3'>
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="23" fill="currentColor" className="mx-2 text-secondary bi bi-info-circle" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
        </svg>
        <p>Investment Plan</p>
      </span>
      <h3 className='text-white display-5'>${amount.toLocaleString()}</h3>


      <div>
        <p className='bold'>Make sure to send the exact amount specified to avoid missing transactions.</p>

        {/* Payment Option Dropdown */}
        {!showAddress && tetherInfo.usdtAddress === '' && (
          <div className='mt-1'>
            <select className='form-control mt-4 mb-3' value={selectedValue} onChange={handleDropdownChange}>
            <option value="">Select Payment Option</option>
            {paymentType.walletAddresses && Array.isArray(paymentType.walletAddresses) ? (
              paymentType.walletAddresses.map(wallet => (
                <option key={wallet.type} value={wallet.type}>
                  {wallet.type.toUpperCase()}
                </option>
              ))
            ) : (
               <option value="">No Wallet Addresses Available</option> // Fallback option
             )}
            </select>

          </div>
        )}

        {/* Display Payment Address */}
        {showAddress && paymentAddress && (
          <>
            <p>Send your {selectedValue.toUpperCase()} to this wallet address:</p>
            <div className='d-flex align-items-center justify-content-between'>
              <input className='bg-light-sec border border-secondary p-2 rounded' type="text" readOnly value={paymentAddress} />
              <button className='remove-btn-style' onClick={() => handleCopy(paymentAddress)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-copy text-theme mx-2" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6Z" />
                  <path d="M2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Display Tether Address and Memo */}
        {showAddress && tetherInfo.usdtAddress && (
          <>
            <p>Send your Tether (USDT) to the following address:</p>
            <div className='d-flex align-items-center justify-content-between mb-2'>
              <input className='bg-light-sec border border-secondary p-2 rounded' type="text" readOnly value={tetherInfo.usdtAddress} placeholder="USDT Address" />
              <button className='remove-btn-style' onClick={() => handleCopy(tetherInfo.usdtAddress)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-copy text-theme mx-2" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6Z" />
                  <path d="M2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z" />
                </svg>
              </button>
            </div>
            <p>Memo:</p>
            <div className='d-flex align-items-center justify-content-between mb-2'>
              <input className='bg-light-sec border border-secondary p-2 rounded' type="text" readOnly value={tetherInfo.usdtMemo} placeholder="USDT Memo" />
              <button className='remove-btn-style' onClick={() => handleCopy(tetherInfo.usdtMemo)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-copy text-theme mx-2" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6Z" />
                  <path d="M2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z" />
                </svg>
              </button>
            </div>
          </>
        )}

        {errorMessage && <p className="text-danger">{errorMessage}</p>}

        {/* Action Buttons */}
        {!showAddress && tetherInfo.usdtAddress === '' && (
          <div className='d-flex-column justify-content-between mt-3 '>
            <button
              className="paystack-button btn mb-3 mx-2"
              onClick={() => generatePaymentAddress(amount)}
              disabled={isBtnLoading}
            >
              {isBtnLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                'Make Payment'
              )}
            </button>
            <button
              className={isBtnLoading ? 'd-none' : 'text-white rounded-pill p-2 btn btn-secondary'}
              onClick={() => debitUser(amount)}
              disabled={isBtnLoading}
            >
              {isBtnLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                'Pay from balance'
              )}
            </button>
          </div>
        )}

        {/* Deposit with Bank */}
        <div className='mt-3 text-end'>
          <a href="mailto:minterfxpro@gmail.com">Send us an email</a> to deposit with your bank.
        </div>
      </div>
    </div>
  );
};

export default PaymentBox;
