import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const mockData = [
  { month: "Jan", you: 120, them: 80 },
  { month: "Feb", you: 150, them: 130 },
  { month: "Mar", you: 180, them: 160 },
  { month: "Apr", you: 140, them: 190 },
  { month: "May", you: 200, them: 180 },
  { month: "Jun", you: 220, them: 250 },
  { month: "Jul", you: 280, them: 260 },
  { month: "Aug", you: 300, them: 320 },
  { month: "Sep", you: 250, them: 280 },
  { month: "Oct", you: 340, them: 310 },
  { month: "Nov", you: 380, them: 350 },
  { month: "Dec", you: 420, them: 400 },
];

export const HeartbeatGraph = () => {
  return (
    <div className="glass rounded-2xl p-6 animate-slide-up">
      <h3 className="font-display text-xl font-semibold mb-2">Your Heartbeat</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Message frequency over time
      </p>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockData}>
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
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area
              type="monotone"
              dataKey="you"
              stroke="hsl(12, 76%, 61%)"
              strokeWidth={2}
              fill="url(#youGradient)"
              name="You"
            />
            <Area
              type="monotone"
              dataKey="them"
              stroke="hsl(340, 65%, 65%)"
              strokeWidth={2}
              fill="url(#themGradient)"
              name="Them"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-coral" />
          <span className="text-sm text-muted-foreground">You</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose" />
          <span className="text-sm text-muted-foreground">Them</span>
        </div>
      </div>
    </div>
  );
};
