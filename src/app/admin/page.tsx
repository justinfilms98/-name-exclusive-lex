import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await getServerSession(getAuthOptions());
  if (!session) {
    redirect('/login');
  }
  if (!session.user || (session.user as any).role !== 'admin') {
    redirect('/unauthorized');
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-serif mb-4">Admin Dashboard</h1>
        <p className="text-stone-700">Welcome, admin!</p>
      </div>
    </div>
  );
} 