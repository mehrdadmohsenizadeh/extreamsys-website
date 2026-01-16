"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile Widget Component
 *
 * Usage:
 * ```tsx
 * <Turnstile onSuccess={(token) => setToken(token)} />
 * ```
 */

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  className?: string;
}

// Declare Turnstile on window
declare global {
  interface Window {
    turnstile?: {
      render: (
        element: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function Turnstile({
  onSuccess,
  onError,
  onExpire,
  theme = "auto",
  size = "normal",
  className = "",
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Turnstile script
  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]'
    );

    if (existingScript) {
      setIsLoaded(true);
      return;
    }

    // Create and load script
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;

    script.onload = () => setIsLoaded(true);
    script.onerror = () => {
      setError("Failed to load Turnstile widget");
      onError?.();
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup: Remove script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onError]);

  // Render Turnstile widget
  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile) {
      return;
    }

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
      setError("Turnstile site key not configured");
      console.error(
        "NEXT_PUBLIC_TURNSTILE_SITE_KEY environment variable is not set"
      );
      return;
    }

    try {
      // Render widget
      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          setError(null);
          onSuccess(token);
        },
        "error-callback": () => {
          setError("Verification failed");
          onError?.();
        },
        "expired-callback": () => {
          setError("Verification expired");
          onExpire?.();
        },
        theme,
        size,
      });

      widgetIdRef.current = widgetId;
    } catch (err) {
      setError("Failed to initialize Turnstile");
      console.error("Turnstile initialization error:", err);
    }

    // Cleanup: Remove widget on unmount
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (err) {
          console.error("Turnstile cleanup error:", err);
        }
      }
    };
  }, [isLoaded, onSuccess, onError, onExpire, theme, size]);

  return (
    <div className={`turnstile-container ${className}`}>
      <div ref={containerRef} />
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Reset Turnstile widget programmatically
 * Useful when form validation fails and you want to reset the challenge
 */
export function resetTurnstile(widgetId: string) {
  if (window.turnstile) {
    window.turnstile.reset(widgetId);
  }
}
