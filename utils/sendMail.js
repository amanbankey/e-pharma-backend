import nodemailer from "nodemailer";
import dotenv from "dotenv"
dotenv.config();

let transporter = nodemailer.createTransport({
   host: "smtp-relay.brevo.com",
  port: 465,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

const sendEmail = async ( email, title, body ) => {
    const mailOptions = {
        from: process.env.BREVO_EMAIL,
        to: `${email}`,
        subject:`${title}`,
        html: `${body}`,
    };

    try {
         await transporter.verify();
         console.log("✅ SMTP Connected");

        const info = await transporter.sendMail(mailOptions);
        return { success: true, message: 'Email sent', info };
    } catch (error) {
            throw error;
    }
};

export default sendEmail
