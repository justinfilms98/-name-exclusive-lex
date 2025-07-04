import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-blue-50 p-8 pt-28">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Admin Dashboard</h1>
        <div className="flex flex-col gap-6 items-center">
          <Link href="/admin/hero-videos" className="w-full max-w-md p-6 bg-white rounded-lg shadow hover:bg-blue-100 transition text-center text-xl font-semibold">
            Manage Hero Videos
          </Link>
          <Link href="/admin/collection-videos" className="w-full max-w-md p-6 bg-white rounded-lg shadow hover:bg-blue-100 transition text-center text-xl font-semibold">
            Manage Collection Videos
          </Link>
        </div>
      </div>
    </div>
  );
} 