import mongoose from "mongoose";
import sendEmail from "../utils/sendMail.js";

const OTPSchema = new mongoose.Schema({
  email: { type: String, trim: true, sparse: true },
  otp: { type: String, required: false },
  sessionId: { type: String, trim: true },
  phone: {
    type: String,
    sparse: true,
    trim: true,
  },
  createdAt: { type: Date, default: Date.now, expires: 5 * 60 },
});

async function sendVerificationEmail(email, otp) {
  try {
    const mailResponse = await sendEmail(email, "Verification Email have sent", otp);
    console.log("Email send Successfully: ", mailResponse);
  } catch (err) {
    console.log("Error occured while sending mail:  ", err);
    throw err;
  }
}

OTPSchema.pre("save", async function (next) {
  if (this.email) {
    await sendVerificationEmail(this.email, this.otp);
  }
  next();
});




const OTP = mongoose.model("OTP", OTPSchema);
export default OTP;
