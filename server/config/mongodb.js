import mongoose from "mongoose";

export const connectDB = async (mongoURL) => {
  try {
    await mongoose.connect(mongoURL); // no options needed
    console.log("MongoDB connected successfully!");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1); // Stop server if DB connection fails
  }
};
