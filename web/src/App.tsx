import { addDays, format, previousSunday, subDays, subMonths } from 'date-fns';
import { useEffect, useState } from 'react';
import { DateRange, DayPicker } from 'react-day-picker';
import clsx from 'clsx';

type AppConfig = {
  JOBBER_OAUTH_HANDLER_FUNCTION_URL: string;
  JOBBER_APP_FUNCTION_URL: string;
  JOBBER_APP_CLIENT_ID: string;
  JOBBER_APP_REDIRECT_URI: string;
  JOBBER_APP_NAME: string;
  JOBBER_APP_TITLE?: string;
};

const defaultConfig: AppConfig = {
  JOBBER_OAUTH_HANDLER_FUNCTION_URL: '',
  JOBBER_APP_FUNCTION_URL: '',
  JOBBER_APP_CLIENT_ID: 'client-id-placeholder',
  JOBBER_APP_REDIRECT_URI: 'https://your-app.example.com',
  JOBBER_APP_NAME: '',
  JOBBER_APP_TITLE: '',
};

type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'light';
};

const formatRangeLabel = (range?: DateRange) => {
  if (!range?.from || !range.to) return 'Select your dates';
  return `${format(range.from, 'MMM d')} → ${format(range.to, 'MMM d, yyyy')}`;
};

// Get previous week's Sunday through Saturday (dynamic based on current date)
const getDefaultRange = (): DateRange => {
  const today = new Date();
  // previousSunday gives us this week's Sunday, subtract 7 to get last week's Sunday
  const lastWeekSunday = subDays(previousSunday(today), 7);
  const lastWeekSaturday = addDays(lastWeekSunday, 6);
  return { from: lastWeekSunday, to: lastWeekSaturday };
};

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [range, setRange] = useState<DateRange | undefined>(getDefaultRange);
  // Track clicks: odd = pick start, even = pick end (start at 2 since we have a complete range)
  const [clickCount, setClickCount] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read OAuth code from URL query params or sessionStorage
  const [code, setCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;

    // Check URL first (Jobber redirects back with ?code=...)
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');

    if (urlCode) {
      // Store in sessionStorage and clean up URL
      sessionStorage.setItem('jobber_oauth_code', urlCode);
      window.history.replaceState({}, '', window.location.pathname);
      return urlCode;
    }

    // Fall back to sessionStorage
    return sessionStorage.getItem('jobber_oauth_code');
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/config.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('Missing config.json');
        const data = (await response.json()) as AppConfig;
        setConfig(data);
        if (data.JOBBER_APP_TITLE) {
          document.title = data.JOBBER_APP_TITLE;
        }
      } catch (err) {
        console.warn('Config load failed, using fallback placeholders', err);
        setConfig(defaultConfig);
      }
    };

    load();
  }, []);

  // Redirect to Jobber OAuth authorize page
  const handleConnect = () => {
    const authorizeUrl = `https://api.getjobber.com/api/oauth/authorize?response_type=code&client_id=${encodeURIComponent(config.JOBBER_APP_CLIENT_ID)}&redirect_uri=${encodeURIComponent(config.JOBBER_APP_REDIRECT_URI)}&state=`;
    window.location.href = authorizeUrl;
  };

  const handleDownload = async () => {
    if (!code) {
      setError('Connect first to authorize.');
      return;
    }
    if (!range?.from || !range.to) {
      setError('Please choose both a start and end date.');
      return;
    }
    setError(null);
    setIsLoading(true);

    const before = format(range.to, 'dd.MM.yyyy');
    const after = format(range.from, 'dd.MM.yyyy');

    try {
      // Step 1: Call OAuth handler to exchange code for token
      const oauthUrl = `${config.JOBBER_OAUTH_HANDLER_FUNCTION_URL}/?code=${encodeURIComponent(code)}&app_name=${encodeURIComponent(config.JOBBER_APP_NAME)}&client_id=${encodeURIComponent(config.JOBBER_APP_CLIENT_ID)}&redirect_uri=${encodeURIComponent(config.JOBBER_APP_REDIRECT_URI)}&state=`;

      const oauthResponse = await fetch(oauthUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: '',
      });

      if (!oauthResponse.ok) {
        const errorText = await oauthResponse.text();
        throw new Error(errorText || `OAuth handler failed (${oauthResponse.status})`);
      }

      // Step 2: Call app function with code and date range
      const appUrl = `${config.JOBBER_APP_FUNCTION_URL}?code=${encodeURIComponent(code)}&before=${encodeURIComponent(before)}&after=${encodeURIComponent(after)}`;

      const appResponse = await fetch(appUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: '',
      });

      if (!appResponse.ok) {
        const errorText = await appResponse.text();
        throw new Error(errorText || `App function failed (${appResponse.status})`);
      }

      const data = await appResponse.text();

      // Auto-download as output.csv (matching Yew app behavior)
      const blob = new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'output.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const isConnected = Boolean(code);

  return (
    <div className={clsx(theme === 'dark' && 'dark')}>
      <div className="min-h-screen bg-white text-ink dark:bg-ink dark:text-sand">
        <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 lg:py-14">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-plum text-white shadow-subtle">
                <i className="fa-regular fa-calendar-check" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-plum dark:text-sand">Date export</p>
                <h1 className="text-xl font-bold">{config.JOBBER_APP_NAME || 'Jobber App'}</h1>
              </div>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate/20 text-slate/80 transition hover:border-slate/40 hover:text-ink dark:border-slate/60 dark:text-sand/70 dark:hover:text-white"
              onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
              aria-label="Toggle theme"
            >
              <i className={clsx('fa-solid', theme === 'dark' ? 'fa-moon' : 'fa-sun')} />
            </button>
          </header>

          <section className="glass-panel p-6 sm:p-7">
            {!isConnected ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-slate/70 dark:text-sand/70">Click to connect</p>
                <button
                  type="button"
                  className="action-button primary"
                  onClick={handleConnect}
                >
                  Connect
                </button>
                {error && <p className="text-xs text-plum-dark dark:text-sand/80">{error}</p>}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs uppercase tracking-wide text-plum dark:text-sand">Date range</p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-plum/10 px-3 py-1 font-semibold text-plum dark:bg-sand/10 dark:text-sand">
                        {formatRangeLabel(range)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate/80 dark:text-sand/70">
                    <span className="flex items-center gap-1 rounded-full bg-forest/10 px-3 py-1 font-semibold text-forest">
                      Connected
                    </span>
                    <button
                      type="button"
                      className="underline underline-offset-4 hover:text-ink dark:hover:text-white"
                      onClick={() => {
                        sessionStorage.removeItem('jobber_oauth_code');
                        setCode(null);
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate/15 bg-white p-4 shadow-sm dark:border-slate/60 dark:bg-slate/60">
                  <div className="flex items-center justify-between text-sm text-slate/80 dark:text-sand">
                    <span>Select two dates</span>
                    <button type="button" className="underline underline-offset-4" onClick={() => { setRange(undefined); setClickCount(0); }}>
                      Clear
                    </button>
                  </div>
                  <div className="mt-4">
                    <DayPicker
                      mode="range"
                      selected={range}
                      onDayClick={(day) => {
                        const nextClick = clickCount + 1;
                        setClickCount(nextClick);

                        if (nextClick % 2 === 1) {
                          // Odd click: clear everything, pick new start
                          setRange({ from: day, to: undefined } as DateRange);
                        } else {
                          // Even click: pick end
                          const start = range?.from ?? day;
                          if (day < start) {
                            setRange({ from: day, to: start } as DateRange);
                          } else {
                            setRange({ from: start, to: day } as DateRange);
                          }
                        }
                      }}
                      onSelect={() => {
                        // Disable built-in range selection - we handle it manually via onDayClick
                      }}
                      numberOfMonths={2}
                      weekStartsOn={0}
                      pagedNavigation
                      defaultMonth={range?.from ? subMonths(range.from, 1) : subMonths(new Date(), 1)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    className="action-button primary"
                    onClick={handleDownload}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Downloading…' : 'Download'}
                  </button>
                </div>
                {error && <p className="text-sm text-plum-dark dark:text-sand/80">{error}</p>}
              </div>
            )}
          </section>

          {isLoading && (
            <div className="flex items-center justify-center gap-3 text-sm text-slate/80 dark:text-sand/80">
              <div className="loader" />
              <span>Processing…</span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
