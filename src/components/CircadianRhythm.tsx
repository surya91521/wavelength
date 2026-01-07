import { Moon, Sun } from "lucide-react";

interface CircadianRhythmProps {
  circadianData: { hour: number; count: number }[];
}

export const CircadianRhythm = ({ circadianData }: CircadianRhythmProps) => {
  const maxCount = Math.max(...circadianData.map(d => d.count), 1);
  
  // Find peak hours (top 20%)
  const threshold = maxCount * 0.6;
  const peakHours = circadianData.filter(d => d.count >= threshold).map(d => d.hour);
  
  // Determine best time range
  const total = circadianData.reduce((sum, d) => sum + d.count, 0);

  const ranges = [
    { label: 'Night Owls 🦉', start: 22, end: 4, text: '10 PM and 5 AM' },
    { label: 'Early Birds 🐦', start: 5, end: 11, text: '5 AM and 12 PM' },
    { label: 'Daytime Duo ☀️', start: 12, end: 17, text: '12 PM and 6 PM' },
    { label: 'Evening Chillers 🌅', start: 18, end: 21, text: '6 PM and 10 PM' },
  ];

  const getRangeCount = (start: number, end: number) => 
    circadianData.filter(d => 
      start <= end ? (d.hour >= start && d.hour <= end) : (d.hour >= start || d.hour <= end)
    ).reduce((sum, d) => sum + d.count, 0);

  const stats = ranges.map(r => ({ ...r, count: getRangeCount(r.start, r.end) }));
  const best = stats.reduce((p, c) => c.count > p.count ? c : p);
  
  const chronotype = best.label;
  const percent = total > 0 ? Math.round((best.count / total) * 100) : 0;

  const formatHour = (h: number) => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  };

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up-delay-2">
      <h3 className="font-display text-xl font-semibold mb-2">The Circadian Rhythm</h3>
      <p className="text-sm text-muted-foreground mb-6">
        When do your emotional conversations happen?
      </p>

      {/* 24-hour clock visualization */}
      <div className="relative w-64 h-64 mx-auto mb-6">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Background circle */}
          <circle cx="100" cy="100" r="80" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
          
          {/* Hour markers */}
          {circadianData.map((d, i) => {
            const angle = (i * 15 - 90) * (Math.PI / 180); // 15 degrees per hour
            const innerRadius = 40;
            const outerRadius = 40 + (d.count / maxCount) * 35;
            const x1 = 100 + innerRadius * Math.cos(angle);
            const y1 = 100 + innerRadius * Math.sin(angle);
            const x2 = 100 + outerRadius * Math.cos(angle);
            const y2 = 100 + outerRadius * Math.sin(angle);
            
            const isPeak = d.count >= threshold;
            
            return (
              <line
                key={d.hour}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isPeak ? 'hsl(var(--coral))' : 'hsl(var(--muted-foreground))'}
                strokeWidth={isPeak ? 4 : 2}
                strokeLinecap="round"
                opacity={0.3 + (d.count / maxCount) * 0.7}
              />
            );
          })}
          
          {/* Center decoration */}
          <circle cx="100" cy="100" r="30" fill="hsl(var(--card))" />
          
          {/* Hour labels */}
          <text x="100" y="25" textAnchor="middle" className="text-xs fill-muted-foreground">12</text>
          <text x="175" y="105" textAnchor="middle" className="text-xs fill-muted-foreground">6</text>
          <text x="100" y="185" textAnchor="middle" className="text-xs fill-muted-foreground">12</text>
          <text x="25" y="105" textAnchor="middle" className="text-xs fill-muted-foreground">18</text>
          
          {/* AM/PM indicators */}
          <text x="100" y="35" textAnchor="middle" className="text-[8px] fill-muted-foreground">AM</text>
          <text x="100" y="175" textAnchor="middle" className="text-[8px] fill-muted-foreground">PM</text>
        </svg>
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {chronotype.includes('Night') || chronotype.includes('Evening') ? (
            <Moon className="w-8 h-8 text-amber" />
          ) : (
            <Sun className="w-8 h-8 text-amber" />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-coral/10 to-amber/10 rounded-full border border-coral/20">
          <span className="font-display font-bold text-lg gradient-text">{chronotype}</span>
        </div>
        
        <p className="text-sm text-muted-foreground">
          <span className="text-coral font-medium">{percent}%</span> of your emotional messages happen between {best.text}
        </p>
        
        {peakHours.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Peak hours: {peakHours.slice(0, 3).map(formatHour).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
};
