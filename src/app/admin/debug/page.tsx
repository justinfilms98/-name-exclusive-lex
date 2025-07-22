"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testSupabaseConnection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('count')
        .limit(1);
      
      setResults(prev => ({
        ...prev,
        connection: { success: !error, data, error }
      }));
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        connection: { success: false, error: err.message }
      }));
    }
    setLoading(false);
  };

  const testStorageAccess = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('media')
        .list('', { limit: 1 });
      
      setResults(prev => ({
        ...prev,
        storage: { success: !error, data, error }
      }));
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        storage: { success: false, error: err.message }
      }));
    }
    setLoading(false);
  };

  const testEnvironmentVariables = () => {
    const env = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    };
    
    setResults(prev => ({
      ...prev,
      environment: env
    }));
  };

  const testFileUpload = async () => {
    setLoading(true);
    try {
      // Create a test file
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      const { data, error } = await supabase.storage
        .from('media')
        .upload(`test/${Date.now()}_test.txt`, testFile);
      
      if (!error) {
        // Clean up
        await supabase.storage
          .from('media')
          .remove([data.path]);
      }
      
      setResults(prev => ({
        ...prev,
        upload: { success: !error, data, error }
      }));
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        upload: { success: false, error: err.message }
      }));
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Upload Issues</h1>
      
      <div className="space-y-4">
        <button
          onClick={testEnvironmentVariables}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test Environment Variables
        </button>
        
        <button
          onClick={testSupabaseConnection}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Supabase Connection
        </button>
        
        <button
          onClick={testStorageAccess}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Storage Access
        </button>
        
        <button
          onClick={testFileUpload}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test File Upload
        </button>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Results:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    </div>
  );
} 