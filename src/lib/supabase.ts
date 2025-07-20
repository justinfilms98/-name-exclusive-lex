import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth functions
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Storage functions
export const uploadFile = async (file: File, bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })
  return { data, error }
}

export const getSignedUrl = async (bucket: string, path: string, expiresIn: number = 1800) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
  return { data, error }
}

export const deleteFile = async (bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([path])
  return { data, error }
}

// Hero Videos functions
export const getHeroVideos = async () => {
  const { data, error } = await supabase
    .from('hero_videos')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
  return { data, error }
}

export const createHeroVideo = async (heroVideo: any) => {
  const { data, error } = await supabase
    .from('hero_videos')
    .insert([heroVideo])
    .select()
  return { data, error }
}

export const updateHeroVideo = async (id: string, heroVideo: any) => {
  const { data, error } = await supabase
    .from('hero_videos')
    .update(heroVideo)
    .eq('id', id)
    .select()
  return { data, error }
}

export const deleteHeroVideo = async (id: string) => {
  const { data, error } = await supabase
    .from('hero_videos')
    .delete()
    .eq('id', id)
  return { data, error }
}

// Database functions
export const createCollection = async (collection: any) => {
  const { data, error } = await supabase
    .from('collections')
    .insert([collection])
    .select()
  return { data, error }
}

export const getCollections = async () => {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export const getCollection = async (id: string) => {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export const createPurchase = async (purchase: any) => {
  const { data, error } = await supabase
    .from('purchases')
    .insert([purchase])
    .select()
  return { data, error }
}

export const getUserPurchases = async (userId: string) => {
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      collections (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const checkAccess = async (userId: string, collectionId: string) => {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', userId)
    .eq('collection_id', collectionId)
    .gt('expires_at', new Date().toISOString())
    .single()
  return { data, error }
}

export const logWatchActivity = async (log: any) => {
  const { data, error } = await supabase
    .from('watch_logs')
    .insert([log])
  return { data, error }
} 