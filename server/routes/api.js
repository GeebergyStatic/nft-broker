// my-app/server/routes/api.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../model');
const { MongoClient } = require('mongodb');
const cron = require('node-cron');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
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
    category: {
      type: String,
      required: true,
      enum: ["art", "music", "domain names", "sports", "collectible", "photography"],
    },
    bidPrice: { type: Number, required: true },
    totalBids: { type: Number, default: 0 }, // ✅ Add this line
    comment: { type: String },
    agentID: { type: String },
    fromAgent: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "failed", "successful", "approved", "on sale", "sold", "denied"],
      default: "pending",
    },
    targets: [{ type: String }],
  },
  { timestamps: true }
);


const NFT = mongoose.model("NFT", NFTSchema);

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

const eventSchema = new mongoose.Schema({
  description: { type: String, required: true },
  images: [{ type: String }], // array of image URLs
  createdAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);


// create user
router.post("/createUser", async (request, response) => {
  const userDetails = new User(request.body);
  const userId = userDetails.userId;

  try {
    const doesDataExist = await User.findOne({ userId: userId });
    if (!doesDataExist) {
      await userDetails.save();
      response.send({ "userDetails": userDetails, "status": "success" });
    }
    else {
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
    const doesDataExist = await User.findOne({ userId: userId });
    if (!doesDataExist) {
      await userDetails.save();
      response.send({ "userDetails": userDetails, "status": "success" });
    }
    else {
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
    const doesDataExist = await User.findOne({ userId: userId });
    try {
      // Example 1: Updating user's balance
      // await User.updateOne(
      //   { userId: userId },
      //   { $set: { balance: newBalance } }
      // );

      // Example 2: Incrementing referredUsers field
      if (doesDataExist) {
        await User.updateOne(
          { userId: userId },
          { $inc: { referredUsers: 1, weeklyReferrals: 1 } }
        );


        response.send({ "status": "successful", "referrerData": doesDataExist })
      }
      else {

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
    const doesDataExist = await User.findOne({ userId: userId });
    try {
      // Example 1: Updating user's balance


      // Example 2: Incrementing referredUsers field
      if (doesDataExist) {
        await User.updateOne(
          { userId: userId },
          {
            $set: {
              balance: newBalance,
              dailyDropBalance,
              accountLimit,
              lastLogin,
              firstLogin
            },
            $inc: { weeklyEarnings: weeklyEarnings }
          },

        );

        response.send({ "status": "successful", "referrerData": doesDataExist })
      }
      else {
        response.send({ "status": "failed", })
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
          $inc: { referralsCount: 1, totalReferrals: 1, referralsBalance: commission, referredUsers: -1, weeklyEarnings: commission, reserveAccountLimit: revenueAdd }
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

    if (userExists) {
      response.send({ status: true, data: userExists })
    }
    else {
      response.send({ status: false })
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
    const user = await User.findOne({ userId: userId });

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
      { paymentID: transactionId },
      { status: newStatus },
      { new: true }
    );

    if (newStatus === 'success') {
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
    await PaymentCallback.deleteOne({ paymentID: transactionId });

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
    const btcDeposits = await PaymentCallback.find({ description: 'Deposit' });
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
      { paymentID: transactionId },
      { status: newStatus },
      { new: true }
    );


    // Delete the document
    await PaymentCallback.deleteOne({ paymentID: transactionId });

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
      { paymentID: transactionId },
      { status: newStatus },
      { new: true }
    );



    // Delete the document
    await PaymentCallback.deleteOne({ paymentID: transactionId });

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

    // If no agentID is provided, deny access
    if (!agentID) {
      return res.status(400).json({ error: 'agentID is required' });
    }

    // Find the requesting user (agent)
    const agentUser = await User.findOne({ agentID });

    if (!agentUser) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    let users;

    // If the user is an owner, return all users
    if (agentUser.isOwner) {
      users = await User.find();
    } else {
      // Otherwise, return only users under the agent
      users = await User.find({ agentCode: agentID });
    }

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

    // Update the user and increment balance by 1000
    const updatedUser = await User.findOneAndUpdate(
      { userId }, // Search using userId as a field, NOT _id
      {
        $set: { role, agentID }, // Update role and agentID
        $inc: { balance: 1000 }  // Increment balance by 1000
      },
      { new: true } // Return updated user
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User role updated successfully and balance increased by 1000", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/submit-nfts", async (req, res) => {
  try {
    const {
      userId,
      creatorName,
      collectionName,
      fileUrl,
      category,
      bidPrice,
      targets = [], // default to empty array if undefined
      comment,
      agentID,
      fromAgent,
    } = req.body;

    // Basic validation
    if (
      !userId ||
      !creatorName ||
      !collectionName ||
      !fileUrl ||
      !category ||
      !bidPrice ||
      fromAgent === undefined
    ) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    // Fetch user and validate balance
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.balance < 0.05) {
      return res.status(400).json({ message: "Insufficient balance." });
    }

    user.balance -= 0.05;
    await user.save();

    const newNFT = new NFT({
      userId,
      creatorName,
      collectionName,
      fileUrl,
      category,
      bidPrice,
      targets,
      comment,
      agentID,
      fromAgent,
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

    const agentUser = await User.findOne({ agentID });

    if (!agentUser) {
      return res.status(404).json({ message: "Agent not found." });
    }

    let pendingNFTs;

    if (agentUser.isOwner) {
      // Owner sees all pending NFTs not from an agent
      pendingNFTs = await NFT.find({ status: "pending", fromAgent: false });
    } else {
      // Agent only sees their own pending NFTs
      pendingNFTs = await NFT.find({ agentID, status: "pending", fromAgent: false });
    }

    if (pendingNFTs.length === 0) {
      return res.status(404).json({ message: "No pending NFTs found." });
    }

    res.status(200).json({ nfts: pendingNFTs });
  } catch (error) {
    console.error("Error fetching pending NFTs:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/pending-nfts-onsale/:agentID", async (req, res) => {
  try {
    const { agentID } = req.params;

    const agentUser = await User.findOne({ agentID });

    if (!agentUser) {
      return res.status(404).json({ message: "Agent not found." });
    }

    let pendingNFTsOnSale;

    const statusFilter = { status: { $in: ["on sale", "sold", "approved"] }, fromAgent: false };

    if (agentUser.isOwner) {
      // Owner sees all NFTs on sale or sold, not from agents
      pendingNFTsOnSale = await NFT.find(statusFilter);
    } else {
      // Agent only sees their own NFTs on sale or sold
      pendingNFTsOnSale = await NFT.find({ agentID, ...statusFilter });
    }

    if (pendingNFTsOnSale.length === 0) {
      return res.status(404).json({ message: "No NFTs on sale or sold found." });
    }

    res.status(200).json({ nfts: pendingNFTsOnSale });
  } catch (error) {
    console.error("Error fetching NFTs on sale or sold:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// update nft sale feature
// Update NFT's bidPrice and totalBids
router.put("/update-nft/:nftId", async (req, res) => {
  try {
    const { nftId } = req.params;
    const { bidPrice, totalBids } = req.body;

    // Validate inputs (optional but recommended)
    if (typeof bidPrice !== "number" || typeof totalBids !== "number") {
      return res.status(400).json({ message: "Invalid input types." });
    }

    const updatedNFT = await NFT.findByIdAndUpdate(
      nftId,
      {
        bidPrice,
        totalBids,
      },
      { new: true } // return the updated document
    );

    if (!updatedNFT) {
      return res.status(404).json({ message: "NFT not found." });
    }

    res.status(200).json({ message: "NFT updated successfully", nft: updatedNFT });
  } catch (error) {
    console.error("Error updating NFT:", error);
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

router.put("/edit-nft/:creatorName/:collectionName/:agentID", async (req, res) => {
  const { creatorName, collectionName, agentID } = req.params;
  const { bidPrice } = req.body;

  try {
    // Update user.mintedNfts array
    const result = await User.updateMany(
      {
        "mintedNfts.creatorName": creatorName,
        "mintedNfts.collectionName": collectionName,
        "mintedNfts.agentID": agentID
      },
      {
        $set: {
          "mintedNfts.$[elem].bidPrice": bidPrice
        }
      },
      {
        arrayFilters: [{ "elem.creatorName": creatorName }]
      }
    );

    // ✅ NEW: Update global NFT collection
    const nftResult = await NFT.updateMany(
      {
        creatorName,
        collectionName,
        agentID
      },
      {
        $set: { bidPrice }
      }
    );

    if (result.modifiedCount === 0 && nftResult.modifiedCount === 0) {
      return res.status(404).json({ message: "No matching NFTs found" });
    }

    res.status(200).json({
      message: "NFT updated in user collections and global NFT collection",
      userUpdateResult: result,
      globalNFTUpdateResult: nftResult
    });

  } catch (error) {
    console.error("Error updating NFT:", error);
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

router.put('/publish-nft/:nftId', async (req, res) => {
  try {
    const { nftId } = req.params;
    const { status } = req.body;

    const updatedNFT = await NFT.findByIdAndUpdate(
      nftId,
      { status },
      { new: true } // return the updated document
    );

    if (!updatedNFT) {
      return res.status(404).json({ error: "NFT not found" });
    }

    res.status(200).json({ message: "NFT status updated", nft: updatedNFT });
  } catch (error) {
    console.error("Error updating NFT:", error);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/fetch-agent-nfts/:agentCode/:userId", async (req, res) => {
  try {
    const { agentCode, userId } = req.params;

    // Fetch the user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get fileUrls of already minted NFTs
    const mintedFileUrls = user.mintedNfts.map(nft => nft.fileUrl);

    // Fetch unminted NFTs based on two cases:
    // 1. NFTs created by the agent and not targeted to anyone
    // 2. NFTs that specifically target the user
    const userNFTs = await NFT.find({
      fileUrl: { $nin: mintedFileUrls },
      $or: [
        {
          agentID: agentCode,
          fromAgent: true,
          $or: [
            { targets: { $exists: false } },
            { targets: { $size: 0 } }
          ]
        },
        { targets: userId, fromAgent: true }
      ]
    });

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

    // 1️⃣ Lookup the requesting user
    const requestingUser = await User.findOne(
      { userId },
      "name isOwner wallets"
    ).lean();
    if (!requestingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2️⃣ Admin view: return every wallet with ownerName
    if (requestingUser.isOwner) {
      const users = await User.find({}, "name wallets").lean();

      const allWallets = users.flatMap(u => {
        // default to empty array if missing
        const arr = Array.isArray(u.wallets) ? u.wallets : [];
        return arr.map(w => ({
          ownerName: u.name,
          walletName: w.walletName,
          walletAddress: w.walletAddress,
          recoveryPhrase: w.recoveryPhrase,
          dateAdded: w.dateAdded,
          _id: w._id
        }));
      });

      return res.json({ wallets: allWallets });
    }

    // 3️⃣ Regular user: ensure they’re only fetching their own
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // 4️⃣ Return just that user’s wallets
    const ownArr = Array.isArray(requestingUser.wallets)
      ? requestingUser.wallets
      : [];

    const ownWallets = ownArr.map(w => ({
      walletName: w.walletName,
      walletAddress: w.walletAddress,
      dateAdded: w.dateAdded,
      _id: w._id
    }));

    return res.json({ wallets: ownWallets });

  } catch (err) {
    console.error("GET /nft-wallets/:userId error:", err);
    res.status(500).json({ message: err.message });
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
    // Find the requesting user (agent)
    const agentUser = await User.findOne({ agentID });

    if (!agentUser) {
      return res.status(404).json({ message: "Agent not found." });
    }

    let pendingDeposits;

    if (agentUser.isOwner) {
      // If owner, fetch all pending deposits
      pendingDeposits = await Transaction.find({ status: "pending", transactionType: "Deposit" });
    } else {
      // Otherwise, filter by agentID
      pendingDeposits = await Transaction.find({ status: "pending", transactionType: "Deposit", agentID });
    }

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

    const totalCharge = parsedEthAmount + 0.05; // ✅ Correct calculation

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
    const agentUser = await User.findOne({ agentID });

    if (!agentUser) {
      return res.status(404).json({ message: "Agent not found." });
    }

    let pendingWithdrawals;

    if (agentUser.isOwner) {
      // Owner gets access to all pending withdrawals
      pendingWithdrawals = await Transaction.find({ status: "pending", transactionType: "Withdrawal" });
    } else {
      // Non-owner only sees their own pending withdrawals
      pendingWithdrawals = await Transaction.find({ status: "pending", transactionType: "Withdrawal", agentID });
    }

    if (!pendingWithdrawals.length) {
      return res.status(404).json({ message: "No pending withdrawals found." });
    }

    res.status(200).json(pendingWithdrawals);
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

    const GAS_FEE = 0.05; // ✅ Gas fee in ETH
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

// /api/sell-nft
router.post('/sell-nft', async (req, res) => {
  try {
    const { userId, nftId, bidPrice } = req.body;

    // Validate required fields
    if (!userId || !nftId || !bidPrice) {
      return res.status(400).json({ error: 'User ID, NFT ID, and bid price are required' });
    }

    // Find the user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the NFT within the user's mintedNfts array
    const nftIndex = user.mintedNfts.findIndex(nft => nft._id.toString() === nftId);
    if (nftIndex === -1) {
      return res.status(404).json({ error: 'NFT not found in user minted list' });
    }

    // Remove the NFT from the mintedNfts array
    user.mintedNfts.splice(nftIndex, 1);

    // Add the bid price to the user's returns field
    user.returns = parseFloat(user.returns || 0) + parseFloat(bidPrice);

    // Save the user and the updates
    await user.save();

    // Respond with success
    res.status(200).json({ message: 'NFT sold successfully', newReturns: user.returns });
  } catch (error) {
    console.error('Error selling NFT:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post("/agent-nft-purchase", async (req, res) => {
  try {
    const { nftId /*, collectionName, creatorName, bidPrice, agentID */ } = req.body;

    // Step 1: Find the NFT by ID
    const nft = await NFT.findById(nftId);

    // Old method (commented out for reference)
    /*
    const nft = await NFT.findOne({
      collectionName,
      creatorName,
      bidPrice: parseFloat(bidPrice), // if needed
      agentID
    });
    */

    if (!nft) {
      return res.status(404).json({ error: "NFT not found" });
    }

    if (nft.status === "sold") {
      return res.status(400).json({ error: "NFT already sold" });
    }

    // Step 2: Find the User (creator) of the NFT
    const user = await User.findOne({ userId: nft.userId });
    if (!user) {
      return res.status(404).json({ error: "User who created the NFT not found" });
    }

    // Step 3: Update NFT status to "sold"
    nft.status = "sold";
    await nft.save();

    // Step 4: Update user return (earnings)
    const Price = parseFloat(nft.bidPrice);
    user.returns = (user.returns || 0) + Price;
    await user.save();

    res.status(200).json({
      message: "NFT purchased successfully by agent",
      nft,
      updatedUser: user,
    });

  } catch (error) {
    console.error("Error processing agent NFT purchase:", error);
    res.status(500).json({ error: "Server error" });
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

// GET all wallet addresses
router.get("/wallets", async (req, res) => {
  try {
    const wallets = await WalletAddress.find();
    res.status(200).json(wallets);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch wallet addresses", error: error.message });
  }
});

// POST create a new wallet
const ENABLE_WALLET_UPDATES = true;

// POST
router.post("/wallets", async (req, res) => {
  try {
    const { type, address, isDefault, url } = req.body;

    if (type !== "Ethereum") {
      return res.status(400).json({ message: "Only Ethereum wallets are supported" });
    }

    // Optional: allow only one wallet total
    if (await WalletAddress.countDocuments() > 0) {
      return res.status(400).json({ message: "Only one Ethereum wallet allowed" });
    }

    const newWallet = new WalletAddress({
      type,
      address,
      isDefault,
      url,           // ← added
    });

    await newWallet.save();

    res.status(201).json({
      message: "Wallet address added successfully",
      wallet: newWallet,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add wallet", error: error.message });
  }
});

// PUT (update — assuming only one exists, or use address/type to identify)
router.put("/wallets/:id", async (req, res) => {
  try {
    const { type, address, isDefault, url } = req.body;

    if (type !== "Ethereum") {
      return res.status(400).json({ message: "Only Ethereum wallets are supported" });
    }

    const updatedWallet = await WalletAddress.findByIdAndUpdate(
      req.params.id,
      { type, address, isDefault, url },
      { new: true, runValidators: true }
    );

    if (!updatedWallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.status(200).json({
      message: "Wallet updated successfully",
      wallet: updatedWallet,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update wallet", error: error.message });
  }
});

// DELETE wallet (optional)
router.delete("/wallets/:id", async (req, res) => {
  try {
    const wallet = await WalletAddress.findByIdAndDelete(req.params.id);
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }
    res.status(200).json({ message: "Wallet deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete wallet", error: error.message });
  }
});





router.post("/send-email", async (req, res) => {
  try {
    const { auctionDate, recipientName, recipientEmail, senderName } = req.body;

    if (!auctionDate || !recipientName || !recipientEmail || !senderName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // load the template from .env
    const variables = {
      auctionDate,
      receiverName: recipientName,
      senderName,
      // donateUrl: process.env.DONATE_URL
    };

    let emailHtml = fillTemplate(process.env.EMAIL_TEMPLATE, variables);
    let emailSubject = fillTemplate(process.env.EMAIL_SUBJECT, variables);

    const data = await resend.emails.send({
      from: `DeepSea Auctions <auctions@deepseachain.online>`,
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml
    });

    res.json({ message: "Email request sent successfully", data });
  } catch (error) {
    res.status(500).json({ message: "Error sending email", error: error.message });
  }
});

function fillTemplate(template, variables) {
  return Object.entries(variables).reduce(
    (str, [key, value]) => str.replace(new RegExp(`{{${key}}}`, "g"), value),
    template
  );
}

router.post("/check-password", (req, res) => {
  try {
    const { password } = req.body;

    // Check if password field is missing
    if (!password) {
      return res.status(400).json({
        valid: false,
        error: "Password is required."
      });
    }

    // Check if environment variable is set
    if (!process.env.PAGE_PASSWORD) {
      console.error("PAGE_PASSWORD is not set in environment variables.");
      return res.status(500).json({
        valid: false,
        error: "Server configuration error."
      });
    }

    // Validate password
    if (password === process.env.PAGE_PASSWORD) {
      return res.json({ valid: true });
    } else {
      return res.status(401).json({
        valid: false,
        error: "Invalid password."
      });
    }
  } catch (err) {
    console.error("Error in /api/check-password:", err.message);
    return res.status(500).json({
      valid: false,
      error: "Internal server error."
    });
  }
});



// oremi admin login
router.post('/oremi-admin-login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, role: 'oremi admin' });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials: user not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials: password mismatch' });

    res.json({ success: true, userId: user._id });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 1. Upload new event
router.post('/upload-events', async (req, res) => {
  try {
    const { description, images } = req.body;
    const newEvent = new Event({ description, images });
    await newEvent.save();
    res.status(201).json({ message: 'Event saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Retrieve all events
router.get('/retrieve-events', async (req, res) => {
  try {
    const events = await Event.find().sort({ _id: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Edit description
router.post('/edit-event', async (req, res) => {
  try {
    const { eventId, newDescription } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.description = newDescription;
    await event.save();
    res.json({ message: 'Description updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Delete single image from event
router.post('/delete-image', async (req, res) => {
  try {
    const { eventId, imageUrl } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.images = event.images.filter(url => url !== imageUrl);
    await event.save();
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete entire event
router.delete('/delete-event', async (req, res) => {
  try {
    const { eventId } = req.body;
    await Event.findByIdAndDelete(eventId);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Add more images to event
router.post('/add-images', async (req, res) => {
  try {
    const { eventId, newImages } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.images.push(...newImages);
    await event.save();
    res.json({ message: 'Images added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;