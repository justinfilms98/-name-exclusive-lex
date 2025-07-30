"use client";

import { AlertTriangle, Info, RefreshCw } from 'lucide-react';

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
            "You can purchase multiple collections and access them all.",
            "Each purchase grants you permanent access to the content.",
            "You can exit and return to any purchased collection from your account page.",
            "Your access never expires - you can watch anytime, anywhere."
          ],
          bgColor: "bg-amber-50 border-amber-200",
          textColor: "text-amber-800"
        };
      
      case 'watch':
        return {
          icon: <Info className="w-5 h-5 text-blue-600" />,
          title: "Current Active Purchase",
          content: [
            "You are currently viewing one of your purchased collections.",
            "You can exit and purchase other collections - all access is permanent.",
            "Access all your purchased collections from your account page.",
            "Your access never expires - enjoy unlimited viewing."
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
            "Each purchase grants you permanent access to the content.",
            "Access all your purchased collections from your account page."
          ],
          bgColor: "bg-green-50 border-green-200",
          textColor: "text-green-800"
        };
      
      default:
        return {
          icon: <Info className="w-5 h-5 text-gray-600" />,
          title: "Purchase Information",
          content: [
            "You can have multiple purchased collections at the same time.",
            "Each purchase grants you permanent access to the content."
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