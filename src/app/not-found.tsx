import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', marginTop: '10vh' }}>
      <h2>404 - Not Found</h2>
      <p>Sorry, the page you are looking for does not exist.</p>
      <Link href="/">
        <button style={{ marginTop: 20, padding: '10px 20px', fontSize: 16 }}>Return Home</button>
      </Link>
    </div>
  );
} 