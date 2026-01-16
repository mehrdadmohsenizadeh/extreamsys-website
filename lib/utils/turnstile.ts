/**
 * Cloudflare Turnstile verification
 * Server-side validation of Turnstile tokens
 */

export interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

/**
 * Verify Turnstile token with Cloudflare
 * @param token - Token from client-side Turnstile widget
 * @param remoteIP - Client IP address (optional but recommended)
 * @returns Promise resolving to verification result
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIP?: string
): Promise<TurnstileResponse> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("TURNSTILE_SECRET_KEY is not configured");
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);

    if (remoteIP) {
      formData.append("remoteip", remoteIP);
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Turnstile API error: ${response.status}`);
    }

    const result: TurnstileResponse = await response.json();

    // Log verification result for monitoring
    if (process.env.NODE_ENV === "development") {
      console.log("[Turnstile Verification]", {
        success: result.success,
        errors: result["error-codes"],
      });
    }

    return result;
  } catch (error) {
    console.error("[Turnstile Verification Error]", error);

    // Return failed verification instead of throwing
    // This prevents service degradation if Turnstile is down
    return {
      success: false,
      "error-codes": ["internal-error"],
    };
  }
}

/**
 * Turnstile error code descriptions
 */
export const TURNSTILE_ERROR_MESSAGES: Record<string, string> = {
  "missing-input-secret": "The secret parameter was not passed",
  "invalid-input-secret": "The secret parameter was invalid or did not exist",
  "missing-input-response": "The response parameter was not passed",
  "invalid-input-response": "The response parameter is invalid or has expired",
  "bad-request": "The request was rejected because it was malformed",
  "timeout-or-duplicate": "The response parameter has already been validated before",
  "internal-error": "An internal error happened while validating the response",
};

/**
 * Get human-readable error message
 */
export function getTurnstileErrorMessage(errorCodes?: string[]): string {
  if (!errorCodes || errorCodes.length === 0) {
    return "Verification failed";
  }

  const errorCode = errorCodes[0];
  return TURNSTILE_ERROR_MESSAGES[errorCode] || "Verification failed";
}
