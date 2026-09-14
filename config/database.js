import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connect = () => {
    mongoose.connect(process.env.MONGODB_URL)
    .then(() => { console.log("db connection succesfully") })
    .catch((error) => {
        console.log("DB connection failed");
        console.error(error);
        process.exit(1);
    })
}
