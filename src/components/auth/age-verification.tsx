'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function AgeVerification() {
  const [isVerified, setIsVerified] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already verified their age
    const verified = localStorage.getItem('age_verified')
    if (verified === 'true') {
      setIsVerified(true)
    } else {
      setIsVisible(true)
    }
  }, [])

  const handleVerify = () => {
    localStorage.setItem('age_verified', 'true')
    setIsVerified(true)
    setIsVisible(false)
  }

  const handleDecline = () => {
    window.location.href = 'https://www.google.com'
  }

  if (isVerified) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-md w-full mx-4 bg-[#F2E8D5] rounded-lg shadow-xl p-8"
          >
            <div className="text-center">
              <h2 className="font-serif text-3xl font-bold text-[#2E4A2E] mb-4">
                Age Verification Required
              </h2>
              <p className="text-[#3C2F2F] mb-6">
                This website contains adult content and is only suitable for those who are 18 years or older.
                By entering, you confirm that you are at least 18 years of age.
              </p>
              <div className="space-y-4">
                <Button
                  onClick={handleVerify}
                  className="w-full bg-[#2E4A2E] text-[#F2E8D5] hover:bg-[#3C2F2F]"
                >
                  I am 18 or older
                </Button>
                <Button
                  onClick={handleDecline}
                  variant="outline"
                  className="w-full border-[#2E4A2E] text-[#2E4A2E] hover:bg-[#2E4A2E] hover:text-[#F2E8D5]"
                >
                  I am under 18
                </Button>
              </div>
              <p className="mt-4 text-sm text-[#3C2F2F]">
                By entering the site, you also agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 