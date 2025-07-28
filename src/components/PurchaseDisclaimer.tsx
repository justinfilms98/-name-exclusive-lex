"use client";

import { AlertTriangle, Info, Clock, RefreshCw } from 'lucide-react';

interface PurchaseDisclaimerProps {
  variant?: 'checkout' | 'watch' | 'success';
  className?: string;
  duration?: number; // access duration in seconds
}

export default function PurchaseDisclaimer({ variant = 'checkout', className = '', duration = 1800 }: PurchaseDisclaimerProps) {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}-minute`;
  };

  const getDisclaimerContent = () => {
    switch (variant) {
      case 'checkout':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          title: "Important Purchase Information",
          content: [
            "You can purchase multiple collections and access them all.",
            `Each purchase has its own ${formatDuration(duration)} timer that starts when you begin watching.`,
            "You can exit and return to any active purchase from your account page.",
            "Timers continue running even when you're not watching, so plan your viewing time wisely."
          ],
          bgColor: "bg-amber-50 border-amber-200",
          textColor: "text-amber-800"
        };
      
      case 'watch':
        return {
          icon: <Info className="w-5 h-5 text-blue-600" />,
          title: "Current Active Purchase",
          content: [
            "You are currently viewing one of your active purchases.",
            "You can exit and purchase other collections - your timers will continue running.",
            "Access all your active purchases from your account page.",
            `Each purchase has its own ${formatDuration(duration)} timer that starts when you begin watching.`
          ],
          bgColor: "bg-blue-50 border-blue-200",
          textColor: "text-blue-800"
        };
      
      case 'success':
        return {
          icon: <RefreshCw className="w-5 h-5 text-green-600" />,
          title: "Purchase Successfully Activated",
          content: [
            "Your new purchase is now active and ready to watch!",
            "You can purchase multiple collections and access them all.",
            `Each purchase has its own ${formatDuration(duration)} timer that starts when you begin watching.`,
            "Access all your active purchases from your account page."
          ],
          bgColor: "bg-green-50 border-green-200",
          textColor: "text-green-800"
        };
      
      default:
        return {
          icon: <Info className="w-5 h-5 text-gray-600" />,
          title: "Purchase Information",
          content: [
            "You can have multiple active purchases at the same time.",
            "Each purchase has its own timer that starts when you begin watching."
          ],
          bgColor: "bg-gray-50 border-gray-200",
          textColor: "text-gray-800"
        };
    }
  };

  const disclaimer = getDisclaimerContent();

  return (
    <div className={`rounded-lg border p-4 ${disclaimer.bgColor} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {disclaimer.icon}
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-sm mb-2 ${disclaimer.textColor}`}>
            {disclaimer.title}
          </h3>
          <ul className={`text-sm space-y-1 ${disclaimer.textColor}`}>
            {disclaimer.content.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function TimeLimitedAccessDisclaimer({ duration = 1800 }: { duration?: number }) {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minutes`;
  };

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          <Clock className="w-5 h-5 text-yellow-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-2 text-yellow-800">
            Time-Limited Access
          </h3>
          <p className="text-sm text-yellow-800">
            Your access is limited to {formatDuration(duration)} once you start viewing. The timer continues running even when you exit, so make sure you have uninterrupted time to enjoy your exclusive content before it expires.
          </p>
        </div>
      </div>
    </div>
  );
} 