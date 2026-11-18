import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onOpenReportDrawer: () => void;
}

const NAV_LINKS = [
  { href: '#campus-overview', label: 'Campus Map' },
  { href: '#smart-deployment', label: 'Deployment' },
  { href: '#data-flow', label: 'Data Flow' },
  { href: '#dashboard', label: 'Dashboard' },
  { href: '#route-optimization', label: 'Route & Impact' },
];

export const Navbar: React.FC<NavbarProps> = ({ onOpenReportDrawer }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[900] w-full bg-white/90 backdrop-blur-md border-b border-[#DCE8E1]">
      <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between gap-8">
        <a
          href="#hero"
          className="font-display text-base font-bold tracking-tight text-[#152D22] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#163A2B]"
        >
          GCET SmartWaste
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-xs font-medium text-[#3B5548]"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-[#152D22] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#163A2B]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenReportDrawer}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#163A2B] rounded-md hover:bg-[#0F2A1F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163A2B]"
          >
            Report Overflow
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden p-1.5 rounded-md text-[#152D22] hover:bg-[#EDF4F0] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163A2B]"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          id="mobile-nav-menu"
          aria-label="Mobile navigation"
          className="md:hidden border-t border-[#DCE8E1] bg-white px-6 py-3 flex flex-col gap-2"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-medium text-[#152D22] hover:text-[#2D6A4F] border-b border-[#F2F7F4] last:border-b-0"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
};
