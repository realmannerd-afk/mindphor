import React, { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function ScoreChartReact({ projectId, date }: { projectId: string; date?: string }) {
  const [range, setRange] = useState('7');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [validCount, setValidCount] = useState(0);

  useEffect(() => {
    // Reset loading state when range or date changes
    setLoading(true);
  }, [range, date]);

  useEffect(() => {
    async function loadData() {
      if (!projectId) return;
      try {
        const url = `/api/dashboard?app_id=${projectId}&range=${range}${date ? `&date=${date}` : ''}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.rating_by_day) {
          const chartData = json.rating_by_day.map((d: any) => {
            const parts = d.date.split('-');
            let label = d.date;
            if (parts.length === 3) {
              const dateObj = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
              label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
            }
            return {
              date: label,
              rating: d.avg_rating || null
            };
          });
          setData(chartData);
          setValidCount(chartData.filter((d: any) => d.rating !== null).length);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [projectId, range, date]);

  return (
    <div className="bg-bg-surface border border-border-default rounded-[16px] overflow-hidden mb-10">
      <div className="w-full p-[24px]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Rating & Sentiment Trend</div>
            {!loading && validCount < 3 && (
              <span className="text-[10px] text-text-secondary tracking-wide">(Requires 3+ days of data)</span>
            )}
          </div>
          <select 
            value={range} 
            onChange={(e) => setRange(e.target.value)}
            className="text-[11px] bg-bg-base border border-border-default text-text-primary rounded-full px-3 py-1 font-medium hover:border-border-strong hover:bg-bg-subtle focus:outline-none transition-all cursor-pointer appearance-none pr-7 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%23AAA9A5%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_6px_center] bg-[length:14px]"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
            <option value="365">Last Year</option>
            <option value="730">Last 2 Years</option>
          </select>
        </div>

        {loading ? (
          <div className="w-full h-[250px] flex items-center justify-center text-[13px] text-text-secondary">
            Loading...
          </div>
        ) : (
          <div className="relative w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E6E4DF" strokeDasharray="3 3" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8}
                  minTickGap={30} 
                  tick={{ fontSize: 11, fill: '#AAA9A5', fontFamily: 'Geist' }}
                />
                <Tooltip
                  cursor={{ stroke: '#6366F1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ backgroundColor: '#FFFAFA', borderColor: '#E6E4DF', borderRadius: '6px', fontSize: '11px', fontFamily: 'Geist', fontWeight: 500, color: '#2D2C2A' }}
                  itemStyle={{ color: '#2D2C2A' }}
                  formatter={(value: any) => [`${Number(value).toFixed(1)} / 5`, 'Average Rating']}
                />
                <Area 
                  type="natural" 
                  dataKey="rating" 
                  stroke="#6366F1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRating)" 
                  activeDot={{ r: 5, fill: "#6366F1", stroke: "#FFFFFF", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Footer info showing trend with lucide icons just like the example */}
        <div className="mt-6 flex w-full items-start gap-2 text-sm border-t border-border-default pt-4">
          <div className="grid gap-1">
            <div className="flex items-center gap-2 leading-none font-medium text-text-primary text-[13px]">
              Monitoring continuous app sentiment <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex items-center gap-2 leading-none text-text-secondary text-[12px]">
              Based on the last {range} days of reviews
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
