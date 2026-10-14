import axios from "axios";

const BASE_URL = "https://cpaas.messagecentral.com";

// Cached token generated from CUSTOMER_ID + PASSWORD (used when AUTH_TOKEN is missing/expired)
let generatedToken = null;

const clean10Digit = (mobileNumber) => {
  const digitsOnly = mobileNumber.toString().replace(/\D/g, "");
  return digitsOnly.length === 10 ? digitsOnly : digitsOnly.slice(-10);
};

const getCustomerId = () => {
  const customerId = process.env.CUSTOMER_ID;
  if (!customerId) {
    throw new Error("CUSTOMER_ID is missing in environment variables");
  }
  return customerId;
};

/**
 * Generate a fresh auth token using CUSTOMER_ID and PASSWORD
 */
const generateAuthToken = async () => {
  const password = process.env.PASSWORD;
  if (!password) {
    throw new Error("PASSWORD is missing in environment variables");
  }

  const key = Buffer.from(password).toString("base64");
  const response = await axios.get(`${BASE_URL}/auth/v1/authentication/token`, {
    params: { customerId: getCustomerId(), key, scope: "NEW", country: "91" },
    headers: { accept: "*/*" },
  });

  const token = response.data?.token;
  if (!token) {
    throw new Error("Message Central did not return an auth token");
  }
  generatedToken = token;
  return token;
};

const getAuthToken = async () => {
  if (generatedToken) return generatedToken;
  if (process.env.AUTH_TOKEN) return process.env.AUTH_TOKEN;
  return generateAuthToken();
};

const isAuthError = (error) => {
  const status = error.response?.status;
  return status === 401 || status === 403;
};

// Runs a request with the auth token; on an auth failure regenerates the token once and retries
const requestWithAuth = async (makeRequest) => {
  try {
    return await makeRequest(await getAuthToken());
  } catch (error) {
    if (isAuthError(error) && process.env.PASSWORD) {
      return makeRequest(await generateAuthToken());
    }
    throw error;
  }
};

/**
 * Send OTP via Message Central (VerifyNow)
 * @param {string} mobileNumber 10-digit mobile number
 * @returns {Promise<{Status: string, Details: string}>} Details holds the verificationId
 */
export const sendOTP = async (mobileNumber) => {
  const phone = clean10Digit(mobileNumber);

  try {
    console.log(`[MessageCentral] Sending SMS OTP to: +91${phone}`);
    const response = await requestWithAuth((authToken) =>
      axios.post(`${BASE_URL}/verification/v3/send`, null, {
        params: {
          countryCode: "91",
          customerId: getCustomerId(),
          flowType: "SMS",
          mobileNumber: phone,
          otpLength: 6,
        },
        headers: { authToken },
      })
    );

    const verificationId = response.data?.data?.verificationId;
    if (response.data?.responseCode !== 200 || !verificationId) {
      throw new Error(response.data?.message || "Failed to send OTP via Message Central");
    }

    return { Status: "Success", Details: String(verificationId) };
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error("[MessageCentral] Send OTP Error:", errorDetails);
    throw new Error(error.response?.data?.message || error.message || "Failed to send OTP");
  }
};

/**
 * Verify OTP via Message Central using verificationId
 * @param {string} mobileNumber 10-digit mobile number
 * @param {string} verificationId verificationId returned by sendOTP
 * @param {string} otp OTP entered by user
 * @returns {Promise<{Status: string, Details: string}>}
 */
export const verifyOTP = async (mobileNumber, verificationId, otp) => {
  const phone = clean10Digit(mobileNumber);

  try {
    const response = await requestWithAuth((authToken) =>
      axios.get(`${BASE_URL}/verification/v3/validateOtp`, {
        params: {
          countryCode: "91",
          mobileNumber: phone,
          verificationId,
          customerId: getCustomerId(),
          code: otp.toString().trim(),
        },
        headers: { authToken },
      })
    );

    console.log("[MessageCentral] Verify OTP Response:", JSON.stringify(response.data));

    // A 200 from validateOtp means the code matched; failures come back as 4xx (702 wrong OTP, 705 expired, 703 already verified)
    const status = response.data?.data?.verificationStatus;
    const failed = status && /FAIL|EXPIRED|INVALID/i.test(status);
    if (response.data?.responseCode === 200 && !failed) {
      return { Status: "Success", Details: "OTP Matched" };
    }
    return { Status: "Error", Details: response.data?.message || "OTP verification failed" };
  } catch (error) {
    const errData = error.response?.data;
    console.error("[MessageCentral] Verify OTP Error:", errData || error.message);
    return { Status: "Error", Details: errData?.message || error.message || "OTP verification failed" };
  }
};
