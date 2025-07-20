"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Video, Upload, Settings, BarChart3 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/login');
        return;
      }

      if (!session.user.email || !isAdmin(session.user.email)) {
        router.push('/unauthorized');
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.user) {
          router.push('/login');
        } else if (!session.user.email || !isAdmin(session.user.email)) {
          router.push('/unauthorized');
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center text-pearl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-salmon mx-auto mb-4"></div>
          <p className="text-green">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'overview', name: 'Overview', href: '/admin', icon: BarChart3 },
    { id: 'hero', name: 'Manage Hero', href: '/admin/hero', icon: Video },
    { id: 'collections', name: 'Collections', href: '/admin/collections', icon: Upload },
    { id: 'settings', name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const activeTab = pathname === '/admin' ? 'overview' : pathname?.split('/').pop();

  return (
    <div className="min-h-screen bg-sand pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Admin Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-pearl mb-2">Admin Dashboard</h1>
          <p className="text-green">Welcome back, {user.email}</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-pearl border-opacity-20">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-salmon text-salmon'
                        : 'border-transparent text-green hover:text-pearl hover:border-pearl'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {children}
        </div>
      </div>
    </div>
  );
} 