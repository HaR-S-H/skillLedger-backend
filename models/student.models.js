import mongoose from "mongoose";
import jwt from "jsonwebtoken";
const studentSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: { 
        type: String,
    },
    walletAddress: {
        type: String,
        unique: true,
        required: true
    },
    avatar: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
        default: null
    },
    linkedin: {
        type: String,
    },
    github: {
        type:String
    },
    otpExpires: {
        type: Date
    },
    description: {
        type: String,
    },
    phone:{
    type:String,
    }
},{timestamps: true});


studentSchema.pre("save", function (next) {
  if (this.walletAddress) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }
  next();
});


studentSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        name: this.name,
        role:"student"
    }, process.env.ACCESS_TOKEN_SECRET,
        {
       expiresIn:process.env.ACCESS_TOKEN_EXPIRY
   })
}
const Student= mongoose.model("Student", studentSchema);

export default Student;