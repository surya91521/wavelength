import { WrappedCard } from "./WrappedCard";
import { MessageSquare, Calendar, Zap, Heart, Trophy, Quote, Sparkles, Copy, Share2 } from "lucide-react";
import { copyToClipboard, shareText, APP_URL } from "@/lib/shareUtils";

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
      
      // Verdicts — punchy, meme-worthy, screenshot-bait
      const verdicts = [
          // === LEGENDARY TIER (4+ conditions) ===
          { condition: isVeryFunny && isVeryHappy && isVeryActive, weight: 5, title: "Certified Unhinged Besties", desc: isGroup ? "This group texts like you're being charged per minute of silence. Therapists would study this chat." : "You two text like you're being charged per minute of silence. Therapists would study this chat." },
          { condition: isVeryActive && isChaotic && isImbalanced && isMoody, weight: 5, title: "The Emotional Rollercoaster", desc: "One of you is screaming into the void and the other is screaming back. It's giving toxic but make it art." },
          { condition: isVeryFunny && isVeryActive && isHappy, weight: 4, title: "Serotonin Dealers", desc: "This chat is a controlled substance. Someone's getting a dopamine hit every 30 seconds." },
          { condition: isVeryHappy && isBalanced && isDuo, weight: 4, title: "Disgustingly Wholesome", desc: "This is the chat people screenshot and post with 'I want what they have.' Nauseating. Beautiful." },
          { condition: isVeryActive && isBalanced && isDuo, weight: 4, title: "Telepathically Connected", desc: "You reply so fast it's like you share a brain cell. And honestly? That one cell is doing great work." },
          { condition: isVeryFunny && isCalm && isDuo, weight: 4, title: "The Sleeper Agents of Comedy", desc: "Quiet energy but your humor hits like a freight train with no warning." },

          // === HIGH ENERGY + FUNNY ===
          { condition: isVeryFunny && isActive && isBalanced, weight: 3, title: "The Comedy Marriage", desc: "You finish each other's jokes. The world doesn't deserve this chat." },
          { condition: isFunny && isVeryActive && isGroup, weight: 3, title: "The Group Chat That Peaked", desc: "Every other group chat you're in is just a waiting room for this one." },
          { condition: isVeryFunny && isChaotic && isDuo, weight: 3, title: "Partners in Chaos", desc: "You don't just double text — you speedrun conversations like it's an Olympic sport." },
          { condition: isVeryFunny && isQuiet, weight: 3, title: "Silent But Deadly", desc: "Few messages, but every single one lands. You're the snipers of humor." },

          // === CHAOS TIER ===
          { condition: isChaotic && isImbalanced, weight: 3, title: "Main Character vs. Side Character", desc: "One of you is writing a novel in real time. The other sends 'lol' and thinks that's enough." },
          { condition: isChaotic && isBalanced, weight: 3, title: "Mutually Unhinged", desc: "You're both equally chaotic and somehow that's the glue. Two wrongs making a right." },
          { condition: isModerateChaos && isVeryActive, weight: 3, title: "The Notification Nightmare", desc: "Anyone in a meeting with either of you has suffered. Your phone buzzes could power a small city." },
          { condition: isChaotic && isSerious, weight: 3, title: "Anxious Attachment: The Chat", desc: isGroup ? "All those messages and barely a 'haha' in sight. Is this group okay? Genuinely asking." : "All those messages and barely a 'haha' in sight. Are you two okay? Genuinely asking." },
          { condition: isModerateChaos && isFunny, weight: 2, title: "Controlled Demolition", desc: "Chaotic enough to be fun, structured enough to not lose friends." },

          // === IMBALANCE TIER ===
          { condition: isImbalanced && isActive, weight: 3, title: "The Situationship Energy", desc: "One of you is writing think-pieces and the other is responding with voice notes of silence." },
          { condition: isImbalanced && isQuiet, weight: 2, title: "The Orbiter and The Orbited", desc: "One person sends the texts. The other person IS the text." },
          { condition: isSlightlyImbalanced && isHappy, weight: 2, title: "The Golden Retriever & The Cat", desc: "One of you runs up excited every time. The other pretends to be unbothered but always shows up." },
          { condition: isImbalanced && isMoody, weight: 3, title: "Breadcrumbing Championship", desc: "One person gives paragraphs, the other gives crumbs. It's giving unrequited energy." },
          { condition: isImbalanced && isVeryActive, weight: 3, title: "The Filibuster", desc: "One of you treats this chat like a TED talk. The audience is polite but checked out." },

          // === GROUP CHAT TIER ===
          { condition: isLargeGroup && isActive, weight: 3, title: "The Avengers Assemble", desc: "This group chat has more coordination than most companies. Someone should hire all of you." },
          { condition: isGroup && isVeryFunny, weight: 3, title: "The War Room (for Memes)", desc: "Important decisions get ignored. But that meme from 3 weeks ago? Still getting referenced." },
          { condition: isGroup && isQuiet, weight: 2, title: "The Dead Group Chat", desc: "Someone should check the pulse. Last message was probably 'who's coming?' and nobody replied." },
          { condition: isLargeGroup && isChaotic, weight: 3, title: "The Group Chat Nobody Mutes (Somehow)", desc: "Pure chaos but leaving would feel like a breakup. You're all trapped and loving it." },
          { condition: isGroup && isBalanced, weight: 2, title: "Democracy Actually Working", desc: "Everyone talks. Everyone listens. This might be the only functioning democracy left." },
          { condition: isVeryActive && isVeryHappy && isGroup, weight: 4, title: "The Main Character Group", desc: "Other group chats wish they had this energy. Your notifications alone could fill a novel." },
          { condition: isHappy && isChaotic && isGroup, weight: 3, title: "Beautiful Disaster", desc: "Organized? No. Fun? Absolutely. Someone's always typing and nobody's ever on topic." },

          // === WHOLESOME TIER ===
          { condition: isVeryHappy && isActive, weight: 2, title: "The Comfort Chat", desc: "This is the chat you open when the world is falling apart. Digital chicken soup." },
          { condition: isHappy && isModerate && isBalanced, weight: 3, title: "Emotionally Mature and It Shows", desc: "Balanced effort, genuine happiness. You've unlocked the secret to not making texting stressful." },
          { condition: isVeryHappy && isFunny, weight: 3, title: "The Serotonin Factory", desc: "Every notification from this chat makes your brain go brrr in the best way possible." },
          { condition: isHappy && isQuiet, weight: 2, title: "The Cozy Corner", desc: "Like a warm blanket in chat form. Not many words, but every one counts." },
          { condition: isVeryHappy && isCalm && isDuo, weight: 3, title: "Rom-Com in Real Life", desc: "This chat reads like a movie script where everything works out. Disgusting. Don't stop." },
          { condition: isQuiet && isVeryHappy, weight: 2, title: "The Still Water Runs Deep", desc: "You don't flood the chat, but when you do talk, it matters." },

          // === CHILL / MODERATE TIER ===
          { condition: isActive && isHappy && isDuo, weight: 2, title: "The 'Good Morning' Regulars", desc: "You text like clockwork. Reliable, steady, and lowkey couple goals." },
          { condition: isModerate && isBalanced, weight: 1, title: "The Goldilocks Zone", desc: "Not too hot, not too cold. You've figured out texting without the anxiety." },
          { condition: isQuiet && isHappy, weight: 2, title: "Quality Over Quantity", desc: "You text like old souls in a world of double-tappers. Respect." },
          { condition: isVeryActive && isGroup, weight: 2, title: "The Never-Ending Thread", desc: "Scrolling up in this chat is a workout. Somebody should sell tickets." },

          // === SERIOUS / DEEP TIER ===
          { condition: isSerious && isQuiet && isDuo, weight: 3, title: "The 3 AM Philosophers", desc: "You don't do small talk. Every message is a thesis statement with emotional footnotes." },
          { condition: isSerious && isActive, weight: 2, title: "The Debate Club", desc: "Less 'haha' more 'hmm actually.' Every conversation is a seminar and you're both the professor." },
          { condition: isMoody && isImbalanced, weight: 2, title: "It's Complicated", desc: "The vibes shift faster than the weather. Someone's always slightly more invested." },
          { condition: isMoody && isBalanced, weight: 2, title: "Trauma Bonded (Affectionate)", desc: "You ride the waves together. Not always happy, but always honest." },
          { condition: isSerious && isBalanced, weight: 2, title: "The Grown-Ups", desc: "While everyone else is sending memes, you're having actual conversations. Revolutionary." },
          { condition: isSerious && isVeryActive && isDuo, weight: 3, title: "The Podcast That Texts", desc: "This isn't a chat, it's an ongoing documentary. Every message is a new episode." },

          // === FUNNY COMBOS ===
          { condition: isFunny && isMoody, weight: 3, title: "Crying Laughing (Literally)", desc: "You laugh through the pain and honestly? Iconic. Therapists hate this one trick." },
          { condition: isModeratelyFunny && isActive && isBalanced, weight: 2, title: "The Functional Friend Group", desc: "Funny enough to not bore everyone, chill enough to not exhaust everyone. Chef's kiss." },
          { condition: isActive && isFunny && isSlightlyImbalanced, weight: 3, title: "The Hype Person & The Talent", desc: "One brings the content, the other brings the 'LMAOOO.' Both are essential." },
          { condition: isFunny && isNeutral && isModerate, weight: 2, title: "The Chill Comedians", desc: "You're funny without trying too hard. The effortless cool of the chat world." },

          // === SPECIAL COMBOS ===
          { condition: isCalm && isBalanced && isHappy, weight: 3, title: "The Zen Garden", desc: "This chat has better energy than most meditation apps. Peaceful, balanced, healing." },
          { condition: isModeratelyFunny && isNeutral && isModerate, weight: 2, title: "Perfectly Mid (Compliment)", desc: "Not dramatic, not boring. You've achieved the impossible: a normal, healthy chat." },
          { condition: isVeryActive && isMoody, weight: 3, title: "The Emotional Speedrun", desc: "Happy to sad to angry to 'lol nvm' — all in 10 minutes. A masterclass in range." },
          { condition: isQuiet && isSerious && isDuo, weight: 3, title: "The Unspoken Understanding", desc: "You communicate in vibes, not volume. Half your conversations happen between the lines." },
          { condition: isQuiet && isCalm && isBalanced, weight: 3, title: "The Introverts' Paradise", desc: "Silence isn't awkward here. It's just another way of being together." },
          { condition: isActive && isSlightlyImbalanced && isHappy, weight: 3, title: "The Fan & The Rockstar", desc: "One person leads the energy, both ride the wave. It works and you know it." },

          // === CATCH-ALL TIERS ===
          { condition: isDuo && isBalanced && isModerate, weight: 1, title: "Relationship Goals (Quietly)", desc: "No drama, no chaos, just two people who figured it out. The most underrated flex." },
          { condition: isGroup && isModerate && isNeutral, weight: 1, title: "The Reliable Group Chat", desc: "Not the most exciting, but the one that always comes through when it matters." },
          { condition: isActive && isHappy && isBalanced, weight: 1, title: "The Green Flag Chat", desc: "If this chat were a dating profile, everyone would swipe right." },
          { condition: isModerate && isFunny && isDuo, weight: 1, title: "The Inside Joke Factory", desc: "Half your humor makes zero sense to outsiders. And that's what makes it perfect." },
          { condition: true, weight: 0, title: "One of a Kind", desc: "Your chat doesn't fit any pattern we've seen. You've broken the algorithm. Congratulations, you're special." }
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

        {/* Verdict Share Actions */}
        <div className="flex flex-col items-center gap-4 mt-4">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => copyToClipboard(`Our verdict: ${verdict.title} — "${verdict.desc}" \n\nTry yours: ${APP_URL}`)}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-foreground/5 hover:bg-foreground/10 rounded-full transition-colors"
                >
                    <Copy className="w-4 h-4" />
                    Copy Verdict
                </button>
                <button
                    onClick={() => shareText(`Our verdict: ${verdict.title} — "${verdict.desc}" \n\nAnalyze yours: ${APP_URL}`)}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
                >
                    <Share2 className="w-4 h-4" />
                    Share Verdict
                </button>
            </div>
        </div>

        {/* Challenge a Friend */}
        <div className="flex flex-col items-center gap-3 mt-12 pt-8 border-t border-border/30">
            <p className="text-lg font-display font-bold text-center">Think your friend's chat is better?</p>
            <button
                onClick={() => shareText(`I just got "${verdict.title}" on Wavelength. Think yours is better? Analyze your WhatsApp chat: ${APP_URL}`)}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:opacity-90 transition-all hover:scale-105 active:scale-95"
            >
                Challenge a Friend
            </button>
        </div>
    </div>
  );
};
