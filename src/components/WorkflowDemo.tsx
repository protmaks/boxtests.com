import { useEffect, useState } from 'react';

interface Step {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Create',
    subtitle: 'Build your test',
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" className="animate-draw-rect" />
        <line x1="9" y1="9" x2="15" y2="9" className="animate-draw-line" style={{ animationDelay: '0.3s' }} />
        <line x1="9" y1="13" x2="15" y2="13" className="animate-draw-line" style={{ animationDelay: '0.5s' }} />
        <line x1="9" y1="17" x2="13" y2="17" className="animate-draw-line" style={{ animationDelay: '0.7s' }} />
      </svg>
    ),
  },
  {
    id: 2,
    title: 'Take',
    subtitle: 'Test yourself',
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" className="animate-draw-circle" />
        <polyline points="9,12 11,14 15,10" className="animate-draw-check" style={{ animationDelay: '0.5s' }} />
      </svg>
    ),
  },
  {
    id: 3,
    title: 'Track',
    subtitle: 'See your progress',
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" className="opacity-30" />
        <rect x="3" y="15" width="6" height="6" className="animate-bar-1" style={{ animationDelay: '0.2s' }} />
        <rect x="9" y="11" width="6" height="10" className="animate-bar-2" style={{ animationDelay: '0.4s' }} />
        <rect x="15" y="7" width="6" height="14" className="animate-bar-3" style={{ animationDelay: '0.6s' }} />
      </svg>
    ),
  },
];

export function WorkflowDemo() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto py-16">
      {/* Section Title */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-200 mb-3">
          How it <span className="text-gradient">works</span>
        </h2>
        <p className="text-slate-400 text-sm font-mono">Three simple steps to master your knowledge</p>
      </div>

      {/* Steps Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`relative group transition-all duration-700 ${
              activeStep === index ? 'scale-105' : 'scale-100 opacity-60'
            }`}
          >
            {/* Step Card */}
            <div
              className={`relative p-8 rounded-2xl border-2 transition-all duration-700 ${
                activeStep === index
                  ? 'bg-slate-800/60 border-cyan-500/60 shadow-[0_0_40px_rgba(14,165,233,0.3)]'
                  : 'bg-slate-900/40 border-slate-700/30'
              }`}
            >
              {/* Step Number Badge */}
              <div
                className={`absolute -top-4 -right-4 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 ${
                  activeStep === index
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white scale-110'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {step.id}
              </div>

              {/* Icon Container */}
              <div
                className={`flex items-center justify-center mb-6 text-cyan-400 transition-all duration-700 ${
                  activeStep === index ? 'animate-float' : ''
                }`}
                key={`${step.id}-${activeStep}`}
              >
                {step.icon}
              </div>

              {/* Text */}
              <h3 className="text-xl font-bold text-slate-200 mb-2 text-center">{step.title}</h3>
              <p className="text-sm text-slate-400 font-mono text-center">{step.subtitle}</p>

              {/* Progress Bar */}
              {activeStep === index && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700/30 rounded-b-2xl overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-progress-bar" />
                </div>
              )}
            </div>

            {/* Connecting Arrow (Desktop) */}
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                <svg
                  className="w-8 h-8 text-cyan-500/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Dots (Mobile) */}
      <div className="flex justify-center gap-3 mt-8 md:hidden">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              activeStep === index ? 'bg-cyan-500 w-8' : 'bg-slate-600'
            }`}
            aria-label={`Go to step ${step.id}`}
          />
        ))}
      </div>

      <style>{`
        @keyframes draw-rect {
          0% { stroke-dasharray: 0, 200; }
          100% { stroke-dasharray: 200, 0; }
        }
        
        @keyframes draw-line {
          0% { stroke-dasharray: 0, 50; opacity: 0; }
          100% { stroke-dasharray: 50, 0; opacity: 1; }
        }
        
        @keyframes draw-circle {
          0% { stroke-dasharray: 0, 100; }
          100% { stroke-dasharray: 100, 0; }
        }
        
        @keyframes draw-check {
          0% { stroke-dasharray: 0, 50; opacity: 0; }
          100% { stroke-dasharray: 50, 0; opacity: 1; }
        }
        
        @keyframes bar-grow {
          0% { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
          100% { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes progress-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        .animate-draw-rect {
          stroke-dasharray: 0, 200;
          animation: draw-rect 1s ease-out forwards;
        }
        
        .animate-draw-line {
          stroke-dasharray: 0, 50;
          animation: draw-line 0.5s ease-out forwards;
        }
        
        .animate-draw-circle {
          stroke-dasharray: 0, 100;
          animation: draw-circle 0.8s ease-out forwards;
        }
        
        .animate-draw-check {
          stroke-dasharray: 0, 50;
          animation: draw-check 0.5s ease-out forwards;
        }
        
        .animate-bar-1,
        .animate-bar-2,
        .animate-bar-3 {
          fill: currentColor;
          transform: scaleY(0);
          animation: bar-grow 0.6s ease-out forwards;
        }
        
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
        
        .animate-progress-bar {
          animation: progress-bar 3s linear forwards;
        }
      `}</style>
    </div>
  );
}
