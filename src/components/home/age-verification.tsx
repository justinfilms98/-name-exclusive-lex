'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface AgeVerificationProps {
  onVerify: () => void
}

export function AgeVerification({ onVerify }: AgeVerificationProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-black/50 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-2xl text-center">Age Verification</CardTitle>
          <CardDescription className="text-gray-400 text-center">
            You must be at least 18 years old to access this site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={onVerify}
              className="w-full bg-[#1B4D3E] hover:bg-[#153B30]"
            >
              I am 18 or older
            </Button>
            <Button 
              onClick={() => window.location.href = 'https://www.google.com'}
              variant="outline" 
              className="w-full text-white border-white hover:bg-white hover:text-black"
            >
              I am under 18
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-gray-400 text-sm text-center">
            By entering this site, you confirm that you are at least 18 years old and agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
} 