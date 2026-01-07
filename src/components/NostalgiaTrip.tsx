import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import type { OnThisDayMessage } from '@/lib/types';

interface NostalgiaTripProps {
  onThisDay: OnThisDayMessage[];
  participants: string[];
}

const MessageBubble = ({ 
  message, 
  isOwnMessage, 
  sender 
}: { 
  message: { text: string; date: Date; sender: string }; 
  isOwnMessage: boolean;
  sender: string;
}) => {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 gap-2`}>
      <div className={`max-w-[80%] flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {!isOwnMessage && (
          <p className="text-xs text-muted-foreground mb-1 px-1 font-medium">{sender}</p>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 shadow-sm ${
            isOwnMessage
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm border border-border/30'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
          <p className={`text-xs mt-1.5 ${isOwnMessage ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
            {format(message.date, 'h:mm a')}
          </p>
        </div>
      </div>
    </div>
  );
};

export const NostalgiaTrip = ({ onThisDay, participants }: NostalgiaTripProps) => {
  return (
    <div className="py-20 animate-slide-up-delay-4">
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
          The <span className="gradient-text">Nostalgia</span> Trip
        </h2>
        <p className="text-muted-foreground">Relive the moments that started it all</p>
      </div>

      <div className="space-y-12">
        {/* On This Day Section */}
        {onThisDay.length > 0 && (
          <div>
            <h3 className="font-display text-2xl font-semibold mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              On This Day
            </h3>
            <div className="space-y-6">
              {onThisDay.map((item, idx) => {
                const isOwnMessage = item.message.sender === participants[0];
                return (
                  <div
                    key={idx}
                    className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">
                          {item.yearsAgo === 1
                            ? '1 year ago'
                            : `${item.yearsAgo} years ago`}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {format(item.date, 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-background/50 rounded-xl p-4 -mx-2">
                      <p className="text-sm text-muted-foreground mb-3 italic">
                        On this exact day {item.yearsAgo} {item.yearsAgo === 1 ? 'year' : 'years'} ago, you were talking about...
                      </p>
                      <MessageBubble
                        message={item.message}
                        isOwnMessage={isOwnMessage}
                        sender={item.message.sender}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {onThisDay.length === 0 && (
          <div className="text-center py-12 glass rounded-2xl">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Not enough history to show nostalgia moments yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Keep chatting to unlock these memories!</p>
          </div>
        )}
      </div>
    </div>
  );
};
