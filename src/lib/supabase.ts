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
  try {
    console.log('Attempting Google sign in...')
    
    // Use the correct redirect URL that matches your domain
    const redirectUrl = 'https://www.exclusivelex.com/auth/callback'
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account' // Force account selection
        }
      }
    })
    
    if (error) {
      console.error('Google sign in error:', error)
    } else {
      console.log('Google sign in initiated successfully')
    }
    
    return { data, error }
  } catch (err) {
    console.error('Google sign in exception:', err)
    return { data: null, error: err }
  }
}

export const signOut = async () => {
  try {
    console.log('Signing out...')
    
    // Clear all local storage and session storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Supabase sign out error:', error)
    } else {
      console.log('Sign out successful')
    }
    
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
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Get current user error:', error)
      return null
    }
    return user
  } catch (err) {
    console.error('Get current user exception:', err)
    return null
  }
}

export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Get session error:', error)
      return null
    }
    
    // For mobile browsers, try to refresh the session if it's expired
    if (!session && typeof window !== 'undefined') {
      console.log('No session found, attempting to refresh...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Session refresh error:', refreshError)
      }
      return refreshedSession;
    }
    
    return session
  } catch (err) {
    console.error('Get session exception:', err);
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
    .eq('is_active', true)
    .maybeSingle()
  return { data, error }
}

export const logWatchActivity = async (log: any) => {
  const { data, error } = await supabase
    .from('watch_logs')
    .insert([log])
  return { data, error }
} 