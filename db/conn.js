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

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`Mongodb connected ${mongoose.connection.host}`);
  } catch (error) {
    console.log(`Mongodb Server Issue `);
    // process.exit(1); // Exit with failure
  }
};

export default connectDB;
