// =======================
// IMPORTS
// =======================
import bcrypt from "bcryptjs";        // Library to hash and compare passwords securely
import jwt from "jsonwebtoken";       // Library to create and verify JSON Web Tokens (JWT)
import userModel from "../models/User.js";  // Your MongoDB User model
import sendEmail from "../utils/sendEmail.js"; // Function to send emails

// =======================
// REGISTER CONTROLLER
// =======================
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body; // Get user data from request body

    // Check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user in the database
    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate a JWT token for authentication
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // Token expires in 7 days
    );

    // Set the token as a cookie
    res.cookie("token", token, {
      httpOnly: true,       // Prevents client-side JS from accessing cookie
      secure: false,        // Set true in production with HTTPS
      sameSite: "strict",   // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Send success response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    // Handle unexpected errors
    res.status(500).json({ message: error.message });
  }
};

// =======================
// LOGIN CONTROLLER
// =======================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if fields are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// LOGOUT CONTROLLER
// =======================
export const logout = async (req, res) => {
  try {
    // Clear the authentication cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// FORGOT PASSWORD CONTROLLER
// =======================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create a secret using JWT_SECRET + user's current password
    // This ensures old tokens become invalid if password changes
    const secret = process.env.JWT_SECRET + user.password;

    // Generate a JWT token that expires in 5 minutes
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: "5m" });

    // Construct the reset link dynamically using current request
    const host = req.get("host");       // e.g., localhost:5000
    const protocol = req.protocol;      // e.g., http or https
    const resetLink = `${protocol}://${host}/api/auth/reset-password/${user._id}/${token}`;

    console.log("GENERATED LINK => ", resetLink); // For debugging

    // Send the reset email
    await sendEmail(
      user.email,
      "Reset Your Password",
      `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 5 minutes.</p>
      `
    );

    res.json({
      success: true,
      message: "Password reset link sent to email",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// GET RESET PASSWORD PAGE (EJS)
// =======================
export const getResetPasswordPage = async (req, res) => {
  const { id, token } = req.params;

  try {
    // Find user by id
    const user = await userModel.findById(id);
    if (!user) return res.status(404).send("User not found");

    // Verify the token
    const secret = process.env.JWT_SECRET + user.password;
    jwt.verify(token, secret);

    // Render reset form with EJS
    res.render("reset", { email: user.email, id, token });
  } catch (error) {
    res.status(400).send("Reset link is invalid or expired");
  }
};

// =======================
// RESET PASSWORD FORM SUBMISSION
// =======================
export const resetPassword = async (req, res) => {
  const { id, token } = req.params;
  const { password, confirm } = req.body; // 'confirm' matches name in EJS input

  // Check if passwords match
  if (password !== confirm) {
    return res.status(400).send("Passwords do not match");
  }

  try {
    // Find the user
    const user = await userModel.findById(id);
    if (!user) return res.status(404).send("User not found");

    // Verify token
    const secret = process.env.JWT_SECRET + user.password;
    jwt.verify(token, secret);

    // Hash the new password and save
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.send("Password reset successful. You can now login.");
  } catch (error) {
    res.status(400).send("Reset link expired or invalid");
  }
};
