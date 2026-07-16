import React, { useState } from 'react';

export type TimelineEvent = {
  time: string;
  event: string;
  details?: string;
};

export default function AlertTimeline({ timeline }: { timeline: TimelineEvent[] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [ackEvents, setAckEvents] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleAck = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    const newSet = new Set(ackEvents);
    newSet.add(i);
    setAckEvents(newSet);
  };

  const handleCopy = (e: React.MouseEvent, item: TimelineEvent, i: number) => {
    e.stopPropagation();
    const textToCopy = `Event: ${item.event}\nTime: ${item.time}\nDetails: ${item.details || 'N/A'}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedIndex(i);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-0 relative">
      {timeline.map((item, i) => {
        const isLatest = i === 0;
        const isExpanded = expandedIndex === i;
        
        return (
          <div key={i} className="w-full text-left focus:outline-none">
            <div className="relative flex gap-6 group cursor-pointer pb-1 last:pb-0" onClick={() => setExpandedIndex(isExpanded ? null : i)}>
              <div className="w-16 flex-shrink-0 text-[12px] text-text-secondary font-medium mt-[14px] text-right group-hover:text-text-primary transition-colors">
                {item.time}
              </div>
              
              <div className="relative z-10 flex flex-col items-center shrink-0 w-3">
                <div className={`relative z-10 w-2.5 h-2.5 mt-[16px] rounded-full border-[2px] ${isLatest ? 'border-[#A32D2D] bg-[#A32D2D] group-hover:ring-[#A32D2D]/20' : 'border-amber-500 bg-amber-500 group-hover:ring-amber-500/20'} ring-4 ring-bg-surface group-hover:scale-[1.3] transition-all duration-300 ease-out`}></div>
                
                {i !== timeline.length - 1 && (
                  <div className="absolute top-[28px] left-[5px] w-px bg-border-faint z-0 transition-colors group-hover:bg-border-default" style={{ height: 'calc(100% - 14px)' }}></div>
                )}
              </div>
              
              <div className={`flex flex-col w-full py-3 px-4 rounded-xl border transition-all duration-200 ${isExpanded ? 'bg-bg-subtle border-border-faint' : 'border-transparent group-hover:bg-bg-subtle group-hover:border-border-faint'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[13px] font-medium transition-colors ${isExpanded ? 'text-accent' : 'text-text-primary group-hover:text-accent'}`}>{item.event}</span>
                  <svg className={`w-4 h-4 transition-all duration-200 ${isExpanded ? 'text-text-muted transform rotate-90' : 'text-transparent group-hover:text-text-muted transform -translate-x-2 group-hover:translate-x-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
                {item.details && !isExpanded && (
                  <p className="text-[12px] text-text-secondary leading-relaxed mt-0.5">{item.details}</p>
                )}
                
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border-faint flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Additional Context</h3>
                      <div className="bg-bg-surface border border-border-default rounded-lg p-3">
                        <p className="text-[12px] text-text-primary leading-relaxed">
                          {item.details || `Recorded on ${item.time}. No further details available.`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button 
                        className={`px-3 py-1.5 border rounded-md text-[12px] font-medium transition-colors ${ackEvents.has(i) ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-bg-surface hover:bg-border-faint border-border-default text-text-primary'}`} 
                        onClick={(e) => handleAck(e, i)}
                        disabled={ackEvents.has(i)}
                      >
                        {ackEvents.has(i) ? 'Acknowledged ✓' : 'Acknowledge'}
                      </button>
                      <button 
                        className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${copiedIndex === i ? 'bg-green-500/10 text-green-600' : 'bg-transparent hover:bg-bg-surface text-text-secondary'}`} 
                        onClick={(e) => handleCopy(e, item, i)}
                      >
                        {copiedIndex === i ? 'Copied! ✓' : 'Copy Event Data'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
