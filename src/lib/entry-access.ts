import { supabase } from './supabase';
import { isAdminEmail } from './auth';

export interface EntryAccessStatus {
  hasAccess: boolean;
  status: 'active' | 'pending' | 'none' | 'checking';
}

/**
 * Check if the current user has active entry access
 * Admin users automatically have access (bypass entry fee)
 * Optionally seeds entry_access record for admin users (best-effort, non-blocking)
 */
export async function checkEntryAccess(userId: string, userEmail?: string | null): Promise<EntryAccessStatus> {
  try {
    // Admin users bypass entry fee requirement
    if (userEmail && isAdminEmail(userEmail)) {
      // Best-effort seeding: if admin has no entry_access row, create one for recordkeeping
      // This is non-blocking - if it fails, we still grant access
      supabase
        .from('entry_access')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()
        .then(async (result) => {
          if (!result.data && !result.error) {
            // No entry_access record exists, create one
            try {
              await supabase
                .from('entry_access')
                .insert({
                  user_id: userId,
                  email: userEmail,
                  status: 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
            } catch (seedError) {
              // Silently fail - this is best-effort and shouldn't block the request
              console.log('Could not seed entry_access for admin (non-blocking):', seedError);
            }
          }
        })
        .catch(() => {
          // Silently fail - this is best-effort
        });

      return { hasAccess: true, status: 'active' };
    }

    const { data: entryAccess, error } = await supabase
      .from('entry_access')
      .select('status')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking entry access:', error);
      return { hasAccess: false, status: 'none' };
    }

    if (!entryAccess) {
      return { hasAccess: false, status: 'none' };
    }

    return {
      hasAccess: entryAccess.status === 'active',
      status: entryAccess.status as 'active' | 'pending',
    };
  } catch (error) {
    console.error('Error checking entry access:', error);
    return { hasAccess: false, status: 'none' };
  }
}
