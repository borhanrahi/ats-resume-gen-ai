"use client";

import React, { useState } from "react";
import {
  Share2,
  Twitter,
  Linkedin,
  Facebook,
  Copy,
  Check,
  ExternalLink,
  Heart,
} from "lucide-react";

interface SocialShareProps {
  score?: number;
  className?: string;
  onShare?: (platform: string) => void;
}

/**
 * Social Share Component - Mobile-first design
 * Provides viral marketing CTAs and social sharing functionality
 */
export function SocialShare({
  score,
  className = "",
  onShare,
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareTitle = score
    ? `I got a ${score}% ATS score on my resume! 🎯`
    : "Check how ATS-friendly your resume is with this free AI tool! 🚀";

  const shareText = score
    ? `Just analyzed my resume and got a ${score}% ATS compatibility score! This free AI tool is amazing for job seekers. Check it out:`
    : "This free AI-powered ATS resume checker is a game-changer for job applications! Get instant feedback on your resume:";

  const handleShare = async (platform: string) => {
    setIsSharing(true);
    onShare?.(platform);

    let shareUrlFinal = "";

    switch (platform) {
      case "linkedin":
        shareUrlFinal = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          shareUrl
        )}&title=${encodeURIComponent(shareTitle)}&summary=${encodeURIComponent(
          shareText
        )}`;
        break;
      case "twitter":
        shareUrlFinal = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `${shareText} ${shareUrl}`
        )}`;
        break;
      case "facebook":
        shareUrlFinal = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}&quote=${encodeURIComponent(shareText)}`;
        break;
      case "native":
        if (navigator.share) {
          try {
            await navigator.share({
              title: shareTitle,
              text: shareText,
              url: shareUrl,
            });
          } catch (err) {
            console.log("Share cancelled or failed");
          }
        }
        break;
    }

    if (shareUrlFinal) {
      window.open(shareUrlFinal, "_blank", "width=600,height=400");
    }

    setTimeout(() => setIsSharing(false), 1000);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onShare?.("copy");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link");
    }
  };

  return (
    <div
      className={`bg-card border border-border rounded-lg p-4 md:p-6 ${className}`}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
          <Heart className="w-6 h-6 text-blue-600" />
        </div>

        <h3 className="text-lg font-semibold mb-2">
          Love this tool? Share it!
        </h3>

        <p className="text-sm text-muted-foreground">
          Help other job seekers discover this free ATS resume checker
        </p>
      </div>

      {/* Share Buttons - Mobile-first grid */}
      <div className="space-y-3">
        {/* Primary Share Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => handleShare("linkedin")}
            disabled={isSharing}
            className="min-h-[44px] px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Linkedin className="w-4 h-4" />
            Share on LinkedIn
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            onClick={() => handleShare("twitter")}
            disabled={isSharing}
            className="min-h-[44px] px-4 py-3 bg-black hover:bg-gray-800 disabled:opacity-50 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Twitter className="w-4 h-4" />
            Share on X
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Secondary Share Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => handleShare("facebook")}
            disabled={isSharing}
            className="min-h-[44px] px-4 py-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Facebook className="w-4 h-4" />
            Share on Facebook
            <ExternalLink className="w-3 h-3" />
          </button>

          {/* Native Share (mobile) or Copy Link (desktop) */}
          {navigator.share ? (
            <button
              onClick={() => handleShare("native")}
              disabled={isSharing}
              className="min-h-[44px] px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          ) : (
            <button
              onClick={handleCopyLink}
              className="min-h-[44px] px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center gap-2 text-sm font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Viral Marketing Message */}
      <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">
            💡 <strong>Pro tip:</strong> Sharing helps us keep this tool free
            for everyone!
          </p>

          {score && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full text-xs">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Your {score}% score shows this tool works!
            </div>
          )}
        </div>
      </div>

      {/* Share Statistics (if available) */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            <span>Join 10,000+ users</span>
          </div>
          <div className="flex items-center gap-1">
            <Share2 className="w-3 h-3" />
            <span>Free forever</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SocialShare;
