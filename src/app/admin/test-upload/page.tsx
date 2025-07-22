"use client";

import { useState } from 'react';
import { uploadFile, createCollection } from '@/lib/supabase';

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      console.log('Selected file:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });
    }
  };

  const testUpload = async () => {
    if (!file) {
      setResult({ error: 'No file selected' });
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      console.log('Starting upload test...');
      
      // Test 1: Simple file upload
      const testPath = `test/${Date.now()}_${file.name}`;
      console.log('Uploading to path:', testPath);
      
      const { data, error } = await uploadFile(file, 'media', testPath);
      
      if (error) {
        console.error('Upload failed:', error);
        setResult({ 
          success: false, 
          error: error.message,
          details: error
        });
        return;
      }

      console.log('Upload successful:', data);
      
      // Test 2: Create a test collection
      const collectionId = crypto.randomUUID();
      const collection = {
        id: collectionId,
        title: 'Test Collection',
        description: 'Test upload',
        price: 29.99,
        duration: 1800,
        video_path: testPath,
        thumbnail_path: testPath,
        photo_paths: [],
        created_at: new Date().toISOString(),
      };

      console.log('Creating test collection...');
      const { error: dbError } = await createCollection(collection);
      
      if (dbError) {
        console.error('Database error:', dbError);
        setResult({ 
          success: false, 
          error: `Database error: ${dbError.message}`,
          details: dbError
        });
        return;
      }

      console.log('Test collection created successfully!');
      setResult({ 
        success: true, 
        message: 'Upload and database test successful',
        uploadData: data,
        collectionId
      });

      // Clean up test file
      // await supabase.storage.from('media').remove([testPath]);

    } catch (err: any) {
      console.error('Test failed:', err);
      setResult({ 
        success: false, 
        error: err.message,
        stack: err.stack
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Upload Functionality</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select a file to test upload:
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        
        {file && (
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold">Selected File:</h3>
            <p>Name: {file.name}</p>
            <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <p>Type: {file.type}</p>
          </div>
        )}
        
        <button
          onClick={testUpload}
          disabled={!file || uploading}
          className="bg-blue-500 text-white px-6 py-2 rounded disabled:opacity-50"
        >
          {uploading ? 'Testing...' : 'Test Upload'}
        </button>
      </div>
      
      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 