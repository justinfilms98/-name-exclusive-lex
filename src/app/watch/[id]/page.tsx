import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { checkAccess } from '@/lib/auth';
import WatchPageClient from './WatchPageClient';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WatchPage({ params }: PageProps) {
  // Await params in Next.js 15
  const { id } = await params;

  // Get current user server-side
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has access to this collection
  const { hasAccess, purchase } = await checkAccess(session.user.id, id);
  
  if (!hasAccess) {
    redirect('/collections');
  }

  // Get collection details
  const { data: collection, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !collection) {
    redirect('/collections');
  }

  return (
    <WatchPageClient 
      collection={collection}
      purchase={purchase}
      user={session.user}
    />
  );
} 