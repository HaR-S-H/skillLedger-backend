import mongoose from "mongoose";
import jwt from "jsonwebtoken";
const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    description: {
        type: String,
        required: true,
  },
    website: {
        type: String,
        required: true,
        unique: true,
    },
    walletAddress: {
        type: String,
        unique: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
    rejectionReason:{
        type: String,
        default: null,
    },
    credentialTypes: [String],
    contactPerson: {
        type: String,
        required: true,
    },
    transactionHash: {
        type: String,
    },
    blockNumber: {
        type: String,
    },
},{timestamps: true});

organizationSchema.pre("save", function (next) {
  if (this.walletAddress) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }
  next();
});


organizationSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        walletAddress: this.walletAddress,
        role:"organization"
    }, process.env.ACCESS_TOKEN_SECRET,
        {
       expiresIn:process.env.ACCESS_TOKEN_EXPIRY
   })
}

const Organization = mongoose.model("Organization", organizationSchema);
export default Organization;
