interface GhostHoursProps {
  data: { day: string; hours: { hour: number; value: number }[] }[];
}

const getIntensityColor = (value: number, max: number) => {
  const pct = max > 0 ? value / max : 0;
  if (pct < 0.1) return 'bg-muted/30';
  if (pct < 0.3) return 'bg-coral/20';
  if (pct < 0.5) return 'bg-coral/40';
  if (pct < 0.7) return 'bg-coral/60';
  return 'bg-coral';
};

export const GhostHours = ({ data }: GhostHoursProps) => {
  const maxValue = Math.max(...data.flatMap(d => d.hours.map(h => h.value)), 1);
  
  // Find peak hour
  let peakHour = 0;
  let peakDay = '';
  let peakValue = 0;
  for (const row of data) {
    for (const cell of row.hours) {
      if (cell.value > peakValue) {
        peakValue = cell.value;
        peakHour = cell.hour;
        peakDay = row.day;
      }
    }
  }

  const formatHour = (h: number) => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  };

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up-delay-2">
      <h3 className="font-display text-xl font-semibold mb-2">The Ghost Hours</h3>
      <p className="text-sm text-muted-foreground mb-6">When do you really talk?</p>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex mb-2 ml-12">
            {[0, 6, 12, 18, 23].map(hour => (
              <div key={hour} className="text-xs text-muted-foreground" style={{ width: hour === 23 ? 'auto' : `${(6/24) * 100}%`, textAlign: hour === 0 ? 'left' : 'center' }}>
                {hour === 0 ? '12am' : hour === 6 ? '6am' : hour === 12 ? '12pm' : hour === 18 ? '6pm' : '11pm'}
              </div>
            ))}
          </div>

          {data.map((row) => (
            <div key={row.day} className="flex items-center gap-1 mb-1">
              <span className="w-10 text-xs text-muted-foreground">{row.day}</span>
              <div className="flex flex-1 gap-0.5">
                {row.hours.map((cell) => (
                  <div
                    key={cell.hour}
                    className={`flex-1 h-6 rounded-sm transition-all duration-300 hover:scale-110 hover:z-10 ${getIntensityColor(cell.value, maxValue)}`}
                    title={`${row.day} ${formatHour(cell.hour)} - ${cell.value} messages`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {['bg-muted/30', 'bg-coral/20', 'bg-coral/40', 'bg-coral/60', 'bg-coral'].map((color, i) => (
              <div key={i} className={`w-4 h-4 rounded-sm ${color}`} />
            ))}
          </div>
          <span className="text-muted-foreground">Less → More</span>
        </div>
        <div className="text-muted-foreground">
          Peak: <span className="text-coral font-medium">{peakDay} {formatHour(peakHour)}</span>
        </div>
      </div>
    </div>
  );
};
