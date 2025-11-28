import { ArrowLeft, Sun, Moon, Monitor } from 'lucide-react';
import { ThemeMode } from '../types/proxy';
import { useTheme } from './ThemeContext';

interface AppearancePageProps {
  onBack: () => void;
}

const themeOptions: { mode: ThemeMode; icon: typeof Sun; label: string; description: string }[] = [
  { mode: 'light', icon: Sun, label: 'Light', description: 'Always use light theme' },
  { mode: 'dark', icon: Moon, label: 'Dark', description: 'Always use dark theme' },
  { mode: 'system', icon: Monitor, label: 'System', description: 'Sync with browser/OS theme' },
];

export default function AppearancePage({ onBack }: AppearancePageProps) {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 inline-flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-200" />
          </button>
          <h1 className="text-xl font-medium text-gray-900 dark:text-white">Appearance</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">Theme</p>
            <div className="space-y-2">
              {themeOptions.map(({ mode, icon: Icon, label, description }) => (
                <button
                  key={mode}
                  onClick={() => setThemeMode(mode)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg border transition-colors ${
                    themeMode === mode
                      ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-neutral-700'
                      : 'border-gray-200 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${
                    themeMode === mode 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${
                      themeMode === mode 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-700 dark:text-gray-200'
                    }`}>
                      {label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
                  </div>
                  {themeMode === mode && (
                    <div className="h-2 w-2 rounded-full bg-gray-900 dark:bg-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
