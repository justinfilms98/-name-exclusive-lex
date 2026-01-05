import { supabase } from './supabase';
import { isAdminEmail } from './auth';

export interface EntryAccessStatus {
  hasAccess: boolean;
  status: 'active' | 'pending' | 'none' | 'checking';
}

/**
 * Check if the current user has active entry access
 * Admin users automatically have access (bypass entry fee)
 */
export async function checkEntryAccess(userId: string, userEmail?: string | null): Promise<EntryAccessStatus> {
  try {
    // Admin users bypass entry fee requirement
    if (userEmail && isAdminEmail(userEmail)) {
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
