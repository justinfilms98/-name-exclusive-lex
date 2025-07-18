import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '@/lib/auth';
import AccountClient from './AccountClient';
import { redirect } from 'next/navigation';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const session = await getServerSession(getAuthOptions()) as any;
  if (!session) {
    redirect('/login');
  }
  // Fetch purchases if needed, here just pass empty array for now
  return <AccountClient user={session.user} purchases={[]} />;
}
