import { WrappedCard } from "./WrappedCard";
import { MessageSquare, Calendar, Zap, Heart, Trophy, Quote, Sparkles } from "lucide-react";

interface WrappedShareablesProps {
  data: {
    participants: string[];
    totalMessages: number;
    messagesByMonth: { month: string; [key: string]: number | string }[];
        messagesByYear: { year: string; [key: string]: number | string }[];
    topWords: { word: string; count: number }[];
    sentimentDays: any[];
    laughterCounts: Record<string, number>;
    doubleTextRatios: Record<string, number>;
    initiatorCounts: Record<string, number>;
    dateRange: { start: Date; end: Date };
  };
}

export const WrappedShareables = ({ data }: WrappedShareablesProps) => {
  const { 
        participants, 
    totalMessages, 
    messagesByMonth, 
        messagesByYear,
    topWords, 
    sentimentDays, 
    laughterCounts,
    doubleTextRatios,
        initiatorCounts,
        dateRange,
  } = data;

  // --- Prep Data for Card 1: Vibe Check ---
  const mostActiveMonth = [...messagesByMonth].sort((a, b) => {
    const totalA = Object.values(a).filter(v => typeof v === 'number').reduce((s: number, c) => s + (c as number), 0);
    const totalB = Object.values(b).filter(v => typeof v === 'number').reduce((s: number, c) => s + (c as number), 0);
    return totalB - totalA;
  })[0];
  
  const mostActiveMonthTotal = mostActiveMonth 
      ? Object.values(mostActiveMonth).filter(v => typeof v === 'number').reduce((s: number, c) => s + (c as number), 0)
      : 0;

  const totalLaughs = Object.values(laughterCounts).reduce((a, b) => a + b, 0);

  // --- Calculations for Vibe Score & Verdict ---
  const totalDays = Math.max(sentimentDays.length, 1);
  const avgMessagesPerDay = totalMessages / totalDays;
  const happyDays = sentimentDays.filter(d => d.tag === 'happy').length;
  const happyRatio = happyDays / totalDays;
  const laughRatio = totalLaughs / Math.max(totalMessages, 1);
  
  const initiatorValues = Object.values(initiatorCounts);
  const maxInit = Math.max(...initiatorValues, 1); // Avoid 0
  const minInit = Math.min(...initiatorValues, 1);
  const imbalanceRatio = maxInit / minInit;
  const isBalanced = imbalanceRatio < 1.5;
  const isSomewhatBalanced = imbalanceRatio < 2.5;

  const calculateVibeScore = () => {
    let score = 5; // Base score

    // 1. Activity (Max +2)
    if (avgMessagesPerDay > 50) score += 2;
    else if (avgMessagesPerDay > 20) score += 1;

    // 2. Positivity (Max +2)
    if (happyRatio > 0.6) score += 2;
    else if (happyRatio > 0.4) score += 1;

    // 3. Laughter (Max +2)
    if (laughRatio > 0.1) score += 2;
    else if (laughRatio > 0.05) score += 1;

    // 4. Balance (Max +1)
    if (isBalanced) score += 1;
    
    // 5. Long-term deduction (if ghost town)
    if (avgMessagesPerDay < 5) score -= 1;

    // Clamp between 1-10
    return Math.min(Math.max(score, 1), 10);
  };
  
  const vibeScore = calculateVibeScore();

    // --- Prep Data for Card 3: Golden Era (Happiest Month) ---
    // Choose the month with the highest absolute number of 'happy' days (not ratio)
    const happyCountByMonth: Record<string, number> = {};
    for (const d of sentimentDays) {
        const month = d.day.substring(0, 7); // yyyy-MM
        if (!happyCountByMonth[month]) happyCountByMonth[month] = 0;
        if (d.tag === 'happy') happyCountByMonth[month]++;
    }

    const happiestMonthKey = Object.keys(happyCountByMonth)
        .sort((a, b) => happyCountByMonth[b] - happyCountByMonth[a])[0];
  
  // Format happy month likely as "August 2024"
  const happiestMonthDate = happiestMonthKey ? new Date(happiestMonthKey + "-02") : new Date(); // -02 to avoid timezone offset issues
  const happiestMonthName = happiestMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });


  // --- Prep Data for Card 4: The Verdict ---
    // Deterministic, flattened verdict selection
    const hashSeed = (str: string) => {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
        }
        return h >>> 0;
    };
    const seededRand = (seed: number) => {
        let x = seed >>> 0;
        return () => {
            x = (1664525 * x + 1013904223) >>> 0;
            return x / 4294967296;
        };
    };

    const getVerdict = () => {
      const avgDoubleText = Object.values(doubleTextRatios).reduce((a, b) => a + b, 0) / (participants.length || 1);
      const isChaotic = avgDoubleText > 12;
      const isModerateChaos = avgDoubleText > 6 && avgDoubleText <= 12;
      const isCalm = avgDoubleText < 4;
      
      const isImbalanced = !isSomewhatBalanced; // Use calculations from above
      const isSlightlyImbalanced = !isBalanced && isSomewhatBalanced;
      
      const isVeryFunny = laughRatio > 0.08;
      const isFunny = laughRatio > 0.04 && laughRatio <= 0.08;
      const isModeratelyFunny = laughRatio > 0.02 && laughRatio <= 0.04;
      const isSerious = laughRatio < 0.01;
      
      const isVeryHappy = happyRatio > 0.6;
      const isHappy = happyRatio > 0.4 && happyRatio <= 0.6;
      const isNeutral = happyRatio > 0.2 && happyRatio <= 0.4;
      const isMoody = happyRatio < 0.2;
      
      const isGroup = participants.length > 2;
      const isDuo = participants.length === 2;
      const isLargeGroup = participants.length > 5;
      
      const isVeryActive = avgMessagesPerDay > 80;
      const isActive = avgMessagesPerDay > 40 && avgMessagesPerDay <= 80;
      const isModerate = avgMessagesPerDay > 15 && avgMessagesPerDay <= 40;
      const isQuiet = avgMessagesPerDay < 15;
      
      // Calculate verdict score based on multiple factors. 
      // specificWeight: higher means more specific conditions (3+ descriptors).
      const verdicts = [
          // High energy + funny combinations
          { condition: isVeryFunny && isVeryActive && isHappy, weight: 3, title: "The Comedians", desc: "Your chat is basically a stand-up routine with Olympic-level texting stamina." },
          { condition: isVeryFunny && isActive && isBalanced, weight: 3, title: "The Jokers", desc: "Laughter is your love language, and you're both fluent." },
          { condition: isFunny && isVeryActive && isGroup, weight: 3, title: "The Comedy Club", desc: "A group chat that never fails to deliver the laughs." },
          { condition: isVeryFunny && isChaotic && isDuo, weight: 3, title: "Chaotic Comedians", desc: "Double texts and double laughs—pure chaos, pure joy." },
          
          // Chaos-based verdicts
          { condition: isChaotic && isImbalanced, weight: 2, title: "Chaotic Evil", desc: "The amount of double texting happening here is frankly concerning." },
          { condition: isChaotic && isBalanced, weight: 2, title: "Organized Chaos", desc: "You're both equally unhinged, and it's beautiful." },
          { condition: isModerateChaos && isVeryActive, weight: 2, title: "The Text Tornado", desc: "Messages fly faster than thoughts can form." },
          { condition: isChaotic && isSerious, weight: 2, title: "The Overthinkers", desc: "So many messages, so few laughs. Deep thinkers or anxious texters?" },
          { condition: isModerateChaos && isFunny, weight: 2, title: "Controlled Chaos", desc: "You've mastered the art of being slightly unhinged together." },
          
          // Imbalance-based verdicts
          { condition: isImbalanced && isActive, weight: 2, title: "The Chaser", desc: "One of you is running a marathon, the other is walking." },
          { condition: isImbalanced && isQuiet, weight: 2, title: "The Initiator", desc: "One person carries the conversation, the other appreciates it." },
          { condition: isSlightlyImbalanced && isHappy, weight: 2, title: "The Leader", desc: "One person sets the vibe, the other vibes along." },
          { condition: isImbalanced && isMoody, weight: 2, title: "The Pursuer", desc: "One person tries harder, hoping to break through the silence." },
          { condition: isImbalanced && isVeryActive, weight: 2, title: "The Marathon Runner", desc: "One person texts like they're being paid per message." },
          
          // Group-based verdicts
          { condition: isLargeGroup && isActive, weight: 2, title: "The Squad", desc: "Chaotic energy but precise coordination." },
          { condition: isGroup && isVeryFunny, weight: 2, title: "The Friend Group", desc: "Where inside jokes are born and memes never die." },
          { condition: isGroup && isQuiet, weight: 2, title: "The Silent Majority", desc: "A group chat that knows when to stay quiet." },
          { condition: isLargeGroup && isChaotic, weight: 2, title: "The Mob", desc: "Too many people, too many messages, too much chaos." },
          { condition: isGroup && isBalanced, weight: 2, title: "The Council", desc: "Everyone gets a say, and everyone listens." },
          
          // Happiness-based verdicts
          { condition: isVeryHappy && isBalanced && isDuo, weight: 3, title: "Soulmates?", desc: "Balanced, consistent, and kinda cute." },
          { condition: isVeryHappy && isActive, weight: 2, title: "The Optimists", desc: "Every day is a good day in your chat." },
          { condition: isHappy && isModerate && isBalanced, weight: 3, title: "The Steady Ones", desc: "Consistent happiness, consistent connection." },
          { condition: isVeryHappy && isFunny, weight: 2, title: "The Joy Makers", desc: "You don't just chat, you create happiness together." },
          { condition: isHappy && isQuiet, weight: 2, title: "The Peaceful Pair", desc: "Few words, many smiles." },
          
          // Activity-based verdicts
          { condition: isVeryActive && isBalanced && isDuo, weight: 3, title: "The Power Texters", desc: "You text like your lives depend on it." },
          { condition: isActive && isHappy && isDuo, weight: 2, title: "The Daily Check-Ins", desc: "Regular messages, regular smiles, regular connection." },
          { condition: isModerate && isBalanced, weight: 1, title: "The Steady Stream", desc: "Not too much, not too little—just right." },
          { condition: isQuiet && isHappy, weight: 2, title: "The Minimalists", desc: "Quality over quantity, and it shows." },
          { condition: isVeryActive && isGroup, weight: 2, title: "The Active Squad", desc: "This group chat never sleeps." },
          
          // Serious/Moody combinations
          { condition: isSerious && isQuiet && isDuo, weight: 3, title: "The Philosophers", desc: "Deep thoughts, few words, many meanings." },
          { condition: isSerious && isActive, weight: 2, title: "The Thinkers", desc: "Every message is carefully crafted, every word matters." },
          { condition: isMoody && isImbalanced, weight: 2, title: "The Roller Coaster", desc: "Ups and downs, but you always come back." },
          { condition: isMoody && isBalanced, weight: 2, title: "The Realists", desc: "Life isn't always happy, but you're always there." },
          { condition: isSerious && isBalanced, weight: 2, title: "The Mature Ones", desc: "You've moved past small talk into real connection." },
          
          // Special combinations
          { condition: isVeryFunny && isVeryHappy && isVeryActive, weight: 4, title: "The Perfect Storm", desc: "Maximum laughs, maximum happiness, maximum messages." },
          { condition: isCalm && isBalanced && isHappy, weight: 3, title: "The Zen Masters", desc: "Peaceful, balanced, and perfectly in sync." },
          { condition: isModeratelyFunny && isNeutral && isModerate, weight: 2, title: "The Average Joes", desc: "Not too much, not too little—just perfectly normal." },
          { condition: isVeryActive && isMoody, weight: 3, title: "The Emotional Texters", desc: "Every feeling gets a message, every message gets a feeling." },
          { condition: isQuiet && isSerious && isDuo, weight: 3, title: "The Silent Understanding", desc: "You don't need words to know what the other is thinking." },
          
          // Edge cases
          { condition: isVeryActive && isChaotic && isImbalanced && isMoody, weight: 4, title: "The Drama Queens", desc: "High energy, high emotion, high chaos." },
          { condition: isQuiet && isCalm && isBalanced, weight: 3, title: "The Minimalists", desc: "Less is more, and you've mastered it." },
          { condition: isFunny && isNeutral && isModerate, weight: 2, title: "The Lighthearted", desc: "You keep things fun without going overboard." },
          { condition: isVeryHappy && isCalm && isDuo, weight: 3, title: "The Content Couple", desc: "Happy, peaceful, and perfectly content." },
          { condition: isActive && isSlightlyImbalanced && isHappy, weight: 3, title: "The Energetic Pair", desc: "One leads, one follows, both happy." },
          
          // More specific combinations
          { condition: isVeryFunny && isQuiet, weight: 3, title: "The Witty Minimalists", desc: "Few words, big laughs." },
          { condition: isFunny && isMoody, weight: 2, title: "The Comedians in Crisis", desc: "You laugh through the hard times together." },
          { condition: isVeryActive && isVeryHappy && isGroup, weight: 3, title: "The Happy Mob", desc: "Too many messages, too much happiness." },
          { condition: isModerate && isNeutral && isBalanced, weight: 2, title: "The Stable Ones", desc: "Steady as she goes, day after day." },
          { condition: isActive && isFunny && isSlightlyImbalanced, weight: 3, title: "The Fun Chasers", desc: "One person brings the energy, both bring the laughs." },
          
          // Additional unique combinations
          { condition: isVeryFunny && isCalm && isDuo, weight: 3, title: "The Gentle Jokers", desc: "Soft-spoken but always ready with a joke." },
          { condition: isSerious && isVeryActive && isDuo, weight: 3, title: "The Deep Conversationalists", desc: "Every message is a chapter in your story." },
          { condition: isHappy && isChaotic && isGroup, weight: 3, title: "The Joyful Chaos", desc: "Organized mess, happy hearts." },
          { condition: isModeratelyFunny && isActive && isBalanced, weight: 3, title: "The Balanced Bunch", desc: "Fun, active, and perfectly in sync." },
          { condition: isQuiet && isVeryHappy, weight: 2, title: "The Silent Smilers", desc: "You don't need to say much to be happy." },
          
          // Final catch-all verdicts (low weight)
          { condition: isDuo && isBalanced && isModerate, weight: 1, title: "The Perfect Pair", desc: "You've found your rhythm, and it's beautiful." },
          { condition: isGroup && isModerate && isNeutral, weight: 1, title: "The Steady Group", desc: "Consistent communication, consistent connection." },
          { condition: isActive && isHappy && isBalanced, weight: 1, title: "The Happy Communicators", desc: "You talk, you laugh, you connect." },
          { condition: isModerate && isFunny && isDuo, weight: 1, title: "The Fun Duo", desc: "Regular laughs, regular connection." },
          { condition: true, weight: 0, title: "The Unique Ones", desc: "Your chat is one of a kind, just like your connection." }
      ];
      
            // Build flattened score distribution: all verdicts have some chance.
            // Condition true boosts score slightly; cap skew to avoid dominance.
            const scores = verdicts.map(v => 1 + (v.condition ? v.weight * 0.4 : 0));
            const sum = scores.reduce((a, b) => a + b, 0);

            // Deterministic seed from chat signature
            const seedStr = `${[...participants].sort().join('|')}:${totalMessages}:${dateRange.start.toISOString().slice(0,10)}:${dateRange.end.toISOString().slice(0,10)}`;
            const rng = seededRand(hashSeed(seedStr));
            const r = rng();

            // Sample from cumulative distribution
            let acc = 0;
            for (let i = 0; i < scores.length; i++) {
                acc += scores[i] / sum;
                if (r <= acc) {
                    return verdicts[i];
                }
            }
            return verdicts[verdicts.length - 1];
  }
  const verdict = getVerdict();

  return (
    <div className="py-20 animate-slide-up-delay-3">
        <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Your <span className="gradient-text">Wrapped</span> Stats
            </h2>
            <p className="text-muted-foreground">Ready to share on your story?</p>
        </div>

        <div className="flex overflow-x-auto pb-12 gap-8 px-4 w-full snap-x snap-mandatory">
            
            {/* Card 1: Vibe Check */}
            <div className="shrink-0 snap-center">
            <WrappedCard 
                title="The Vibe Check" 
                bgClass="bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                className="text-white border-transparent"
            >
               <div className="space-y-6">
                   <div className="text-center">
                       <p className="opacity-80 text-sm font-medium uppercase tracking-widest mb-1">Total Messages</p>
                       <p className="text-5xl font-black font-display">{totalMessages.toLocaleString()}</p>
                   </div>
                   
                   <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                       <div className="flex items-center gap-3 mb-2 opacity-90">
                           <Calendar className="w-5 h-5" />
                           <span className="font-bold">Busiest Month</span>
                       </div>
                       <div className="flex justify-between items-end">
                            <span className="text-xl font-bold">{mostActiveMonth ? mostActiveMonth.month : 'N/A'}</span>
                            <span className="opacity-70 text-sm">{mostActiveMonthTotal.toLocaleString()} msgs</span>
                       </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm text-center">
                           <p className="text-2xl font-bold mb-1">😂</p>
                           <p className="text-xs opacity-70 uppercase font-bold">Laughter</p>
                           <p className="font-bold">{totalLaughs}</p>
                       </div>
                       <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm text-center">
                           <p className="text-2xl font-bold mb-1">⚡️</p>
                           <p className="text-xs opacity-70 uppercase font-bold">Vibe Score</p>
                           <p className="font-bold">{vibeScore}/10</p>
                       </div>
                   </div>
               </div>
            </WrappedCard>
            </div>

                        {/* Card: Yearly Activity */}
                        <div className="shrink-0 snap-center">
                            <WrappedCard 
                                title="Yearly Activity" 
                                bgClass="bg-gradient-to-br from-teal-500 to-emerald-600 text-white"
                                className="text-white border-transparent"
                            >
                                <div className="space-y-4 flex flex-col h-full">
                                    <p className="opacity-80 text-sm font-medium uppercase tracking-widest shrink-0">Messages per year</p>
                                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-2">
                                        {messagesByYear.map((row) => {
                                            const year = row.year as string;
                                            const totals = participants.map(p => Number(row[p] || 0));
                                            const sum = totals.reduce((a, b) => a + b, 0);
                                            
                                            // Find max count for bar chart scaling
                                            const maxCount = Math.max(...totals, 1);

                                            return (
                                                <div key={year} className="bg-white/10 rounded-xl p-3 backdrop-blur-md border border-white/5">
                                                    <div className="flex justify-between items-center mb-2 border-b border-white/20 pb-2">
                                                        <span className="font-display font-bold text-xl">{year}</span>
                                                        <span className="text-xs opacity-90 bg-white/20 px-2 py-0.5 rounded-full font-mono">
                                                            {sum.toLocaleString()} total
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {participants.map((p, idx) => {
                                                            const count = Number(row[p] || 0);
                                                            const percentage = Math.round((count / sum) * 100) || 0;
                                                            return (
                                                                <div key={p} className="relative">
                                                                    <div className="flex justify-between text-xs mb-1 z-10 relative px-0.5">
                                                                        <span className="font-semibold opacity-90">{p}</span>
                                                                        <span className="font-mono opacity-80">{count.toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className="h-full bg-white/90 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
                                                                            style={{ width: `${percentage}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </WrappedCard>
                        </div>

            {/* Card 2: Top Words */}
            <div className="shrink-0 snap-center">
            <WrappedCard 
                title="Our Dictionary" 
                subtitle="The words you can't stop using"
                bgClass="bg-[#1DB954] text-black"
                className="text-black border-transparent"
                footerText="Are we predictable?"
            >
                 <div className="flex flex-wrap justify-center content-center gap-x-3 gap-y-1 h-full py-4">
                    {topWords.slice(0, 15).map((w, i) => {
                        // random sizing for cloud effect
                        const sizeClasses = [
                            "text-3xl font-black",
                            "text-2xl font-bold",
                            "text-xl font-bold opacity-80",
                            "text-lg font-semibold opacity-70",
                            "text-base opacity-60"
                        ];
                        const sizeClass = i < 3 ? sizeClasses[0] : i < 6 ? sizeClasses[1] : i < 10 ? sizeClasses[2] : sizeClasses[3];
                        
                        return (
                            <span key={w.word} className={`${sizeClass} leading-tight`}>
                                {w.word}
                            </span>
                        )
                    })}
                 </div>
            </WrappedCard>
            </div>

            {/* Card 3: The Golden Era */}
            <div className="shrink-0 snap-center">
            <WrappedCard 
                title="The Golden Era" 
                bgClass="bg-gradient-to-br from-[#FFD700] to-[#FF8C00] text-black"
                className="text-black border-transparent"
            >
                <div className="flex-1 flex flex-col items-center justify-center text-center relative">
                    {/* Large decorative background element */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                        <div className="text-[200px] leading-none text-white mix-blend-overlay">✨</div>
                    </div>
                    
                    {/* Main content */}
                    <div className="relative z-10 flex flex-col items-center">
                        {/* Large trophy icon with glow effect */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 blur-2xl bg-white/40 rounded-full"></div>
                            <Trophy className="w-20 h-20 relative z-10 text-black drop-shadow-lg" strokeWidth={1.5} />
                        </div>
                        
                        {/* Large emoji decoration */}
                        <div className="text-6xl mb-4 drop-shadow-md">🏆</div>
                        
                        <p className="text-lg font-bold opacity-80 mb-2 uppercase tracking-wide">We peaked in</p>
                        <h3 className="text-5xl font-black font-display mb-6 leading-tight drop-shadow-sm uppercase">
                        {happiestMonthName}
                    </h3>
                        
                        {/* Decorative sparkles */}
                        <div className="flex gap-4 mb-6 text-3xl opacity-80">
                            <span className="animate-pulse">✨</span>
                            <span className="animate-pulse delay-75">⭐</span>
                            <span className="animate-pulse delay-150">✨</span>
                        </div>
                        
                        <div className="bg-black/10 rounded-xl p-4 max-w-[240px] backdrop-blur-md border border-black/5 shadow-inner">
                            <p className="font-bold text-sm mb-1 uppercase tracking-wider opacity-90">Happiest Month</p>
                            <p className="text-xs font-medium opacity-75 mt-1 leading-relaxed">Based on positive keywords & laughter frequency.</p>
                        </div>
                    </div>
                </div>
            </WrappedCard>
            </div>

            {/* Card 4: The Verdict */}
            <div className="shrink-0 snap-center">
            <WrappedCard 
                title="The Verdict" 
                bgClass="bg-[#000000] text-white"
                className="text-white border-white/20"
            >
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-black" />
                    </div>
                    
                    <div>
                        <p className="font-display font-black text-3xl mb-3">{verdict.title}</p>
                        <div className="relative">
                            <Quote className="w-8 h-8 absolute -top-4 -left-4 opacity-20 transform -scale-x-100" />
                            <p className="text-lg font-medium opacity-90 italic px-4">
                                "{verdict.desc}"
                            </p>
                            <Quote className="w-8 h-8 absolute -bottom-4 -right-4 opacity-20" />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-center">
                        {participants.slice(0, 3).map(p => (
                            <div key={p} className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold truncate max-w-[80px]">
                                {p}
                            </div>
                        ))}
                        {participants.length > 3 && (
                             <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                                +{participants.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            </WrappedCard>
            </div>
        </div>
    </div>
  );
};
