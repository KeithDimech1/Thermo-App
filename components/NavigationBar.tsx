'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavigationBar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: '🏔️' },
    { href: '/upload', label: 'Upload', icon: '📤' },
    { href: '/datasets', label: 'Datasets', icon: '📄' },
    { href: '/samples', label: 'Samples', icon: '🔬' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-thermo-forest border-b border-thermo-forest-light shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-3 text-thermo-cream font-semibold text-xl hover:text-thermo-gold transition-colors">
            <svg className="w-8 h-8" viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M35 120C35 95 20 80 20 60C20 40 35 25 50 10C65 25 80 40 80 60C80 80 65 95 65 120C65 130 57.5 140 50 140C42.5 140 35 130 35 120Z" fill="currentColor" className="text-thermo-gold"/>
              <path d="M45 115C45 100 38 90 38 75C38 60 45 50 50 40C55 50 62 60 62 75C62 90 55 100 55 115C55 120 52.5 125 50 125C47.5 125 45 120 45 115Z" fill="currentColor" className="text-thermo-forest"/>
            </svg>
            <span className="hidden sm:inline font-bold tracking-tight">Thermo</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                  ${
                    isActive(item.href)
                      ? 'bg-thermo-gold text-thermo-forest shadow-md'
                      : 'text-thermo-cream hover:bg-thermo-forest-light hover:text-thermo-gold'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
