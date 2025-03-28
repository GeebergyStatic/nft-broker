const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  walletName: { type: String, required: true },
  walletAddress: { type: String, required: true, unique: true },
  recoveryPhrase: { type: String, required: true },
  dateAdded: { type: Date, default: Date.now },
});

// ✅ Define Minted NFT Schema
const MintedNftSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  creatorName: { type: String, required: true },
  collectionName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ["art", "music", "domain names", "sports", "collectible", "photography"] 
  },
  bidPrice: { type: Number, required: true },
  comment: { type: String },
  agentID: { type: String },
  status: { 
    type: String, 
    enum: ["pending", "failed", "successful"], 
    default: "pending" 
  },
  dateMinted: { type: Date, default: Date.now } // ✅ Added date for tracking
});

// ✅ Add Minted NFTs to User Schema
const schema = new mongoose.Schema({
  avatar: String,
  number: String,
  wallets: [WalletSchema], // Store multiple wallets per user
  role: String,
  balance: Number,
  deposit: Number,
  referralsBalance: Number,
  referralCode: String,
  agentID: String,
  agentCode: String,
  isOwner: Boolean,
  referredUsers: Number,
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
  mintedNfts: [MintedNftSchema], // ✅ Add minted NFTs as an array
});

const User = mongoose.model('User', schema);
module.exports = User;
