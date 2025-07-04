import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  videoUploader: f({ video: { maxFileSize: "1GB" } })
    .middleware(async () => {
      // TODO: Add proper authentication check here
      // For now, we'll allow all uploads but can add auth later
      return { userId: "admin" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete", file);
      // The file URL will be available at file.url
      // We can save this to Supabase via server action if needed
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 