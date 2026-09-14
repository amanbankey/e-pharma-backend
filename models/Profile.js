import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
  gender: { type: String, default: null },
  dateOfBirth: { type: String, default: null },
  about: { type: String, default: null },
  contactNumber: { type: String, trim: true },
});

const Profile = mongoose.model("Profile", ProfileSchema);
export default Profile;
