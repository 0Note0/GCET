import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  BellRing,
  CloudUpload,
  LayoutDashboard,
  Play,
  Radar,
  Trash2,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const PIPELINE_STEPS = [
  {
    step: '01',
    title: 'Student Throws Waste',
    detail: 'Waste enters smart dry/wet/e-waste bin at GCET plaza or block.',
    payload: 'Event: Lid Open · Motion Detected',
    Icon: Trash2,
  },
  {
    step: '02',
    title: 'Smart Bin Sensor Detects Fill Level',
    detail: 'HC-SR04 ultrasonic sensor measures residual bin depth in millimeters.',
    payload: 'Depth: 11 cm · Fill: 89%',
    Icon: Radar,
  },
  {
    step: '03',
    title: 'Data Transmitted to Cloud',
    detail: 'LoRaWAN node beams compressed telemetry packet to Block A Gateway.',
    payload: 'Uplink: 865 MHz · 24 bytes',
    Icon: CloudUpload,
  },
  {
    step: '04',
    title: 'Dashboard Receives Data',
    detail: 'Campus telemetry dashboard updates live fill percentage and threshold rules.',
    payload: 'Rule: >= 85% Threshold Triggered',
    Icon: LayoutDashboard,
  },
  {
    step: '05',
    title: 'Collection Team Gets Alert',
    detail: 'Sanitation EV crew receives instant mobile alert with optimized stop.',
    payload: 'Dispatch: EV Cart 02 · ETA 9 min',
    Icon: BellRing,
  },
];

export const DataFlowSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!sectionRef.current) return;
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 65%',
        once: true,
        onEnter: () => {
          setIsSimulating(true);
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!isSimulating) return;
    setActiveStep(0);
    const timers: number[] = [];

    for (let i = 1; i < PIPELINE_STEPS.length; i++) {
      timers.push(
        window.setTimeout(() => {
          setActiveStep(i);
        }, i * 650)
      );
    }

    timers.push(
      window.setTimeout(() => {
        setIsSimulating(false);
      }, PIPELINE_STEPS.length * 650 + 600)
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [isSimulating]);

  return (
    <section
      id="data-flow"
      ref={sectionRef}
      className="w-full bg-[#F7FBF9] py-16 md:py-24 border-b border-[#DCE8E1]"
    >
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2 max-w-2xl">
            <p className="font-mono text-xs font-medium text-[#2D6A4F]">
              SECTION 04 · END-TO-END TELEMETRY PIPELINE
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[#0F1F18] tracking-tight">
              Automated Data Flow Architecture
            </h2>
            <p className="text-sm md:text-base text-[#3D574A]">
              From waste disposal to mobile crew alert in under 3 seconds across campus LoRaWAN
              gateways.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsSimulating(false);
              window.setTimeout(() => setIsSimulating(true), 20);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#163A2B] rounded-md hover:bg-[#0F2A1F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163A2B]"
          >
            <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Replay Live Signal Flow</span>
          </button>
        </div>

        {/* 5-Stage Animated Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
          {PIPELINE_STEPS.map((item, idx) => {
            const Icon = item.Icon;
            const isLit = idx <= activeStep;
            const isCurrent = idx === activeStep;

            return (
              <div key={item.step} className="relative flex flex-col lg:flex-row items-stretch gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  onClick={() => setActiveStep(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveStep(idx);
                    }
                  }}
                  className={`flex-1 p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-[#163A2B] text-white border-[#163A2B] shadow-md'
                      : isLit
                        ? 'bg-white text-[#0F1F18] border-[#74B493]'
                        : 'bg-white/75 text-[#3D574A] border-[#DCE8E1]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span
                        className={`font-mono text-xs font-semibold tabular-nums ${
                          isCurrent ? 'text-[#B8DEC9]' : 'text-[#2D6A4F]'
                        }`}
                      >
                        STEP {item.step}
                      </span>
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isCurrent
                            ? 'bg-white/15 text-white'
                            : 'bg-[#E9F4EE] text-[#163A2B]'
                        }`}
                      >
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </div>
                    </div>

                    <h3
                      className={`font-display text-base font-bold leading-snug ${
                        isCurrent ? 'text-white' : 'text-[#0F1F18]'
                      }`}
                    >
                      {item.title}
                    </h3>

                    <p
                      className={`text-xs leading-relaxed mt-2 ${
                        isCurrent ? 'text-[#D7E8DF]' : 'text-[#4C6459]'
                      }`}
                    >
                      {item.detail}
                    </p>
                  </div>

                  <div
                    className={`mt-4 pt-3 border-t font-mono text-[11px] tabular-nums ${
                      isCurrent
                        ? 'border-white/20 text-[#B8DEC9]'
                        : 'border-[#EBF2EE] text-[#2D6A4F]'
                    }`}
                  >
                    {item.payload}
                  </div>
                </motion.div>

                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className="flex items-center justify-center shrink-0 text-[#52B788]">
                    <ArrowRight
                      className="hidden lg:block w-5 h-5"
                      aria-hidden="true"
                    />
                    <ArrowDown
                      className="lg:hidden w-5 h-5 my-1"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
