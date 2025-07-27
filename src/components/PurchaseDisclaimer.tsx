"use client";

import { AlertTriangle, Info, Clock, RefreshCw } from 'lucide-react';

interface PurchaseDisclaimerProps {
  variant?: 'checkout' | 'watch' | 'success';
  className?: string;
}

export default function PurchaseDisclaimer({ variant = 'checkout', className = '' }: PurchaseDisclaimerProps) {
  const getDisclaimerContent = () => {
    switch (variant) {
      case 'checkout':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          title: "Important Purchase Information",
          content: [
            "When you make a new purchase, any previous active purchases will be automatically deactivated.",
            "You can only have one active purchase at a time.",
            "To access a different collection, simply make a new purchase from the collections page.",
            "There is no way to reactivate older purchases once a new one is made."
          ],
          bgColor: "bg-amber-50 border-amber-200",
          textColor: "text-amber-800"
        };
      
      case 'watch':
        return {
          icon: <Info className="w-5 h-5 text-blue-600" />,
          title: "Current Active Purchase",
          content: [
            "You are currently viewing your active purchase.",
            "If you want to watch a different collection, exit this page and make a new purchase.",
            "Making a new purchase will deactivate this current access.",
            "Previous purchases cannot be reactivated once deactivated."
          ],
          bgColor: "bg-blue-50 border-blue-200",
          textColor: "text-blue-800"
        };
      
      case 'success':
        return {
          icon: <RefreshCw className="w-5 h-5 text-green-600" />,
          title: "Purchase Successfully Activated",
          content: [
            "Your new purchase is now active and any previous purchases have been deactivated.",
            "You can only access one collection at a time.",
            "To switch to a different collection, make a new purchase from the collections page.",
            "Enjoy your exclusive content!"
          ],
          bgColor: "bg-green-50 border-green-200",
          textColor: "text-green-800"
        };
      
      default:
        return {
          icon: <Info className="w-5 h-5 text-gray-600" />,
          title: "Purchase Information",
          content: [
            "Only one purchase can be active at a time.",
            "New purchases automatically deactivate previous ones."
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

export function TimeLimitedAccessDisclaimer() {
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
            Your access is limited to 30 minutes once you start viewing. Make sure you have uninterrupted time to enjoy your exclusive content before it expires.
          </p>
        </div>
      </div>
    </div>
  );
} 