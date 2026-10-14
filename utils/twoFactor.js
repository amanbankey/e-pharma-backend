import axios from "axios";

/**
 * Send OTP via 2Factor.in using pre-approved DLT template
 * @param {string} mobileNumber 10-digit mobile number
 * @returns {Promise<{Status: string, Details: string}>}
 */
export const sendOTP = async (mobileNumber) => {
  const apiKey = process.env.TWOFACTOR_API_KEY;
  const templateName = process.env.TWOFACTOR_TEMPLATE_NAME;

  if (!apiKey) {
    throw new Error("TWOFACTOR_API_KEY is missing in environment variables");
  }

  // 2Factor requires international format with country code (+91 for India) for SMS routing
  const digitsOnly = mobileNumber.toString().replace(/\D/g, "");
  const clean10Digit = digitsOnly.length === 10 ? digitsOnly : digitsOnly.slice(-10);
  const formattedPhone = encodeURIComponent(`+91${clean10Digit}`);

  let url = `https://2factor.in/API/V1/${apiKey}/SMS/${formattedPhone}/AUTOGEN`;
  if (templateName && templateName.trim()) {
    url += `/${encodeURIComponent(templateName.trim())}`;
  }

  try {
    console.log(`[2Factor] Sending SMS OTP to: +91${clean10Digit} (Template: ${templateName || "DEFAULT"})`);
    const response = await axios.get(url);
    console.log("[2Factor] Send OTP Response:", response.data);

    if (response.data?.Status !== "Success") {
      throw new Error(response.data?.Details || "Failed to send OTP via 2Factor");
    }

    return response.data;
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error("[2Factor] Send OTP Error:", errorDetails);
    throw new Error(error.response?.data?.Details || error.message || "Failed to send OTP");
  }
};

/**
 * Verify OTP via 2Factor.in using session ID
 * @param {string} sessionId Session ID returned by sendOTP
 * @param {string} otp OTP entered by user
 * @returns {Promise<{Status: string, Details: string}>}
 */
export const verifyOTP = async (sessionId, otp) => {
  const apiKey = process.env.TWOFACTOR_API_KEY;

  if (!apiKey) {
    throw new Error("TWOFACTOR_API_KEY is missing in environment variables");
  }

  const cleanOtp = otp.toString().trim();
  const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${cleanOtp}`;

  try {
    console.log(`[2Factor] Verifying OTP session: ${sessionId}`);
    const response = await axios.get(url);
    console.log("[2Factor] Verify OTP Response:", response.data);
    return response.data;
  } catch (error) {
    const errData = error.response?.data;
    console.error("[2Factor] Verify OTP Error:", errData || error.message);
    if (errData) {
      return errData;
    }
    return { Status: "Error", Details: error.message || "OTP verification failed" };
  }
};

/**
 * Fallback: Verify OTP via 2Factor.in using phone number
 * @param {string} mobileNumber 10-digit mobile number
 * @param {string} otp OTP entered by user
 * @returns {Promise<{Status: string, Details: string}>}
 */
export const verifyOTPByPhone = async (mobileNumber, otp) => {
  const apiKey = process.env.TWOFACTOR_API_KEY;

  if (!apiKey) {
    throw new Error("TWOFACTOR_API_KEY is missing in environment variables");
  }

  const digitsOnly = mobileNumber.toString().replace(/\D/g, "");
  const clean10Digit = digitsOnly.length === 10 ? digitsOnly : digitsOnly.slice(-10);
  const formattedPhone = encodeURIComponent(`+91${clean10Digit}`);
  const cleanOtp = otp.toString().trim();
  const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY3/${formattedPhone}/${cleanOtp}`;

  try {
    const response = await axios.get(url);
    console.log("[2Factor] Verify3 Response:", response.data);
    return response.data;
  } catch (error) {
    const errData = error.response?.data;
    console.error("[2Factor] Verify3 Error:", errData || error.message);
    if (errData) {
      return errData;
    }
    return { Status: "Error", Details: error.message || "OTP verification failed" };
  }
};