import { supabase } from './supabase'

export const ADMIN_EMAIL = 'contact.exclusivelex@gmail.com' // Admin access email

export const isAdmin = (email: string | undefined | null) => {
  return email === ADMIN_EMAIL
}

export const requireAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Auth session error:', error)
      return null
    }
    return session?.user || null
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export const requireAdmin = async () => {
  const user = await requireAuth()
  if (!user || !isAdmin(user.email)) {
    throw new Error('Admin access required')
  }
  return user
}

// Modified to allow admin users to make purchases like regular users
export const checkAccess = async (userId: string, collectionId: string) => {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', userId)
    .eq('collection_id', collectionId)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  return { hasAccess: !error && !!data, purchase: data }
}

// New function to check if user can make purchases (allows admin users)
export const canMakePurchase = async (userId: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  // Allow all authenticated users to make purchases, including admin
  return true
}

export const getUserRole = (email: string) => {
  return isAdmin(email) ? 'admin' : 'user'
}

// New function to check if user can sign up (allows all Google users)
export const canSignUp = async (email: string) => {
  // Allow all Google users to sign up
  return true
}

// New function to validate user authentication
export const validateUserAuth = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('User validation error:', error)
      return { user: null, error: error.message }
    }
    return { user, error: null }
  } catch (error) {
    console.error('User validation error:', error)
    return { user: null, error: 'Authentication failed' }
  }
} 