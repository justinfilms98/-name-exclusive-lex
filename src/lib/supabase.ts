import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'SET' : 'MISSING',
    key: supabaseAnonKey ? 'SET' : 'MISSING'
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth functions
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        prompt: 'select_account' // Force account selection
      }
    }
  })
  return { data, error }
}

export const signOut = async () => {
  try {
    // Clear all local storage and session storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    // Additional cleanup for mobile browsers
    if (typeof window !== 'undefined') {
      // Clear any remaining auth data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear Google OAuth session by redirecting to Google's logout
      // This forces the user to choose an account on next login
      const googleLogoutUrl = 'https://accounts.google.com/logout';
      window.open(googleLogoutUrl, '_blank', 'width=1,height=1');
    }
    
    return { error }
  } catch (err) {
    console.error('Sign out error:', err);
    return { error: err }
  }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // For mobile browsers, try to refresh the session if it's expired
    if (!session && typeof window !== 'undefined') {
      console.log('No session found, attempting to refresh...');
      const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
      return refreshedSession;
    }
    
    return session
  } catch (err) {
    console.error('Get session error:', err);
    return null
  }
}

// Storage functions
export const uploadFile = async (file: File, bucket: string, path: string) => {
  try {
    console.log('Uploading file:', { name: file.name, size: file.size, bucket, path });
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Supabase upload error:', error);
    } else {
      console.log('Upload successful:', data);
    }
    
    return { data, error }
  } catch (err: any) {
    console.error('Upload function error:', err);
    return { data: null, error: { message: err.message } }
  }
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
    .select('*, photo_paths')
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