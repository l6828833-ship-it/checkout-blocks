type TwilioVerifyCredentials = { apiKeySid: string; apiKeySecret: string; verifyServiceSid: string };

function basicHeader(credentials: TwilioVerifyCredentials) {
  return `Basic ${Buffer.from(`${credentials.apiKeySid}:${credentials.apiKeySecret}`).toString("base64")}`;
}

async function request(path: string, credentials: TwilioVerifyCredentials, body: URLSearchParams) {
  const response = await fetch(`https://verify.twilio.com/v2/Services/${encodeURIComponent(credentials.verifyServiceSid)}${path}`, {
    method: "POST",
    headers: { Authorization: basicHeader(credentials), "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error(`[Twilio Verify] Request failed with status ${response.status}.`);
  return response.json() as Promise<{ status?: string; valid?: boolean }>;
}

export async function sendTwilioVerification(phoneE164: string, credentials: TwilioVerifyCredentials) {
  const body = new URLSearchParams({ To: phoneE164, Channel: "sms" });
  const result = await request("/Verifications", credentials, body);
  if (result.status !== "pending") throw new Error("[Twilio Verify] Provider did not create a pending verification.");
}

export async function checkTwilioVerification(phoneE164: string, code: string, credentials: TwilioVerifyCredentials) {
  const result = await request("/VerificationCheck", credentials, new URLSearchParams({ To: phoneE164, Code: code }));
  return result.status === "approved" && result.valid === true;
}
