import axios from "axios";

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;

// ========================================
// SEND OTP  (MSG91 API v5)
// authkey must be in header (recommended by MSG91 docs)
// OTP variable must match the variable name used in your MSG91 template
// ========================================

export const sendOTPViaMSG91 = async (mobile, otp) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  try {
    console.log("MSG91 Sending OTP to:", mobile, "| OTP:", otp);
    console.log("MSG91 AUTH_KEY:", authKey ? "Present (" + authKey.slice(0, 6) + "...)" : "MISSING ❌");
    console.log("MSG91 TEMPLATE_ID:", templateId ? templateId : "MISSING ❌");

    if (!authKey || !templateId) {
      throw new Error("MSG91 credentials missing in environment variables (.env)");
    }

    // MSG91 v5 API: template_id and mobile go in query string
    const url =
      `https://control.msg91.com/api/v5/otp` +
      `?template_id=${templateId}` +
      `&mobile=${mobile}`;

    const response = await axios.post(
      url,
      {
        // Sending both otp (lowercase) and OTP (uppercase) to cover
        // whichever variable name is used in your MSG91 template (##otp## OR ##OTP##)
        otp: String(otp),
        OTP: String(otp),
      },
      {
        headers: {
          "Content-Type": "application/json",
          "authkey": authKey,
        },
      }
    );

    console.log("MSG91 SEND OTP RESPONSE:", JSON.stringify(response.data));

    return response.data;
  } catch (error) {
    const errData = error.response?.data;
    console.error("MSG91 SEND OTP ERROR:", errData || error.message);
    console.error("MSG91 Status:", error.response?.status);

    throw new Error(
      errData?.message || errData?.error || "Failed to send OTP via MSG91"
    );
  }
};

 

export const verifyOTPViaMSG91 = async (mobile, otp) => {
  const authKey = process.env.MSG91_AUTH_KEY;

  try {
    console.log("MSG91 Verifying OTP for:", mobile, "| OTP:", otp);

    // mobile and otp in query string, authkey in header
    const url =
      `https://control.msg91.com/api/v5/otp/verify` +
      `?otp=${otp}` +
      `&mobile=${mobile}`;

    const response = await axios.get(url, {
      headers: {
        "authkey": authKey,
      },
    });

    console.log("MSG91 VERIFY OTP RESPONSE:", JSON.stringify(response.data));

    return response.data;
  } catch (error) {
    const errData = error.response?.data;
    console.error("MSG91 VERIFY OTP ERROR:", errData || error.message);
    console.error("MSG91 Status:", error.response?.status);

    throw new Error(
      errData?.message || errData?.error || "OTP verification failed"
    );
  }
};