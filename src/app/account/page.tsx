import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AccountClient from './AccountClient';
import { redirect } from 'next/navigation';

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }
  // Fetch purchases if needed, here just pass empty array for now
  return <AccountClient user={session.user} purchases={[]} />;
}
