import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import WatchPageClient from './WatchPageClient';

interface WatchPageProps {
  params: {
    id: string;
  };
}

async function getCollection(id: string) {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const collection = await getCollection(params.id);

  if (!collection) {
    redirect('/collections');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lex-sand via-lex-cream to-lex-warmGray">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 spinner mx-auto mb-4"></div>
            <p className="text-lex-brown text-lg">Loading video...</p>
          </div>
        </div>
      }>
        <WatchPageClient collectionId={params.id} collection={collection} />
      </Suspense>
    </div>
  );
} 