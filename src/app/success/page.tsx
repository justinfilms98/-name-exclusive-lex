import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-serif font-bold text-text">
            Thank You for Your Purchase!
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Your order has been successfully processed.
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <Link href="/" className="w-full">
            <Button className="w-full" variant="default">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 