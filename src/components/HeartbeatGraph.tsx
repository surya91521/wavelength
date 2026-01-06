import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface HeartbeatGraphProps {
  data: { month: string; [key: string]: number | string }[];
  participants: string[];
}

export const HeartbeatGraph = ({ data, participants }: HeartbeatGraphProps) => {
  const [you, them] = participants.length >= 2 ? participants : ['You', 'Them'];

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up">
      <h3 className="font-display text-xl font-semibold mb-2">Your Heartbeat</h3>
      <p className="text-sm text-muted-foreground mb-6">Message frequency over time</p>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="youGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(12, 76%, 61%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(12, 76%, 61%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="themGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(340, 65%, 65%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(340, 65%, 65%)" stopOpacity={0} />
              </linearGradient>
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
            <Area type="monotone" dataKey={you} stroke="hsl(12, 76%, 61%)" strokeWidth={2} fill="url(#youGradient)" name={you} />
            <Area type="monotone" dataKey={them} stroke="hsl(340, 65%, 65%)" strokeWidth={2} fill="url(#themGradient)" name={them} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-coral" />
          <span className="text-sm text-muted-foreground">{you}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose" />
          <span className="text-sm text-muted-foreground">{them}</span>
        </div>
      </div>
    </div>
  );
};
