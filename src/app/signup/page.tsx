'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { FcGoogle } from 'react-icons/fc'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn('google', { 
        callbackUrl: '/',
        redirect: true
      });
      
      if (result?.error) {
        console.error('Sign in error:', result.error);
      }
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E3F2F9] px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="font-serif text-4xl font-bold text-[#2E4A2E] mb-2">
            Join Exclusive Lex
          </h2>
          <p className="text-[#3C2F2F] text-lg">
            Create your account to access premium content
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center space-x-2 bg-[#4A7A4A] text-[#F2E8D5] border border-[#4A7A4A] hover:bg-[#2E4A2E] hover:text-[#F2E8D5] text-lg py-6"
          >
            <FcGoogle className="w-6 h-6" />
            <span>Sign up with Google</span>
          </Button>

          <div className="text-center text-sm text-[#3C2F2F]">
            <p>Already have an account?{' '}
              <a href="/login" className="text-[#2E4A2E] hover:text-[#4A7A4A] font-medium">
                Sign in
              </a>
            </p>
            <p className="mt-4">By signing up, you agree to our</p>
            <p>
              <a href="/terms" className="text-[#2E4A2E] hover:text-[#4A7A4A]">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-[#2E4A2E] hover:text-[#4A7A4A]">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 