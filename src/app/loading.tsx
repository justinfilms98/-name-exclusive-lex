export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-almond to-blanc flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-lex-brown border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-lex-brown text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
}

