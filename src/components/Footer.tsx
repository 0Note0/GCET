import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#08150F] text-white py-10 border-t border-[#1D3B2C]">
      <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="font-display text-base font-bold tracking-tight">
            GCET SmartWaste
          </div>
          <p className="text-xs text-[#95C5AC]">
            Galgotias College of Engineering &amp; Technology · Plot No. 1, Knowledge Park II,
            Greater Noida, UP 201310
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-6 text-xs text-[#C4DDD0]"
        >
          <a href="#hero" className="hover:text-white hover:underline underline-offset-4">
            Hero
          </a>
          <a href="#campus-overview" className="hover:text-white hover:underline underline-offset-4">
            Campus Map
          </a>
          <a href="#smart-deployment" className="hover:text-white hover:underline underline-offset-4">
            Deployment
          </a>
          <a href="#data-flow" className="hover:text-white hover:underline underline-offset-4">
            Data Flow
          </a>
          <a href="#dashboard" className="hover:text-white hover:underline underline-offset-4">
            Dashboard
          </a>
          <a
            href="#route-optimization"
            className="hover:text-white hover:underline underline-offset-4"
          >
            Route
          </a>
          <a href="#impact" className="hover:text-white hover:underline underline-offset-4">
            Impact
          </a>
        </nav>

        <div className="text-xs text-[#95C5AC] font-mono tabular-nums">
          28.4568° N, 77.4976° E
        </div>
      </div>
    </footer>
  );
};
