import { supabase } from './supabase'

export const ADMIN_EMAIL = 'contact.exclusivelex@gmail.com' // Set your admin email

export const isAdmin = (email: string | undefined | null) => {
  return email === ADMIN_EMAIL
}

export const requireAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export const requireAdmin = async () => {
  const session = await requireAuth()
  if (!session || !isAdmin(session.user.email!)) {
    throw new Error('Admin access required')
  }
  return session
}

export const getUserRole = (email: string) => {
  return isAdmin(email) ? 'admin' : 'user'
} 