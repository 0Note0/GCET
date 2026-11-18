import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ImpactMetric {
  id: string;
  label: string;
  targetValue: number;
  prefix?: string;
  suffix: string;
  decimals?: number;
  context: string;
}

const IMPACT_METRICS: ImpactMetric[] = [
  {
    id: 'overflow',
    label: 'Reduced Overflow',
    targetValue: 78,
    prefix: '-',
    suffix: '%',
    context:
      'Reduction in unscheduled bin overflow events per semester across dining and hostel blocks.',
  },
  {
    id: 'cleanliness',
    label: 'Cleaner Campus',
    targetValue: 96.4,
    suffix: '%',
    decimals: 1,
    context:
      'Average daily smart bin capacity availability maintained across Plot No. 1, Knowledge Park II.',
  },
  {
    id: 'speed',
    label: 'Faster Waste Collection',
    targetValue: 11,
    suffix: ' min',
    context:
      'Mean dispatch-to-clearance turnaround time via mobile crew alerts, down from 52 min.',
  },
  {
    id: 'sustainability',
    label: 'Sustainable Environment',
    targetValue: 42,
    prefix: '+',
    suffix: '%',
    context:
      'Increase in segregated dry recyclables and paper/e-waste recovery across academic wings.',
  },
];

interface ImpactSectionProps {
  onOpenReportDrawer: () => void;
}

export const ImpactSection: React.FC<ImpactSectionProps> = ({ onOpenReportDrawer }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const numberRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!sectionRef.current) return;
      const obj = { progress: 0 };

      gsap.to(obj, {
        progress: 1,
        duration: 1.4,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          once: true,
        },
        onUpdate: () => {
          IMPACT_METRICS.forEach((m, idx) => {
            const el = numberRefs.current[idx];
            if (!el) return;
            const raw = m.targetValue * obj.progress;
            const formatted =
              m.decimals !== undefined
                ? raw.toFixed(m.decimals)
                : Math.round(raw).toString();
            el.textContent = `${m.prefix ?? ''}${formatted}${m.suffix}`;
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="impact"
      ref={sectionRef}
      className="w-full bg-[#0D2118] text-white py-20 md:py-28"
    >
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="max-w-2xl mb-14 space-y-3">
          <p className="font-mono text-xs font-medium text-[#95C5AC]">
            SECTION 07 · MEASURED CAMPUS IMPACT
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-balance">
            Built for a Cleaner, Zero-Overflow GCET Campus
          </h2>
          <p className="text-sm md:text-base text-[#C4DDD0] leading-relaxed">
            Real-time ultrasonic sensing, instant student reporting, and EV road routing transform
            campus sanitation into a measurable sustainability benchmark.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {IMPACT_METRICS.map((metric, idx) => (
            <div
              key={metric.id}
              className="p-6 rounded-xl bg-[#132E22] border border-[#28543F] flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="text-xs font-semibold text-[#95C5AC]">{metric.label}</div>
                <div className="font-display text-4xl md:text-5xl font-bold text-white mt-2 tabular-nums">
                  <span
                    ref={(el) => {
                      numberRefs.current[idx] = el;
                    }}
                  >
                    {metric.prefix ?? ''}
                    {metric.decimals !== undefined
                      ? metric.targetValue.toFixed(metric.decimals)
                      : metric.targetValue}
                    {metric.suffix}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#C4DDD0] leading-relaxed">{metric.context}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-10 border-t border-[#224735] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-xl font-bold text-white">
              Spotted an overflowing campus bin right now?
            </h3>
            <p className="text-xs text-[#B8DEC9] mt-1">
              Submit an instant alert to notify the sanitation crew and update the live GCET map.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenReportDrawer}
            className="px-6 py-3 text-sm font-semibold text-[#0D2118] bg-[#D8ECE2] rounded-md hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Report Bin Overflow
          </button>
        </div>
      </div>
    </section>
  );
};
