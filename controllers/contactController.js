import sendEmail from "../utils/sendMail.js";
import { buildContactMail } from "../utils/contactMailTemplate.js";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export const submitContactForm = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const email = String(req.body?.email || "").trim();
    const message = String(req.body?.message || "").trim();

    if (!name) {
      return res.status(400).json({ success: false, message: "Please enter your full name." });
    }
    if (!phone) {
      return res.status(400).json({ success: false, message: "Please enter your phone number." });
    }
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits." });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: "Please enter your email address." });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }
    if (!message) {
      return res.status(400).json({ success: false, message: "Please write your message before sending." });
    }
    if (name.length > 100 || message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Your name or message is too long. Please shorten it and try again.",
      });
    }

    const ownerEmail = process.env.OWNER_EMAIL;
    if (!ownerEmail) {
      console.error("Contact form: OWNER_EMAIL is missing in environment variables");
      return res.status(500).json({
        success: false,
        message: "We could not send your message right now. Please call us or message us on WhatsApp.",
      });
    }

    const { subject, html } = buildContactMail({ name, phone, email, message });

    // Reply-To is the customer, so the owner can answer straight from the inbox
    await sendEmail(ownerEmail, subject, html, { replyTo: { email, name } });

    return res.status(200).json({
      success: true,
      message: "Thank you! Your message has been sent. We'll get back to you shortly.",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return res.status(500).json({
      success: false,
      message: "We could not send your message right now. Please try again in a few minutes.",
    });
  }
};
