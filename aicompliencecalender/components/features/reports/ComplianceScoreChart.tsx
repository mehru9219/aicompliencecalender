/**
 * Chart component showing compliance score history over time.
 */

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface ScoreData {
  month: string;
  score: number;
}

interface ComplianceScoreChartProps {
  data: ScoreData[];
  height?: number;
  showTarget?: boolean;
  targetScore?: number;
}

export function ComplianceScoreChart({
  data,
  height = 300,
  showTarget = true,
  targetScore = 90,
}: ComplianceScoreChartProps) {
  // Calculate average score
  const avgScore =
    data.length > 0
      ? Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length)
      : 0;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            12-Month Compliance Trend
          </h3>
          <p className="text-2xl font-bold">
            {avgScore}%
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              average
            </span>
          </p>
        </div>
        {showTarget && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Target</p>
            <p className="text-lg font-semibold text-primary">{targetScore}%</p>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            className="fill-muted-foreground"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            className="fill-muted-foreground"
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const score = payload[0].value as number;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-lg font-bold text-primary">{score}%</p>
                    <p className="text-xs text-muted-foreground">
                      {score >= targetScore ? "Above target" : "Below target"}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          {showTarget && (
            <ReferenceLine
              y={targetScore}
              stroke="hsl(var(--primary))"
              strokeDasharray="5 5"
              strokeOpacity={0.5}
            />
          )}
          <Line
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
            activeDot={{
              r: 6,
              stroke: "hsl(var(--background))",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
