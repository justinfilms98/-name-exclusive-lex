import { NextRequest } from 'next/server';
import formidable, { File } from 'formidable';
import { PassThrough } from 'stream';

// Disable Next.js body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

interface UploadedFile extends File {
  uploadedFilePath?: string;
}

export async function serverUpload(req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files; uploadedFileUrl?: string; uploadedFilePath?: string }> {
  return new Promise(async (resolve, reject) => {
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
      keepExtensions: true,
      
      fileWriteStreamHandler: (file: any) => {
        const pass = new PassThrough();
        const bucket = 'videos';
        const filePath = `uploads/${Date.now()}-${file.newFilename}`;

        // TODO: Integrate UploadThing upload logic here. All Supabase code removed.
        
        file.uploadedFilePath = filePath;

        return pass;
      }
    });

    const reqStream = req.body;
    if (!reqStream) {
      return reject(new Error('Request body is missing.'));
    }

    const nodeReadable = new PassThrough();
    const reader = reqStream.getReader();

    const read = async () => {
      try {
        const { done, value } = await reader.read();
        if (done) {
          nodeReadable.end();
          return;
        }
        nodeReadable.write(value);
        read();
      } catch (err) {
        nodeReadable.emit('error', err);
      }
    };
    read();
    
    form.parse(nodeReadable as any, (err, fields, files) => {
      if (err) {
        console.error('Formidable parsing error:', err);
        return reject(err);
      }

      let uploadedFilePath: string | undefined;
      const file = files.video?.[0] ?? files.video;
      
      if (file) {
        uploadedFilePath = (file as UploadedFile).uploadedFilePath;
      }

      if (uploadedFilePath) {
        // TODO: Replace with UploadThing public URL generation
        const mockPublicUrl = `https://uploadthing.com/mock/${uploadedFilePath}`;
        resolve({ fields, files, uploadedFileUrl: mockPublicUrl, uploadedFilePath });
      } else {
        // Resolve even if there's no file, the route can handle it
        resolve({ fields, files });
      }
    });
  });
} 