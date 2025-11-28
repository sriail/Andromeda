import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value?: string;
  onSearch: (query: string) => void;
  compact?: boolean;
  placeholder?: string;
}

export default function SearchBar({ 
  value = '', 
  onSearch, 
  compact = false,
  placeholder = 'Search or enter URL'
}: SearchBarProps) {
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={`flex items-center bg-white dark:bg-neutral-800 rounded-full border border-gray-200 dark:border-neutral-600 w-full transition-shadow duration-200 hover:shadow-md focus-within:shadow-md focus-within:border-gray-300 dark:focus-within:border-neutral-500 ${
        compact ? 'h-10' : 'h-12 shadow-lg dark:shadow-neutral-900/50'
      }`}
    >
      <Search className={`text-gray-400 dark:text-gray-500 ${compact ? 'ml-3 h-4 w-4' : 'ml-5 h-5 w-5'}`} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onClick={(e) => (e.target as HTMLInputElement).select()}
        placeholder={placeholder}
        className={`flex-1 outline-none rounded-full bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
          compact ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base'
        }`}
      />
    </form>
  );
}
