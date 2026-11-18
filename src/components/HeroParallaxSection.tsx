import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'motion/react';
import { ArrowDown, Cpu, Radio, Sun } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface HeroParallaxSectionProps {
  onExploreMap: () => void;
  onOpenReportDrawer: () => void;
}

export const HeroParallaxSection: React.FC<HeroParallaxSectionProps> = ({
  onExploreMap,
  onOpenReportDrawer,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const sensorsRef = useRef<HTMLDivElement>(null);
  const [bgError, setBgError] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (bgRef.current && sectionRef.current) {
        gsap.to(bgRef.current, {
          yPercent: 18,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      if (sensorsRef.current && sectionRef.current) {
        gsap.to(sensorsRef.current, {
          y: -48,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative w-full min-h-[92vh] flex items-center overflow-hidden bg-[#0A1811] text-white"
    >
      {/* Fullscreen Parallax Campus Background */}
      <div
        ref={bgRef}
        className="absolute -top-12 inset-x-0 -bottom-24 pointer-events-none will-change-transform"
      >
        {!bgError ? (
          <img
            src="/src/assets/images/hero_campus_bins_1794939127797.jpg"
            alt="Galgotias College of Engineering and Technology campus plaza with smart waste bins"
            referrerPolicy="no-referrer"
            loading="eager"
            decoding="async"
            onError={() => setBgError(true)}
            className="w-full h-full object-cover opacity-55"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0B1E15] via-[#133223] to-[#08140E]" />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-[#07120D]/80 via-[#0B1B13]/60 to-[#07120D]/95"
        />
      </div>

      {/* Main Hero Content & Floating Smart Sensors */}
      <div className="relative z-10 max-w-[1280px] mx-auto px-6 py-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs font-medium tracking-wide text-[#B8DEC9]"
          >
            Galgotias College of Engineering &amp; Technology · Plot No. 1, Knowledge Park II · 28.4568° N, 77.4976° E
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-bold tracking-tight text-white leading-[1.05] text-balance max-w-2xl"
            style={{ fontSize: 'clamp(2.5rem, 4.8vw, 4.25rem)' }}
          >
            Smart Campus Waste Management System
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="text-base md:text-lg text-[#D7E8DF] leading-relaxed max-w-xl"
          >
            An ultrasonic IoT sensor network, automated cloud alerting pipeline, and EV route
            optimizer keeping every academic block, library, and hostel clean across Greater Noida.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-3 pt-2"
          >
            <button
              type="button"
              onClick={onExploreMap}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#0D2118] bg-[#D8ECE2] rounded-md hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span>Explore Campus Map</span>
              <ArrowDown className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onOpenReportDrawer}
              className="px-6 py-3 text-sm font-semibold text-white bg-white/10 border border-white/25 backdrop-blur-sm rounded-md hover:bg-white/20 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Report Bin Overflow
            </button>
          </motion.div>
        </div>

        {/* Floating Smart Sensor Hardware Nodes */}
        <div ref={sensorsRef} className="lg:col-span-5 space-y-4 will-change-transform">
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="p-5 rounded-xl bg-[#0F2319]/85 backdrop-blur-md border border-[#345C48] flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-[#1C3D2D] border border-[#3B6A53] flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-[#B8DEC9]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-xs text-[#95C5AC] tabular-nums">
                HC-SR04 Ultrasonic Depth Node
              </div>
              <h2 className="font-display text-sm font-bold text-white mt-0.5">
                Millimeter Fill &amp; Temperature Sensing
              </h2>
              <p className="text-xs text-[#C4DDD0] mt-1 leading-relaxed">
                Polls bin depth every 60 seconds and computes percentage capacity with 2% precision.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.32 }}
            className="p-5 rounded-xl bg-[#0F2319]/85 backdrop-blur-md border border-[#345C48] flex items-start gap-4 lg:ml-6"
          >
            <div className="w-10 h-10 rounded-lg bg-[#1C3D2D] border border-[#3B6A53] flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 text-[#B8DEC9]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-xs text-[#95C5AC] tabular-nums">
                LoRaWAN 865 MHz Telemetry Link
              </div>
              <h2 className="font-display text-sm font-bold text-white mt-0.5">
                Low-Power Campus Mesh Gateway
              </h2>
              <p className="text-xs text-[#C4DDD0] mt-1 leading-relaxed">
                Transmits packets from hostels and canteens to Academic Block A Cloud Hub.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.44 }}
            className="p-5 rounded-xl bg-[#0F2319]/85 backdrop-blur-md border border-[#345C48] flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-[#1C3D2D] border border-[#3B6A53] flex items-center justify-center shrink-0">
              <Sun className="w-5 h-5 text-[#B8DEC9]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-xs text-[#95C5AC] tabular-nums">
                5W Monocrystalline Solar Lid
              </div>
              <h2 className="font-display text-sm font-bold text-white mt-0.5">
                Autonomous Off-Grid Power
              </h2>
              <p className="text-xs text-[#C4DDD0] mt-1 leading-relaxed">
                Keeps bin controllers running continuously across summer and monsoon seasons.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
