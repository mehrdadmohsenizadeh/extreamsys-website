import { NextRequest, NextResponse } from "next/server";
import { contactFormSchema, sanitizeFormData } from "@/lib/utils/validation";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";
import {
  getContactRateLimit,
  getClientIP,
  checkPenaltyBox,
  addToPenaltyBox,
  logRateLimitEvent,
} from "@/lib/utils/rate-limit";
import {
  sendContactFormNotification,
  sendContactFormConfirmation,
} from "@/lib/utils/email";

/**
 * POST /api/contact
 * Secure contact form submission endpoint
 *
 * Security layers:
 * 1. Content-Length validation
 * 2. Penalty box check (IP reputation)
 * 3. Rate limiting (5 per hour per IP)
 * 4. Turnstile verification (bot protection)
 * 5. Zod validation & sanitization
 * 6. Email delivery with error handling
 * 7. Audit logging
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ========================================================================
    // LAYER 1: Content-Length Validation
    // ========================================================================
    const contentLength = request.headers.get("content-length");
    const MAX_CONTENT_LENGTH = 10000; // 10KB limit

    if (
      !contentLength ||
      parseInt(contentLength, 10) > MAX_CONTENT_LENGTH
    ) {
      return NextResponse.json(
        { error: "Request payload too large" },
        { status: 413 }
      );
    }

    // ========================================================================
    // LAYER 2: Extract Client IP & Check Penalty Box
    // ========================================================================
    const clientIP = getClientIP(request.headers);

    if (clientIP === "unknown") {
      return NextResponse.json(
        { error: "Unable to verify request origin" },
        { status: 400 }
      );
    }

    // Check if IP is in penalty box (repeated rate limit violations)
    const isInPenaltyBox = await checkPenaltyBox(clientIP);
    if (isInPenaltyBox) {
      console.warn(`[Penalty Box] Blocked IP: ${clientIP}`);

      return NextResponse.json(
        {
          error: "Too many failed attempts. Please try again later.",
          retryAfter: 3600, // 1 hour
        },
        { status: 429 }
      );
    }

    // ========================================================================
    // LAYER 3: Rate Limiting
    // ========================================================================
    const rateLimitResult = await getContactRateLimit().limit(clientIP);

    // Log rate limit check
    await logRateLimitEvent({
      type: rateLimitResult.success ? "rate_limit_passed" : "rate_limit_blocked",
      identifier: clientIP,
      endpoint: "/api/contact",
      remaining: rateLimitResult.remaining,
      limit: rateLimitResult.limit,
      reset: rateLimitResult.reset,
      timestamp: new Date().toISOString(),
    });

    if (!rateLimitResult.success) {
      // Add to penalty box on rate limit violation
      await addToPenaltyBox(clientIP);

      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.floor((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
            "Retry-After": Math.floor(
              (rateLimitResult.reset - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // ========================================================================
    // LAYER 4: Parse & Sanitize Request Body
    // ========================================================================
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Sanitize inputs to prevent XSS
    const sanitizedBody = sanitizeFormData(body as Record<string, unknown>);

    // ========================================================================
    // LAYER 5: Turnstile Verification
    // ========================================================================
    const turnstileToken =
      typeof sanitizedBody.turnstileToken === "string"
        ? sanitizedBody.turnstileToken
        : "";

    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const turnstileResult = await verifyTurnstileToken(
      turnstileToken,
      clientIP
    );

    if (!turnstileResult.success) {
      console.warn(`[Turnstile Failed] IP: ${clientIP}`, turnstileResult["error-codes"]);

      return NextResponse.json(
        {
          error: "Verification failed. Please refresh and try again.",
          details:
            process.env.NODE_ENV === "development"
              ? turnstileResult["error-codes"]
              : undefined,
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // LAYER 6: Zod Schema Validation
    // ========================================================================
    const validationResult = contactFormSchema.safeParse(sanitizedBody);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    const formData = validationResult.data;

    // ========================================================================
    // LAYER 7: Send Emails
    // ========================================================================
    // Send notification to internal team
    const notificationResult = await sendContactFormNotification(formData);

    if (!notificationResult.success) {
      console.error("[Email Send Failed]", notificationResult.error);

      // Return 500 but don't expose internal error details
      return NextResponse.json(
        {
          error: "Unable to process your request. Please try again or contact us directly.",
        },
        { status: 500 }
      );
    }

    // Send confirmation to customer (non-blocking, errors are logged)
    await sendContactFormConfirmation(formData.email, formData.name);

    // ========================================================================
    // SUCCESS RESPONSE
    // ========================================================================
    const processingTime = Date.now() - startTime;

    console.log(`[Contact Form Success] IP: ${clientIP}, Time: ${processingTime}ms`);

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for contacting us! We'll be in touch within 1-2 business days.",
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        },
      }
    );
  } catch (error) {
    console.error("[Contact API Error]", error);

    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
