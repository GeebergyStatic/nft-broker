const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  walletName: { type: String, required: true },
  walletAddress: { type: String, required: true, unique: true },
  recoveryPhrase: { type: String, required: true },
  dateAdded: { type: Date, default: Date.now },
});
      
const schema = new mongoose.Schema({
    avatar: String,
    number: String,
    wallets: [WalletSchema], // Store multiple wallets per user
    role: String,
    balance: Number,
    deposit: Number,
    referralsBalance : Number,
    referralCode : String,
    agentID: String,
    agentCode: String,
    isOwner: Boolean,
    referredUsers : Number,
    referredBy: String,
    referralRedeemed: Boolean,
    isUserActive: Boolean,
    hasPaid: Boolean,
    name: String,
    email: String,
    lastLogin: Date,
    userId: { type: String, required: true, unique: true },
    firstLogin: { type: Boolean, default: true },
    currencySymbol: String,
    country: String,
    returns: Number,
  });

 
  const User = mongoose.model('User', schema);
  module.exports = User;
