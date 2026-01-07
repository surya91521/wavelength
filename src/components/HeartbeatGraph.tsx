import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface HeartbeatGraphProps {
  data: { month: string; [key: string]: number | string }[];
  participants: string[];
}

export const HeartbeatGraph = ({ data, participants }: HeartbeatGraphProps) => {

  const getGradientColor = (index: number) => {
      const colors = [
          "hsl(12, 76%, 61%)",  // Coral
          "hsl(340, 65%, 65%)", // Rose
          "hsl(38, 92%, 50%)",  // Amber/Orange
          "hsl(217, 91%, 60%)", // Blue
          "hsl(262, 83%, 58%)", // Purple
          "hsl(150, 60%, 40%)"  // Green
      ];
      return colors[index % colors.length];
  }

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up">
      <h3 className="font-display text-xl font-semibold mb-2">Your Heartbeat</h3>
      <p className="text-sm text-muted-foreground mb-6">Message frequency over time</p>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              {participants.map((p, i) => (
                  <linearGradient key={`gradient-${p}`} id={`gradient-${p}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={getGradientColor(i)} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={getGradientColor(i)} stopOpacity={0} />
                  </linearGradient>
              ))}
            </defs>
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickFormatter={(v) => v.slice(0, 3)}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
              }}
            />
             {participants.map((p, i) => (
                <Area 
                    key={p}
                    type="monotone" 
                    dataKey={p} 
                    stroke={getGradientColor(i)} 
                    strokeWidth={2} 
                    fill={`url(#gradient-${p})`} 
                    name={p} 
                />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
        {participants.map((p, i) => (
             <div key={p} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getGradientColor(i) }} />
                <span className="text-sm text-muted-foreground">{p}</span>
            </div>
        ))}
      </div>
    </div>
  );
};
