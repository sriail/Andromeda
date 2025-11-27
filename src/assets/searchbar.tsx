import { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search query:', query);
    // Add your search logic here
  };

  return (
    <div className="flex items-center bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-200 w-full max-w-2xl">
      <Search className="ml-5 text-gray-400" size={20} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
        placeholder="Search for anything..."
        className="flex-1 px-4 py-4 text-lg outline-none rounded-full"
      />
    </div>
  );
}
