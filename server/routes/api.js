// my-app/server/routes/api.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../model');
const { MongoClient } = require('mongodb');
const cron = require('node-cron');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const uri = process.env.uri;

async function connectToMongoDB() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (error) {

    
    console.error('Error connecting to MongoDB', error);
  }
}

connectToMongoDB();

const NFTSchema = new mongoose.Schema(
  {
      userId: { type: String, required: true },
      creatorName: { type: String, required: true },
      collectionName: { type: String, required: true },
      fileUrl: { type: String, required: true },
      category: { type: String, required: true, enum: ["art", "music", "domain names", "sports", "collectible", "photography"] },
      bidPrice: { type: Number, required: true },
      comment: { type: String },
      agentID: { type: String },
      status: { type: String, enum: ["pending", "failed", "successful", "approved", "denied"], default: "pending" },
  },
  { timestamps: true }
);

const NFT = mongoose.model("NFT", NFTSchema)
// define crypto save collection
// Define schema for storing payment callback data
const PaymentCallbackSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now }, // Timestamp of the callback
  userID: String,
  username: String,
  payment_status: String,
  pay_address: String,
  price_amount: Number,
  paymentID: String,
  description: String,
});

// Create model for payment callback data
const PaymentCallback = mongoose.model('PaymentCallback', PaymentCallbackSchema, 'cryptopayment');


// Define a Mongoose schema for transactions
// Define a Mongoose schema for transactions
const transactionSchema = new mongoose.Schema({
  transactionReference: { type: String, required: true, unique: true }, // Ensure unique references
  amount: { type: Number, required: true },
  userID: { type: String, required: true },
  fileUrl: { type: String, default: null },
  status: { type: String, default: "pending" }, // Default to pending
  timestamp: { type: Date, default: Date.now }, // Automatically set timestamp
  transactionType: { type: String, required: true }, // Fixed field name
  description: { type: String, default: "" },
  accountName: { type: String, default: "" },
  email: { type: String, default: "" },
  bankName: { type: String, default: "" },
  swiftCode: { type: String, default: "" },
  bankAddress: { type: String, default: "" },
  ethAmount: { type: Number, default: 0 }, // Default 0 for withdrawals
  additionalInfo: { type: String, default: "" },
  walletName: { type: String, default: "" },
  walletAddress: { type: String, default: "" },
  agentID: { type: String, default: "" },
});

// Create a model based on the schema
const Transaction = mongoose.model("Transaction", transactionSchema, "transactions");


const WalletAddressSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true, // e.g., 'tether', 'bitcoin', etc.
    unique: true
  },
  address: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  memo: {
    type: String, // Optional, for coins like USDT that use memo
    default: ''
  },
  isDefault: {
    type: Boolean,
  }
});

const WalletAddress = mongoose.model('WalletAddress', WalletAddressSchema);


// Define a schema and model
const scriptSchema = new mongoose.Schema({
  src: String,
  agentCode: String,
  isDefault: Boolean,
});

const Script = mongoose.model('Script', scriptSchema);


// create user
router.post("/createUser", async (request, response) => {
  const userDetails = new User(request.body);
  const userId = userDetails.userId;
 
  try {
    const doesDataExist = await User.findOne({ userId: userId});
    if(!doesDataExist){
      await userDetails.save();
      response.send({"userDetails": userDetails, "status": "success"});
    }
    else{
      const reply = {
        "status": "failed",
        "message": "User data already exists",
      }
      response.send(reply);
    }
    
  } catch (error) {
    response.status(500).send(error);
  }
});

router.post("/addUser", async (request, response) => {
  const userDetails = new User(request.body);
  const userId = userDetails.userId;
 
  try {
    const doesDataExist = await User.findOne({ userId: userId});
    if(!doesDataExist){
      await userDetails.save();
      response.send({"userDetails": userDetails, "status": "success"});
    }
    else{
      const reply = {
        "status": "success",
        "message": "User data already exists",
      }
      response.send(reply);
    }
    
  } catch (error) {
    response.status(500).send(error);
  }
});


// Function to save NFT transaction
const saveNftTransactionData = async (
  userId,
  fileUrl,
  amount,
  transactionType,
  accountName = "",
  email = "",
  bankName = "",
  swiftCode = "",
  bankAddress = "",
  ethAmount = "",
  additionalInfo = "",
  walletName = "",
  walletAddress = "",
  agentID = ""
) => {
  try {
    const reference = uuidv4();
    const txDetails = new Transaction({
      transactionReference: `tx-${reference}`,
      amount,
      fileUrl,
      userID: userId,
      status: "pending",
      timestamp: new Date(),
      accountName,
      email,
      bankName,
      swiftCode,
      bankAddress,
      ethAmount,
      additionalInfo,
      walletName,
      walletAddress,
      agentID,
      transactionType,
      description: transactionType, // ✅ Fixed missing comma
    });

    return await txDetails.save(); // ✅ Return transaction instead of sending response
  } catch (error) {
    console.error("Error saving NFT transaction:", error.message);
    throw new Error("Internal Server Error"); // ✅ Throw error to be caught by the route handler
  }
};


// save data
// Define a route to handle transaction creation
router.post('/saveCryptoPayments', async (request, response) => {
  try {
    const paymentData = request.body;
    const paymentCallback = new PaymentCallback(paymentData);

    // Save the document to the database
    paymentCallback.save()
      .then(() => {
        console.log('Payment callback data saved successfully');
        response.sendStatus(200); // Respond with success status
      })
      .catch(error => {
        console.error('Error saving payment callback data:', error);
        response.status(500).send('Error saving payment callback data'); // Respond with error status
      });
  } catch (error) {
    console.error('Error adding transaction document: ', error);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});

// ...
// callback data
router.post('/payment', async (req, res) => {
  try {
    const { data } = req.body;
    const API_KEY = 'ANAVJWM-2GKMRZJ-GV6RDW4-J1N753D';

    const response = await axios.post('https://api.nowpayments.io/v1/payment', data, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

  res.json(response.data);
  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Callback endpoint (crypto)
// Backend (Express) - Route to Add Participants
router.post('/debitUser', async (req, res) => {
  try {
    const { userId, fee } = req.body;

    // Update user balance
    const updatedUser = await User.findOneAndUpdate(
      { userId: userId },
      { $inc: { balance: -fee } }, // Deduct the fee from the balance
      { new: true } // Return the updated user document
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({ message: 'User debited successfully!' });
  } catch (error) {
    console.error('Error debiting user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





// update account limit
router.post('/updateAccountLimit', async (req, res) => {
  const userId = req.body.userId;

  try {
    const userDoc = await User.findOne({ userId: userId });

    // Get the referredBy user's ID from the current user's document
    const referredByUserId = userDoc.referredBy;

    if (referredByUserId !== 'none') {
      try {
        // Fetch the referredBy user's document
        const referredByUserDoc = await User.findOne({ userId: referredByUserId });

        if (!referredByUserDoc) {
          throw new Error('ReferredBy user data not found.');
        }

        // Define account limit, activity, and referral count from the referredBy user
        const currentAccountLimit = referredByUserDoc.accountLimit;
        const isAccountActive = referredByUserDoc.isUserActive;
        const referralsCount = referredByUserDoc.referralsCount;
        const hasUserPaid = referredByUserDoc.hasPaid;

        const amount = referredByUserDoc.reserveAccountLimit;

        // Check if the user has three referrals and isAccountActive
        if (referralsCount >= 3 && isAccountActive && hasUserPaid) {
          await User.updateOne(
            { userId: referredByUserId },
            { $set: { accountLimit: parseFloat(currentAccountLimit) + parseFloat(amount), referralsCount: 0, hasPaid: false } }
          );
        }

        // Fetch the referredBy user's balance after potential update
        const updatedAccountLimitDoc = await User.findOne({ userId: referredByUserId });

        try {
          // Fetch the user's document
          const currentUserDoc = await User.findOne({ userId: userId });
  
          if (!currentUserDoc) {
            throw new Error('User data not found.');
          }
  
          const currentUserAccountLimit = currentUserDoc.accountLimit;
          const isCurrentAccountActive = currentUserDoc.isUserActive;
          const currentUserReferralsCount = currentUserDoc.referralsCount;
          const currentUserPaid = currentUserDoc.hasPaid;
  
          const amount = currentUserDoc.reserveAccountLimit;
  
          // Check if the user has three referrals and isCurrentAccountActive
          if (currentUserReferralsCount >= 3 && isCurrentAccountActive && currentUserPaid) {
            await User.updateOne(
              { userId: userId },
              { $set: { accountLimit: parseFloat(currentUserAccountLimit) + parseFloat(amount), referralsCount: 0, hasPaid: false } }
            );
          }
  
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Internal Server Error' });
        }

        if (!updatedAccountLimitDoc) {
          throw new Error('ReferredBy user data not found after update.');
        }

      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    } else {
      try {
        // Fetch the user's document
        const currentUserDoc = await User.findOne({ userId: userId });

        if (!currentUserDoc) {
          throw new Error('User data not found.');
        }

        const currentUserAccountLimit = currentUserDoc.accountLimit;
        const isCurrentAccountActive = currentUserDoc.isUserActive;
        const currentUserReferralsCount = currentUserDoc.referralsCount;
        const currentUserPaid = currentUserDoc.hasPaid;

        const amount = currentUserDoc.reserveAccountLimit;

        // Check if the user has three referrals and isCurrentAccountActive
        if (currentUserReferralsCount >= 3 && isCurrentAccountActive && currentUserPaid) {
          await User.updateOne(
            { userId: userId },
            { $set: { accountLimit: parseFloat(currentUserAccountLimit) + parseFloat(amount), referralsCount: 0, hasPaid: false } }
          );
        }

      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    res.status(200).json({ message: 'Account limit updated successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// update user data
router.post("/updateInfo", async (request, response) => {
  const userDetails = new User(request.body);
  const userId = userDetails.userId;
 
  try {
    const doesDataExist = await User.findOne({ userId: userId});
    try {
      // Example 1: Updating user's balance
      // await User.updateOne(
      //   { userId: userId },
      //   { $set: { balance: newBalance } }
      // );
      
      // Example 2: Incrementing referredUsers field
      if(doesDataExist){
        await User.updateOne(
          { userId: userId },
          { $inc: { referredUsers: 1, weeklyReferrals: 1 } }
      );
      
    
        response.send({"status": "successful", "referrerData" : doesDataExist})
      }
      else{

      }
      
    } catch (error) {
      response.send(error);
    }
    
  } catch (error) {
    response.status(500).send(error);
  }
});

// update user balance
router.post("/updateBalance", async (request, response) => {
  const userDetails = new User(request.body);
  const userId = userDetails.userId;
  const newBalance = userDetails.balance;
  const dailyDropBalance = userDetails.dailyDropBalance;
  const accountLimit = userDetails.accountLimit;
  const lastLogin = userDetails.lastLogin;
  const firstLogin = userDetails.firstLogin;
  const weeklyEarnings = userDetails.weeklyEarnings;
 
  try {
    const doesDataExist = await User.findOne({ userId: userId});
    try {
      // Example 1: Updating user's balance
      
  
      // Example 2: Incrementing referredUsers field
      if(doesDataExist){
        await User.updateOne(
          { userId: userId },
          { $set: { balance: newBalance,
          dailyDropBalance,
          accountLimit,
          lastLogin,
          firstLogin },
          $inc: { weeklyEarnings: weeklyEarnings}  },
           
        );
    
        response.send({"status": "successful", "referrerData" : doesDataExist})
      }
      else{
        response.send({"status": "failed",})
      }
      
    } catch (error) {
      response.send(error);
    }
    
  } catch (error) {
    response.status(500).send(error);
  }
});


// CREDIT REFERRER AFTER PAY
router.post("/creditReferrer", async (request, response) => {
  const userDetails = request.body;
  const userId = userDetails.userId;
  const referralsCount = userDetails.referralsCount;
  const totalReferrals = userDetails.totalReferrals;
  const balance = userDetails.balance;
  const referralsBalance = userDetails.referralsBalance;

  try {
    const referredByUser = await User.findOne({ userId: userId });
    const referredByUserRole = referredByUser ? referredByUser.role : null;
    const referredByUserTotalReferrals = referredByUser ? referredByUser.totalReferrals : null;

    // Example 2: Incrementing referredUsers field
    if (referredByUser) {
        let commissionRate = 0.17; // Default commission rate for tier 0
        if (referredByUserTotalReferrals !== null) {
        if (referredByUserTotalReferrals >= 9) commissionRate = 0.3;
        else if (referredByUserTotalReferrals >= 6) commissionRate = 0.25;
        else if (referredByUserTotalReferrals >= 3) commissionRate = 0.20;
      }
      const commission = commissionRate * (referredByUserRole === 'crypto' ? 2 : 3000);
  
      const revenueAdd = referredByUserRole === 'crypto' ? 2 : 1333;

       // Update referrer's commission
       await User.updateOne(
        { userId: userId },
        {
          $inc: { referralsCount: 1, totalReferrals: 1, referralsBalance: commission, referredUsers: -1, weeklyEarnings: commission, reserveAccountLimit: revenueAdd}
        }
      );

      response.send({ status: "successful", referrerData: referredByUser });

    } else {
      response.send({ status: "failed" });
    }
  } catch (error) {
    response.status(500).send(error);
  }
});

// end of update user data

router.get("/userExists/:userIdentification", async (request, response) => {
  try {
    const userId = request.params.userIdentification;
    const userExists = await User.findOne({ userId: userId });

    if(userExists){
      response.send({status: true, data: userExists})
    }
    else{
      response.send({status: false})
    }
  } catch (error) {
    response.status(500).send(error);
  }
});


// Check referral code
// check referral code
router.get("/checkUserReferral/:userReferral", async (request, response) => { 
  try {
    const userReferralCode = request.params.userReferral;
    const referrerExists = await User.findOne({ referralCode: userReferralCode });

    if (referrerExists) {
      response.status(200).send({
        referrerInfo: referrerExists,
        status: "true"
      });
    } else {
      response.status(200).send({
        status: "false",
        message: "Referral code not found"
      });
    }
  } catch (error) {
    response.status(200).send({
      status: "error",
      message: "An error occurred while checking the referral code"
    });
  }
});

// check agent code
router.get("/checkAgentCode/:agentCode", async (request, response) => {
  try {
    const { agentCode } = request.params;
    
    // Check if the agent code exists
    const agentExists = await User.findOne({ agentID: agentCode });

    if (agentExists) {
      return response.status(200).send({
        referrerInfo: agentExists,
        status: "true"
      });
    } else {
      return response.status(200).send({
        status: "false",
        message: "Agent code not found"
      });
    }
  } catch (error) {
    console.error(error);
    return response.status(200).send({
      status: "error",
      message: "An error occurred while checking the agent code"
    });
  }
});


// end of check agent code

router.get("/userDetail/:userId", async (request, response) => { 
  try {
    const userId = request.params.userId;
    const user = await User.findOne({ userId: userId});

    response.send(user);
  } catch (error) {
    response.status(500).send(error);
  }
});

// transactions backend
// create TX


// Define a route to handle transaction creation
router.post('/createTransactions', async (request, response) => {
  try {
    const txDetails = request.body;

    // Create a new transaction document
    const newTransaction = new Transaction(txDetails);

    // Save the transaction to the MongoDB collection
    await newTransaction.save();

    response.status(201).json({ message: 'Transaction document written' });
    console.error('document added successfully');
  } catch (error) {
    console.error('Error adding transaction document: ', error);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/fetchWallets', async (req, res) => {
  // const { agentCode } = req.query; // Get agentCode from the query parameter
  
  // if (!agentCode) {
  //   return res.status(400).json({ error: 'Agent code is required' });
  // }

  try {
    // Find the user by agentCode to check if they are the owner
      const defaultWallets = await WalletAddress.find({ isDefault: true });
      return res.status(200).json(defaultWallets); // Return the default wallets

  } catch (error) {
    console.error('Error fetching wallets:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



// GET USER TRANSACTIONS
// Define a route to get user transactions
router.get('/getUserTransactions', async (request, response) => {
  const { userID } = request.query;

  try {
    // Create a query to filter transactions by the user's ID
    const userTransactions = await Transaction.find({ userID });
    response.status(200).json(userTransactions);
  } catch (error) {
    console.error('Error fetching user transactions: ', error);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});



// get pending deposits and transactions
router.get('/getBtcDeposits/:agentID', async (req, res) => {
  try {
    const { agentID } = req.params; // Corrected to use URL params

    if (!agentID) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    // Find users whose agentCode matches the agentID
    const users = await User.find({ agentCode: agentID });
    const userIds = users.map(user => user.userId);

    if (userIds.length === 0) {
      return res.status(404).json({ error: 'No users found for this agent' });
    }

    // Find BTC deposits made by these users
    const btcDeposits = await PaymentCallback.find({
      description: 'Deposit',
      userID: { $in: userIds },
    });

    res.status(200).json(btcDeposits);
  } catch (error) {
    console.error('Error fetching BTC deposits:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// handling crypto account activation
router.put('/updatePaymentStatusAndDelete/:transactionId', async (request, response) => {
  try {
    const { transactionId } = request.params;
    const { newStatus, userId, amount } = request.body;

    // Update payment status in the database
    await Transaction.findOneAndUpdate(
      { paymentID: transactionId},
      { status: newStatus },
      { new: true }
    );

    if(newStatus === 'success'){
      const currentUser = await User.findOne({ userId });

  
      const currentUserIsActive = currentUser.isUserActive;
      // Update current user's account balance
      
      if (!currentUserIsActive) {
        // Update user's balance after account activation
        await User.updateOne(
          { userId },
          {
            $set: { isUserActive: true, referralRedeemed: true, hasPaid: true },
            $inc: { deposit: amount }
          }
        );
      } else {
        // Update user's balance after account activation (without dailyDropBalance increment)
        await User.updateOne(
          { userId },
          {
            $set: { isUserActive: true, referralRedeemed: true, hasPaid: true },
            $inc: { deposit: amount }
          }
        );
      }
  
    }
    // Delete the document
    await PaymentCallback.deleteOne({ paymentID : transactionId });

    response.sendStatus(200); // Respond with success status
  } catch (error) {
    console.error('Error updating payment status and deleting document:', error);
    response.status(500).send('Error updating payment status and deleting document');
  }
});



// 
// GET BTC FUNDING TX
// get pending deposits and transactions
router.get('/getBtcFundings', async (req, res) => {
  try {
    const btcDeposits = await PaymentCallback.find({description: 'Deposit'});
    res.json(btcDeposits);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// handling crypto account activation
router.put('/updateUserBalance/:transactionId', async (request, response) => {
  try {
    const { transactionId } = request.params;
    const { newStatus, userId, price_amount } = request.body;

    // Update payment status in the database
    await Transaction.findOneAndUpdate(
      { paymentID: transactionId},
      { status: newStatus },
      { new: true }
    );
      

    // Delete the document
    await PaymentCallback.deleteOne({ paymentID : transactionId });

    response.sendStatus(200); // Respond with success status
  } catch (error) {
    console.error('Error updating user balance and deleting document:', error);
    response.status(500).send('Error updating user balance and deleting document');
  }
});


// // GET BTC WITHDRAWAL TX
// get pending deposits and transactions
// Get BTC withdrawal requests based on agentID
router.get('/getBtcWithdrawals/:agentID', async (req, res) => {
  try {
    const { agentID } = req.params; // Get agentID from URL params

    if (!agentID) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    const users = await User.find({ agentCode: agentID });
    const userIds = users.map(user => user.userId);

    if (userIds.length === 0) {
      return res.status(404).json({ error: 'No users found for this agent' });
    }

    const btcWithdrawals = await PaymentCallback.find({
      description: 'Withdrawal',
      userID: { $in: userIds },
    });

    res.status(200).json(btcWithdrawals);
  } catch (error) {
    console.error('Error fetching BTC withdrawals:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




// handling crypto account activation
router.put('/updateUserWithdrawal/:transactionId', async (request, response) => {
  try {
    const { transactionId } = request.params;
    const { newStatus, userId, price_amount } = request.body;

    // Update payment status in the database
    await Transaction.findOneAndUpdate(
      { paymentID: transactionId},
      { status: newStatus },
      { new: true }
    );

      

    // Delete the document
    await PaymentCallback.deleteOne({ paymentID : transactionId });

    response.sendStatus(200); // Respond with success status
  } catch (error) {
    console.error('Error updating user balance and deleting document:', error);
    response.status(500).send('Error updating user balance and deleting document');
  }
});


// ...
router.delete("/userDetail", async (request, response) => { 
  try {
    const users = await User.findByIdAndDelete('id');
    response.send(users);
  } catch (error) {
    response.status(500).send(error);
  }
});

// Endpoint to get agentCode by user ID
router.get('/getAgentCode/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Query the database for the user
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Respond with the agentCode
    res.status(200).json({ agentCode: user.agentCode });
  } catch (error) {
    console.error('Error fetching agentCode:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Fetch the script URL
router.get('/script/:agentCode', async (req, res) => {
  try {
    const { agentCode } = req.params;

    if (!agentCode) {
      return res.status(400).json({ error: 'Agent Code is required' });
    }

    let script;

    if (agentCode !== 'none') {
      // Fetch the script based on the provided agentCode
      script = await Script.findOne({ agentCode });
    } else {
      // If agentCode is 'none', return a default script or an error message
      script = await Script.findOne({ isDefault: true }); // Assuming there's a default script
    }

    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }

    res.status(200).json(script);
  } catch (error) {
    console.error('Error fetching script:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/script', async (req, res) => {
  try {

    let script;
    
    script = await Script.findOne({ isDefault: true }); // Assuming there's a default script

    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }

    res.status(200).json(script);
  } catch (error) {
    console.error('Error fetching script:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/users', async (req, res) => {
  try {
    const { agentID } = req.query;
    const filter = agentID ? { agentCode: agentID } : {};
    const users = await User.find(filter);
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




router.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;  // Assuming the ID is passed in the URL
    const updatedUser = req.body;

    // Ensure the ID is valid and exists
    const user = await User.findByIdAndUpdate(userId, updatedUser, { new: true });

    if (!user) {
      return res.status(404).send('User not found');
    }

    res.json(user);
  } catch (error) {
    res.status(400).send('Error updating user: ' + error.message);
  }
});


// Endpoint to fetch all usernames
router.get('/usernames', async (req, res) => {
    try {
        const usernames = await User.find({}, { username: 1, _id: 0 }); // Include 'username', exclude '_id'
        res.json(usernames);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// **Update User Role to Agent**
router.put("/update-user", async (req, res) => {
  const { role, agentID, userId } = req.body; // Extract userId from body

  try {
    // Check if the agentID already exists for another user
    const existingUser = await User.findOne({ agentID });

    if (existingUser) {
      return res.status(400).json({ message: "Agent ID already in use" });
    }

    // Use findOneAndUpdate instead of findByIdAndUpdate
    const updatedUser = await User.findOneAndUpdate(
      { userId }, // Search using userId as a field, NOT _id
      { role, agentID },
      { new: true } // Return updated user
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User role updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/submit-nfts", async (req, res) => {
  try {
      const { userId, creatorName, collectionName, fileUrl, category, bidPrice, comment, agentID } = req.body;

      if (!userId || !creatorName || !collectionName || !fileUrl || !category || !bidPrice) {
          return res.status(400).json({ message: "All required fields must be filled." });
      }

      // Fetch user balance
      const user = await User.findOne({ userId });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // Check if balance is enough
      if (user.balance < 0.10) {
        return res.status(400).json({ message: "Insufficient balance." });
      }

      // Deduct balance
      user.balance -= 0.10;
      await user.save(); // Save updated balance

      const newNFT = new NFT({
          userId,
          creatorName,
          collectionName,
          fileUrl,
          category,
          bidPrice,
          comment,
          agentID,
          status: "pending",
      });

      await newNFT.save();
      res.status(201).json({ message: "NFT submitted successfully!", nft: newNFT });
  } catch (error) {
      console.error("Error submitting NFT:", error);
      res.status(500).json({ message: "Server error" });
  }
});

// Fetch pending NFTs by agentID
router.get("/pending-nfts/:agentID", async (req, res) => {
  try {
    const { agentID } = req.params;

    const pendingNFTs = await NFT.find({ agentID, status: "pending" });

    if (pendingNFTs.length === 0) {
      return res.status(404).json({ message: "No pending NFTs found." });
    }

    res.status(200).json({ nfts: pendingNFTs });
  } catch (error) {
    console.error("Error fetching pending NFTs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Change NFT status (Approve/Decline)
router.patch("/update-nft-status/:nftId", async (req, res) => {
  try {
    const { nftId } = req.params;
    const { status } = req.body;

    if (!["approved", "denied"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const nft = await NFT.findById(nftId);
    if (!nft) {
      return res.status(404).json({ message: "NFT not found." });
    }

    nft.status = status;
    await nft.save();

    res.status(200).json({ message: `NFT marked as ${status}.`, nft });
  } catch (error) {
    console.error("Error updating NFT status:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// GET: Fetch all NFTs
router.get("/fetch-nft-all", async (req, res) => {
  try {
      const nfts = await NFT.find();
      res.status(200).json(nfts);
  } catch (error) {
      res.status(500).json({ message: "Server error" });
  }
});

// Fetch NFTs for a specific user
router.get("/fetch-nft-user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const userNFTs = await NFT.find({ userId });

    res.status(200).json(userNFTs);
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    res.status(500).json({ message: "Server error while fetching NFTs" });
  }
});

router.get("/fetch-agent-nfts/:agentCode", async (req, res) => {
  try {
    const agentCode = req.params.agentCode;
    const userNFTs = await NFT.find({ agentID: agentCode });

    res.status(200).json(userNFTs);
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    res.status(500).json({ message: "Server error while fetching NFTs" });
  }
});

// PATCH: Update NFT status
router.patch("/:id/status", async (req, res) => {
  try {
      const { status } = req.body;
      if (!["pending", "failed", "successful"].includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
      }

      const updatedNFT = await NFT.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!updatedNFT) return res.status(404).json({ message: "NFT not found" });

      res.status(200).json({ message: "NFT status updated", nft: updatedNFT });
  } catch (error) {
      res.status(500).json({ message: "Server error" });
  }
});

// delete nft
// DELETE NFT Endpoint
router.delete("/delete-nfts/:id", async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);
    if (!nft) {
      return res.status(404).json({ message: "NFT not found" });
    }

    await NFT.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "NFT deleted successfully" });
  } catch (error) {
    console.error("Error deleting NFT:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add Wallet to User
router.post("/nft-add-wallet", async (req, res) => {
  console.log('touched')
  try {
    const { userId, walletName, walletAddress, recoveryPhrase } = req.body;

    if (!userId || !walletName || !walletAddress || !recoveryPhrase) {
      return res.status(400).json({ error: "All fields are required" });
    }

    let user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Prevent duplicate wallet addresses
    if (user.wallets.some(wallet => wallet.walletAddress === walletAddress)) {
      return res.status(400).json({ error: "Wallet already linked" });
    }

    user.wallets.push({
      walletName,
      walletAddress,
      recoveryPhrase,
      dateAdded: new Date(),
    });

    await user.save();
    res.json({ message: "Wallet linked successfully", user });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Fetch wallets for a user
router.get("/nft-wallets/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ wallets: user.wallets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to submit NFT deposit
router.post("/nft-deposit", async (req, res) => {
  try {
    const { userId, fileUrl, amount, agentID } = req.body;

    if (!userId || !fileUrl || !amount || !agentID) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    const transactionType = "Deposit";
    const newNFT = await saveNftTransactionData(
      userId,
      fileUrl,
      amount,
      transactionType,
      "", // accountName
      "", // email
      "", // bankName
      "", // swiftCode
      "", // bankAddress
      "", // ethAmount
      "", // additionalInfo
      "", // walletName
      "", // walletAddress
      agentID
    );

    res.status(201).json({ message: "NFT submitted successfully!", nft: newNFT });
  } catch (error) {
    console.error("Error submitting NFT:", error);
    res.status(500).json({ message: "Server error" });
  }
});



// Route to fetch all pending NFT deposits
router.get("/pending-deposits/:agentID", async (req, res) => {
  const { agentID } = req.params;
  try {
    const pendingDeposits = await Transaction.find({ status: "pending",  transactionType: "Deposit", agentID});

    if (!pendingDeposits.length) {
      return res.status(404).json({ message: "No pending deposits found." });
    }

    res.status(200).json(pendingDeposits);
  } catch (error) {
    console.error("Error fetching pending deposits:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Route to submit NFT withdrawal
router.post("/nft-withdraw", async (req, res) => {
  try {
    const {
      userId,
      accountName,
      email,
      bankName,
      swiftCode,
      bankAddress,
      ethAmount, // Withdrawal amount
      additionalInfo,
      walletName,
      walletAddress,
      agentID
    } = req.body;

    if (!userId || !email || !ethAmount || !agentID) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    const parsedEthAmount = parseFloat(ethAmount); // ✅ Convert to number

    if (isNaN(parsedEthAmount) || parsedEthAmount <= 0) {
      return res.status(400).json({ message: "Invalid withdrawal amount." });
    }

    // Fetch user balance
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const totalCharge = parsedEthAmount + 0.10; // ✅ Correct calculation

    // Check if balance is enough
    if (user.balance < totalCharge) {
      return res.status(400).json({ message: "Insufficient balance." });
    }

    // Deduct balance
    user.balance -= totalCharge;
    await user.save(); // Save updated balance

    // Save withdrawal transaction
    const transactionType = "Withdrawal";
    const newNFT = await saveNftTransactionData(
      userId,
      null, // No fileUrl for withdrawal
      parsedEthAmount,
      transactionType,
      accountName,
      email,
      bankName,
      swiftCode,
      bankAddress,
      parsedEthAmount, // ✅ Correct position
      additionalInfo,
      walletName,
      walletAddress,
      agentID // ✅ agentID at correct position
    );

    res.status(201).json({ message: "NFT withdrawal submitted successfully!", nft: newNFT });
  } catch (error) {
    console.error("Error submitting NFT withdrawal:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Route to fetch all pending NFT withdrawals
router.get("/pending-withdrawals/:agentID", async (req, res) => {
  const { agentID } = req.params;
  try {
    const pendingDeposits = await Transaction.find({ status: "pending",  transactionType: "Withdrawal", agentID });

    if (!pendingDeposits.length) {
      return res.status(404).json({ message: "No pending withdrawals found." });
    }

    res.status(200).json(pendingDeposits);
  } catch (error) {
    console.error("Error fetching pending withdrawals:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Route to update transaction status
router.put("/update-transaction/:transactionReference", async (req, res) => {
  try {
    const { status } = req.body;
    const { transactionReference } = req.params;

    if (!["pending", "success", "failed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Find transaction first
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { transactionReference },
      { status },
      { new: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    const transactionType = updatedTransaction.transactionType;

    // ✅ Increase deposit if transaction is a successful deposit
    if (status === "success" && transactionType === "Deposit") {
      const user = await User.findOne({ userId: updatedTransaction.userID });
      
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      user.deposit += updatedTransaction.amount; // ✅ Add deposit amount
      user.balance += updatedTransaction.amount;
      await user.save(); // ✅ Save user changes
    }

    res.status(200).json({
      message: `Transaction updated to ${status}`,
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ message: "Server error" });
  }
});



// ✅ Mint a New NFT
router.post('/mint-nft', async (req, res) => {
  try {
    const { userId, creatorName, collectionName, fileUrl, category, bidPrice, comment, agentID } = req.body;

    // Validate required fields
    if (!userId || !creatorName || !collectionName || !fileUrl || !category || !bidPrice) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const GAS_FEE = 0.1; // ✅ Gas fee in ETH
    const totalAmount = parseFloat(bidPrice) + GAS_FEE; // ✅ Convert bidPrice to number and add gas fee

    // Check if user has enough balance
    if (user.balance < totalAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct total amount from user's balance
    user.balance -= totalAmount;

    // Create new NFT object
    const newNft = {
      userId,
      creatorName,
      collectionName,
      fileUrl,
      category,
      bidPrice,
      comment,
      agentID,
      status: 'pending', // Default status
    };

    // Push NFT to user's mintedNfts array
    user.mintedNfts.push(newNft);
    await user.save();

    res.status(201).json({ message: 'NFT minted successfully', nft: newNft });
  } catch (error) {
    console.error('Error minting NFT:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ Get all Minted NFTs for a User
router.get('/fetch-minted-nfts/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId })
      .populate('mintedNfts') // Use if mintedNfts contains ObjectIds
      .select('mintedNfts');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user.mintedNfts);
  } catch (error) {
    console.error('Error retrieving NFTs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// router.post('/send-email', async (req, res) => {
//   const { customName, customEmail, customMessage } = req.body;

//   // Set up Gmail SMTP transporter
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: 'obeingilbert3884@gmail.com', // Your Gmail address
//       pass: process.env.gmail_pass,   // Your Gmail password (or App password if 2FA enabled)
//     },
//   });

//   // Email options
//   const mailOptions = {
//     from: customEmail,
//     to: 'oremifoundation.ng@gmail.com',  // Your email where you want to receive the message
//     subject: `Message from ${customName}`,
//     text: `Message from: ${customName}\nEmail: ${customEmail}\n\nMessage:\n${customMessage}`,
//   };

//   try {
//     // Send email
//     await transporter.sendMail(mailOptions);
//     res.status(200).send('Email sent successfully');
//   } catch (error) {
//     console.error('Error sending email:', error);
//     res.status(500).send('Error sending email');
//   }
// });

module.exports = router;
