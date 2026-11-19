import { Crown } from 'lucide-react';

// Brand wordmark: "KingMovers" + "Kenya" in the accent colour.
export default function Logo() {
  return (
    <>
      <span className="logo-mark"><Crown size={18} /></span>
      <span>KingMovers<span className="logo-accent">Kenya</span></span>
    </>
  );
}
