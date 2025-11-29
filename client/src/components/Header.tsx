import { Link, useLocation } from 'wouter';
import { ThemeToggle } from './ThemeToggle';
import { WalletConnect } from './WalletConnect';
import { Button } from '@/components/ui/button';
import { Hexagon, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const [location] = useLocation();

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      data-testid="header"
    >
      <div className="container flex h-14 max-w-screen-md items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link 
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground hover:opacity-80 transition-opacity"
          data-testid="link-home"
        >
          <div className="w-8 h-8 rounded-lg base-gradient flex items-center justify-center">
            <Hexagon className="w-5 h-5 text-white" />
          </div>
          <span className="hidden sm:inline">Base SBT Lottery</span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <Link href="/admin">
            <Button 
              variant="ghost" 
              size="icon"
              className={cn(
                location === '/admin' && 'bg-accent'
              )}
              data-testid="link-admin"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Admin</span>
            </Button>
          </Link>
          <ThemeToggle />
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
