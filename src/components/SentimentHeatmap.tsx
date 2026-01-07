import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import type { SentimentDay } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SentimentHeatmapProps {
  sentimentDays: SentimentDay[];
}

const getSentimentColor = (tag: string) => {
  switch (tag) {
    case 'happy': return 'bg-green-500';
    case 'tension': return 'bg-rose';
    default: return 'bg-muted/50';
  }
};

export const SentimentHeatmap = ({ sentimentDays }: SentimentHeatmapProps) => {
  // Group by month for display
  const sentimentMap = new Map(sentimentDays.map(d => [d.day, d]));
  
  // Get the date range
  const sortedDays = [...sentimentDays].sort((a, b) => a.day.localeCompare(b.day));
  if (sortedDays.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 animate-slide-up-delay-2">
        <h3 className="font-display text-xl font-semibold mb-2">Sentiment Calendar</h3>
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  const startDate = parseISO(sortedDays[0].day);
  const endDate = parseISO(sortedDays[sortedDays.length - 1].day);
  
  // Get all months in range
  const months: { name: string; days: { date: string; tag: string }[] }[] = [];
  let current = startOfMonth(startDate);
  const finalMonth = startOfMonth(endDate);
  
  while (current <= finalMonth) {
    const monthEnd = endOfMonth(current);
    const days = eachDayOfInterval({ start: current, end: monthEnd > endDate ? endDate : monthEnd });
    
    const monthData = {
      name: format(current, 'MMM yyyy'),
      days: days.map(d => {
        const key = format(d, 'yyyy-MM-dd');
        const sentiment = sentimentMap.get(key);
        return { date: key, tag: sentiment?.tag || 'neutral' };
      }),
    };
    months.push(monthData);
    current = startOfMonth(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  // Calculate stats
  const happyDays = sentimentDays.filter(d => d.tag === 'happy').length;
  const tensionDays = sentimentDays.filter(d => d.tag === 'tension').length;
  const happyPercent = Math.round((happyDays / sentimentDays.length) * 100);
  
  // Find best and worst months
  const monthStats: Record<string, { happy: number; tension: number }> = {};
  for (const d of sentimentDays) {
    const month = d.day.slice(0, 7);
    if (!monthStats[month]) monthStats[month] = { happy: 0, tension: 0 };
    if (d.tag === 'happy') monthStats[month].happy++;
    if (d.tag === 'tension') monthStats[month].tension++;
  }
  
  const monthEntries = Object.entries(monthStats);
  const bestMonth = monthEntries.sort((a, b) => b[1].happy - a[1].happy)[0];
  const worstMonth = monthEntries.sort((a, b) => b[1].tension - a[1].tension)[0];

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up-delay-2 h-full flex flex-col">
      <h3 className="font-display text-xl font-semibold mb-2">Sentiment Calendar</h3>
      <p className="text-sm text-muted-foreground mb-6">
        The emotional weather of your relationship
      </p>

      {/* Calendar Grid - All months with scroll */}
      <ScrollArea className="flex-1 mb-6 max-h-[300px] pr-4">
        <div className="space-y-4">
          <TooltipProvider>
            {months.map(month => {
              const firstDayOffset = getDay(parseISO(month.days[0].date));
              return (
                <div key={month.name}>
                  <p className="text-xs text-muted-foreground mb-2 sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-1">{month.name}</p>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for offset */}
                    {Array.from({ length: firstDayOffset }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-4 h-4" />
                    ))}
                    {month.days.map(day => (
                      <Tooltip key={day.date}>
                        <TooltipTrigger>
                          <div
                            className={`w-4 h-4 rounded-sm ${getSentimentColor(day.tag)} transition-all hover:scale-125 hover:ring-2 hover:ring-offset-1 hover:ring-offset-background hover:ring-primary/20`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs font-semibold">{format(parseISO(day.date), 'MMMM do, yyyy')}</p>
                          <p className="text-xs capitalize text-muted-foreground">{day.tag}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              );
            })}
          </TooltipProvider>
        </div>
      </ScrollArea>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mb-6 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-muted-foreground">Happy/Laughter</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted/50" />
          <span className="text-muted-foreground">Neutral</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-rose" />
          <span className="text-muted-foreground">Tension</span>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-3">
        <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
          <p className="text-sm">
            <span className="text-green-500 font-bold">{happyPercent}%</span> of your conversation days were full of laughter
          </p>
        </div>
        
        {bestMonth && (
          <p className="text-sm text-muted-foreground text-center">
            Your relationship was happiest in <span className="text-green-500 font-medium">{format(parseISO(bestMonth[0] + '-01'), 'MMMM yyyy')}</span>
            {worstMonth && worstMonth[1].tension > 0 && (
              <>, but stress peaked in <span className="text-rose font-medium">{format(parseISO(worstMonth[0] + '-01'), 'MMMM yyyy')}</span></>
            )}
          </p>
        )}
      </div>
    </div>
  );
};
