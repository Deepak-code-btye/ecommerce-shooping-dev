import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URL;
    if (!uri) {
      throw new Error(
        "MongoDB URI is not defined in the environment variables."
      );
    }

    let timeout = 25;
    while (mongoose.connection.readyState === 0) {
      if (timeout === 0) {
        console.log("timeout");
        throw new Error("timeout occured with mongoose connection");
      }

      await mongoose.connect(uri, {});

      timeout--;
    }
    console.log("Database connection status:", mongoose.connection.readyState);
    console.log(`Mongodb connected ${mongoose.connection.host}`);
  } catch (error) {
    console.log(`Mongodb Server Issue `, error);
    // process.exit(1); // Exit with failure
  }
};

export default connectDB;
