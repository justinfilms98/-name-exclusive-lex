import { supabase } from './supabase'

export const ADMIN_EMAIL = 'contact.exclusivelex@gmail.com' // Admin access email

export const isAdmin = (email: string | undefined | null) => {
  return email === ADMIN_EMAIL
}

export const requireAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

export const requireAdmin = async () => {
  const user = await requireAuth()
  if (!user || !isAdmin(user.email)) {
    throw new Error('Admin access required')
  }
  return user
}

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

export const getUserRole = (email: string) => {
  return isAdmin(email) ? 'admin' : 'user'
} 