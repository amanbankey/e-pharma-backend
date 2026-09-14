import bcrypt from "bcrypt";
import Profile from "../models/Profile.js";
import User from "../models/User.js";
import Order from "../models/Order.js";

export const updateProfile = async (req, res) => {
  try {
    const {
      fullName = "",
      firstName = "",
      lastName = "",
      dateOfBirth = "",
      about = "",
      contactNumber = "",
      phone = "",
      gender = "",
      city,
      state,
      address,
      password = "",
      newPassword = "",
      oldPassword = "",
    } = req.body;

    const id = req.user.id;

    const userDetails = await User.findById(id);
    if (!userDetails) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const profile = userDetails.additionalDetails
      ? await Profile.findById(userDetails.additionalDetails)
      : null;

    const image = req.files?.image;

    let profileImage = "";
    if (image) {
      const { uploadImageToCloudinary } = await import("../utils/imageUploader.js");
      const uploadedImage = await uploadImageToCloudinary(image, "profile-images");
      profileImage = uploadedImage.secure_url;
    }

    const userUpdates = {};
    if (fullName && fullName.trim()) {
      userUpdates.fullName = fullName.trim();
    } else if (firstName || lastName) {
      userUpdates.fullName = `${firstName} ${lastName}`.trim();
    }

    if (city !== undefined) userUpdates.city = city.trim();
    if (state !== undefined) userUpdates.state = state.trim();
    if (address !== undefined) userUpdates.address = address.trim();

    const finalPhone = phone || contactNumber;
    if (finalPhone !== undefined) userUpdates.phone = finalPhone.trim();

    if (profileImage) userUpdates.profileImage = profileImage;

    // Password update handling
    const pwdToSet = newPassword || password;
    if (pwdToSet && pwdToSet.trim()) {
      if (pwdToSet.trim().length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      if (oldPassword) {
        const isMatch = await bcrypt.compare(oldPassword, userDetails.password);
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: "Current password is incorrect",
          });
        }
      }

      const encryptedPassword = await bcrypt.hash(pwdToSet.trim(), 10);
      userUpdates.password = encryptedPassword;
    }

    await User.findByIdAndUpdate(id, userUpdates, { new: true });

    if (profile) {
      profile.dateOfBirth = dateOfBirth ?? profile.dateOfBirth;
      profile.about = about ?? profile.about;
      profile.contactNumber = finalPhone ?? profile.contactNumber;
      profile.gender = gender ?? profile.gender;
      await profile.save();
    }

    const updatedUserDetails = await User.findById(id)
      .select("-password")
      .populate("additionalDetails")
      .exec();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      updatedUserDetails,
      data: updatedUserDetails,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await Order.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllUserDetails = async (req, res) => {
  try {
    const id = req.user.id;
    const userDetails = await User.findById(id).populate("additionalDetails").exec();

    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User details not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User data fetched successfully",
      data: userDetails,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-phone -email -password")
      .populate("additionalDetails");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({
      success: true,
      message: "Fetched user by id",
      user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
