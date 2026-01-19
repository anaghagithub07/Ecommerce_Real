// Import the nodemailer library
// Nodemailer allows Node.js to send emails
import nodemailer from "nodemailer";

/**
 * sendEmail function
 * ------------------
 * Sends an email to a user
 *
 * @param {string} to      → recipient email address
 * @param {string} subject → subject line of the email
 * @param {string} html    → HTML content of the email
 */
const sendEmail = async (to, subject, html) => {

  // Create a transporter object
  // This is like a mail delivery service
  const transporter = nodemailer.createTransport({

    // Using Gmail as the email service
    service: "gmail",

    // Authentication details to log in to Gmail
    auth: {
      // Your Gmail address (stored safely in .env)
      user: process.env.EMAIL_USER,

      // Your Gmail App Password (not normal Gmail password)
      pass: process.env.EMAIL_PASS,
    },
  });

  // Send the email using the transporter
  await transporter.sendMail({
    // From which email and name
    from: `"Shop Stack" <${process.env.EMAIL_USER}>`,

    // Recipient email
    to,

    // Subject of the email
    subject,

    // Email body in HTML format
    html,
  });
};

// Export the function so other files (controllers) can use it
export default sendEmail;
