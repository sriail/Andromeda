import SearchBar from './SearchBar';
import { useTheme } from './ThemeContext';

interface SearchPageProps {
  onSearch: (query: string) => void;
}

export default function SearchPage({ onSearch }: SearchPageProps) {
  const { logoPath } = useTheme();

  return (
    <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-neutral-900 px-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl -mt-20">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <img 
            src={logoPath} 
            alt="Andromeda" 
            className="w-24 h-24"
          />
          <h1 className="text-4xl font-medium text-gray-900 dark:text-white">Andromeda</h1>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            A simple, fast web proxy
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full">
          <SearchBar 
            onSearch={onSearch} 
            placeholder="Search or enter URL..."
          />
        </div>
      </div>
    </div>
  );
}
