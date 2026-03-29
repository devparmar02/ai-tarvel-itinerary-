import Link from 'next/link';
import { Map } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-forest/10 flex items-center justify-center mb-6">
        <Map className="w-9 h-9 text-forest" />
      </div>
      <h1 className="font-display text-4xl font-bold mb-2">Lost on the trail?</h1>
      <p className="text-gray-500 mb-8 max-w-sm">This page doesn&apos;t exist — but a great trip is just one click away.</p>
      <Link href="/" className="btn-primary">Back to Home</Link>
    </div>
  );
}
