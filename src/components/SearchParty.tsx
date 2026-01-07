import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Message } from "@/lib/types";
import * as analytics from "@/lib/analytics";

interface SearchPartyProps {
  messages: Message[];
  participants: string[];
}

export const SearchParty = ({ messages, participants }: SearchPartyProps) => {
  const [searchWord, setSearchWord] = useState("");
  const [searchResults, setSearchResults] = useState<Record<string, number> | null>(null);

  const handleSearch = () => {
    if (searchWord.trim()) {
      const results = analytics.searchWord(messages, searchWord.trim());
      setSearchResults(results);
    }
  };

  const chartData = searchResults
    ? participants.map(p => ({
        name: p,
        count: searchResults[p] || 0,
      }))
    : [];

  const colors = ["hsl(var(--primary))", "hsl(var(--coral))"];

  return (
    <Card className="glass h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          <CardTitle>The "Who Said It?" Widget</CardTitle>
        </div>
        <CardDescription>Settle your bets - search for any word</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type a word (e.g., 'Pizza', 'Marriage')"
              value={searchWord}
              onChange={(e) => {
                setSearchWord(e.target.value);
                setSearchResults(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
          {searchResults && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                {participants.map(p => (
                  <p key={p} className="text-sm mb-1">
                    <span className="font-semibold">{p}</span> said "{searchWord}"{" "}
                    <span className="font-bold text-primary">{searchResults[p] || 0} time{searchResults[p] !== 1 ? 's' : ''}</span>.
                  </p>
                ))}
              </div>
              {chartData.some(d => d.count > 0) && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
