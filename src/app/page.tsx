import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50">
      <h1 className="text-5xl md:text-6xl font-bold mb-4 text-green-900 text-center">
        Experience Pure Intimacy
      </h1>
      <p className="text-xl md:text-2xl text-green-800 mb-8 text-center">
        Curated collection of authentic, passionate moments
      </p>
      <Link href="/collections">
        <button className="bg-green-900 text-white px-6 py-2 rounded hover:bg-green-800 transition">
          Explore Collections
        </button>
      </Link>
    </div>
  );
} 