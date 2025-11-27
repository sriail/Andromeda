import SearchBar from './SearchBar';

interface SearchPageProps {
  onSearch: (query: string) => void;
}

export default function SearchPage({ onSearch }: SearchPageProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl -mt-20">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <img 
            src="/images/andromeda_logo.png" 
            alt="Andromeda" 
            className="w-24 h-24"
          />
          <h1 className="text-4xl font-bold text-gray-900">Andromeda</h1>
          <p className="text-gray-500 text-center">
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

        {/* Quick links */}
        <div className="flex gap-4 flex-wrap justify-center">
          <QuickLink 
            title="Google" 
            url="https://google.com" 
            onClick={onSearch}
          />
          <QuickLink 
            title="YouTube" 
            url="https://youtube.com" 
            onClick={onSearch}
          />
          <QuickLink 
            title="Discord" 
            url="https://discord.com" 
            onClick={onSearch}
          />
          <QuickLink 
            title="Reddit" 
            url="https://reddit.com" 
            onClick={onSearch}
          />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ 
  title, 
  url, 
  onClick 
}: { 
  title: string; 
  url: string; 
  onClick: (url: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(url)}
      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors border border-gray-200"
    >
      {title}
    </button>
  );
}
