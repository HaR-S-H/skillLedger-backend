import mongoose from "mongoose";
import jwt from "jsonwebtoken";
const adminSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    }
});




adminSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        walletAddress: this.walletAddress,
        role:"admin"
    }, process.env.ACCESS_TOKEN_SECRET,
        {
       expiresIn:process.env.ACCESS_TOKEN_EXPIRY
   })
}

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;