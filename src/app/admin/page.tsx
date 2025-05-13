import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import React, { useState } from 'react';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || typeof session.user.email !== 'string') {
    redirect('/');
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (user?.role !== 'CREATOR') {
    redirect('/');
  }
  // Fetch videos for this creator
  const videos = await prisma.video.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  // The rest of the component remains mostly the same, but remove useSession/useRouter/useEffect
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-serif text-4xl font-bold text-[#2E4A2E] mb-8">
        Admin Dashboard
      </h1>
      {/* List all videos */}
      <div className="mb-8">
        <h2 className="font-serif text-2xl mb-4">All Videos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="bg-white p-4 rounded shadow">
              <h3 className="font-bold text-lg">{video.title}</h3>
              <p>{video.description}</p>
              <p>Price: ${video.price}</p>
              <p>Type: {video.type}</p>
              {/* Edit button logic can be implemented client-side if needed */}
            </div>
          ))}
        </div>
      </div>
      {/* The rest of the upload/edit UI can remain as is, but should be refactored to use client-side logic only for upload/edit */}
      {/* ...existing upload form and logic... */}
    </div>
  );
} 