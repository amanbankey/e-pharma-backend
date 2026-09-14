import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator"
import sendEmail from "../utils/sendMail.js"
import OTP from "../models/OTP.js";
import Profile from "../models/Profile.js";
import dotenv from "dotenv"
import crypto from "crypto";

dotenv.config()

export const login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if(!email || !password) {
        return res.status(404).json({
            message: "Please input valid details!",
            success: false
        })
      }

      if(!user) {
        return res.status(400).json({
          success: false,
          message: "User is not registered, please signup first",
        });
      }

      const match = await bcrypt.compare(password, user.password);

      if (match) {
        const payload = {
          email: user.email,
          id: user._id,
          role: user.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: "2h",
        });

        user.token = token;
        user.password = undefined;

        const options = {
          expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          httpOnly: true,
        };

        res.cookie("token", token, options).status(200).json({
          success: true,
          user,
          token,
          message: "Logged In successfully",
        });

      } else {
        return res.status(400).json({
          success: false,
          message: "Password is incorrect",
        });
      }
    } catch (err) {
      return res.status(500).json({
        message: "Login failure, please try again",
        success: false,
      });
    }
  };


export const signup =  async(req, res) => {

    try{
        const {fullName, email, password, phone, otp} = req.body;

        if(!fullName || !email || !password || !phone) {
            return res.status(404).json({
                message: "Please input valid details!",
                success: false
            })
        }

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(404).json({
                message: "Email already exist!",
                success: false
            })
        }

        const recentOtp = await OTP.find({email}).sort({ createdAt: -1 }).limit(1)

        if(recentOtp.length === 0){
         return res.status(400).json({
            message: "The Otp is not generated",
            success: false,
          })
        }
        else if( otp !== recentOtp[0].otp ){
         return  res.status(400).json({
            message: "The Otp is not valid",
            success: false,
          })
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const profileDetails =  await Profile.create({
          gender:null,
          dateOfBirth:null,
          about:null,
          contactNumber:phone,
        })
        const data = await User.create({
          email,
          password:hashedPassword,
          fullName:fullName,
          phone:phone,
          additionalDetails: profileDetails._id
        });

        return res.status(200).json({
            message: "Signup successfully",
            success: true,
            data,
        })

    }catch(err){
        return res.status(500).json({
          message: "User cannot be registered. Please try again.",
          success: false,
        });
    }
}

export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body

     if(!email) {
        return res.status(404).json({
            message: "Please input valid details!",
            success: false
        })
      }

    const checkUserPresent = await User.findOne({ email })
    if (checkUserPresent) {
      return res.status(401).json({
        success: true,
        message: "User already registered",
      })
    }
        let otp;
      let result;

      do {
        otp = otpGenerator.generate(4, {
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
          specialChars: false,
        });

        result = await OTP.findOne({ otp });
      } while (result);

     const otpDoc = await OTP.create({
        email,
        otp,
      });

      await sendEmail(email, "Your Vernal Rx OTP", `Your OTP for signup is ${otp}. It expires in 5 minutes.`)

    res.status(200).json({
      success: true,
      message: "OTP Sent successfully",
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

export const resetPasswordToken = async (req, res) => {
    try {

      const { email } = req.body;
      if (!email) {
        return res.status(401).json({
          message: "Your email is not correct",
          success: false,
        });
      }

      const user = await User.findOne({ email: email })
      if (!user) {
        return res.json({
          success: false,
          message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
        })
      }
      let token = crypto.randomUUID();

      await User.findOneAndUpdate(
        { email: email },
        {
          token: token,
          resetPasswordExpires: Date.now() + 60 * 60 * 1000,
        },
        { new: true }
      );

      const url = `${process.env.FRONTEND_URL}/update-password?token=${token}`;

      await sendEmail(email, "Password reset link",
         `Your Link for email verification is ${url}. Please click this url to reset your password.`)

      res.status(200).json({
        message: "Email Sent successfully, please check your email",
        success: true,
      });
    } catch (err) {
      return res.status(500).json({
        message: "Failed to send mail",
        success: false,
      });
    }
  };

  export const resetPassword = async (req, res) => {
    try {
      const { token, password, confirmPassword } = req.body;

       if(!token || !password || !confirmPassword) {
        return res.status(404).json({
            message: "Please input valid details!",
            success: false
        })
      }
      if (confirmPassword !== password) {
        return res.json({
          success: false,
          message: "Password and Confirm Password Does not Match",
        })
      }

      const updateDetails = await User.findOne({ token: token });

      if (!updateDetails) {
        return res.status(401).json({
          success: false,
          message: "Token is invalid",
        });
      }

      if (updateDetails.resetPasswordExpires < Date.now()) {
        return res.status(403).json({
          success: false,
          message: "Your token is expired, Please regenerate the token",
        });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      await User.findOneAndUpdate(
        { token: token },
        {
          password: hashedPassword,
        },
        { new: true }
      );

      await sendEmail(updateDetails.email, "Password Reset Successfully", "Your password has been reset successfully.");

      res.status(200).json({
        message: "Password reset successfully",
        success: true,
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message,
        success: false,
      });
    }
  };

 export const changePassword = async (req, res) => {
  try {
    const userDetails = await User.findById(req.user.id)

     if(!userDetails) {
        return res.status(404).json({
            message: "User not found",
            success: false
        })
      }
    const { oldPassword, newPassword } = req.body

     if(!oldPassword || !newPassword) {
        return res.status(404).json({
            message: "Please input valid details!",
            success: false
        })
      }

    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    )
    if (!isPasswordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "The password is incorrect" })
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 10)
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    )

    try {
      await sendEmail(
        updatedUserDetails.email,
        "Password for your account has been updated",
        `Password updated successfully for ${updatedUserDetails.fullName}`
      )
    } catch (error) {
      console.warn("Could not send password update confirmation email:", error.message);
    }

    return res.status(200)
      .json({ success: true, message: "Password updated successfully" })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    })
  }
}
