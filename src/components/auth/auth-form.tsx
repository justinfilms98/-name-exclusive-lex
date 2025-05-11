'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { LogOut } from 'lucide-react'

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const signupSchema = authSchema.extend({
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type AuthFormData = z.infer<typeof authSchema>
type SignupFormData = z.infer<typeof signupSchema>

export function AuthForm() {
  const [isLogin, setIsLogin] = React.useState(true)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [username, setUsername] = React.useState<string>('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AuthFormData | SignupFormData>({
    resolver: zodResolver(isLogin ? authSchema : signupSchema),
  })

  const onSubmit = async (data: AuthFormData | SignupFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Implement actual authentication logic
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      if (isLogin) {
        // Mock successful login
        setIsAuthenticated(true)
        setUsername(data.email.split('@')[0]) // Use email prefix as username for demo
      } else {
        // Mock successful signup
        setIsLogin(true)
        reset()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUsername('')
    reset()
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    setError(null)
    reset()
  }

  const handleForgotPassword = () => {
    // TODO: Implement password reset logic
    console.log('Password reset requested')
  }

  return (
    <Card className="max-w-md mx-auto p-6">
      {isAuthenticated ? (
        <div className="flex items-center justify-between mb-6">
          <span className="text-lg font-medium">Welcome, {username}!</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      ) : null}

      <div className="flex justify-center mb-6">
        <div className="grid grid-cols-2 gap-2 bg-muted rounded-lg p-1">
          <Button
            variant={isLogin ? "default" : "ghost"}
            onClick={() => !isLogin && switchMode()}
          >
            Login
          </Button>
          <Button
            variant={!isLogin ? "default" : "ghost"}
            onClick={() => isLogin && switchMode()}
          >
            Sign Up
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            {...register('email')}
            type="email"
            placeholder="Email"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Input
            {...register('password')}
            type="password"
            placeholder="Password"
            className={errors.password ? 'border-red-500' : ''}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        {!isLogin && (
          <div>
            <Input
              {...register('confirmPassword')}
              type="password"
              placeholder="Confirm Password"
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
        </Button>

        {isLogin && (
          <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={handleForgotPassword}
          >
            Forgot Password?
          </Button>
        )}
      </form>
    </Card>
  )
} 