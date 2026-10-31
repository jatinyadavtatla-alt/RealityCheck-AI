"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const customTooltipStyle = {
  borderRadius: "12px",
  border: "1px solid rgba(226, 232, 240, 0.9)",
  boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08)",
  fontSize: "12px",
  fontWeight: 500,
  fontFamily: "var(--font-sans)",
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(8px)",
  color: "#0f172a",
  padding: "8px 12px",
};

export function ActivityChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const chartData = data.map((d) => ({
    day: new Date(`${d.date}T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
    audits: d.count,
  }));

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id="auditGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            interval={2}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
          />
          <Tooltip
            contentStyle={customTooltipStyle}
            formatter={(value: any) => [`${value} verification${Number(value) === 1 ? "" : "s"}`, "Volume"]}
          />
          <Area
            type="monotone"
            dataKey="audits"
            stroke="#2563eb"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#auditGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BreakdownDonut({
  breakdown,
}: {
  breakdown: { supported: number; discrepancy: number; unverifiable: number };
}) {
  const data = [
    { name: "Verified Evidence", value: breakdown.supported, color: "#10b981" },
    { name: "Contradictions", value: breakdown.discrepancy, color: "#f43f5e" },
    { name: "Unverifiable", value: breakdown.unverifiable, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative h-[160px] w-[160px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.length > 0 ? data : [{ name: "No Data", value: 1, color: "#f1f5f9" }]}
              dataKey="value"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={data.length > 1 ? 4 : 0}
              strokeWidth={0}
              cornerRadius={6}
              isAnimationActive
            >
              {(data.length > 0 ? data : [{ name: "No Data", value: 1, color: "#f1f5f9" }]).map(
                (entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                )
              )}
            </Pie>
            <Tooltip contentStyle={customTooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[22px] font-bold tracking-tight text-slate-900">
            {total}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Claims
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex flex-1 flex-col gap-2.5 w-full">
        <div className="flex items-center justify-between text-[12.5px]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700">Supported by Evidence</span>
          </div>
          <span className="font-semibold text-slate-900">
            {breakdown.supported} {total > 0 && <span className="text-[11px] text-slate-400 font-normal">({Math.round((breakdown.supported / total) * 100)}%)</span>}
          </span>
        </div>

        <div className="flex items-center justify-between text-[12.5px]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="font-medium text-slate-700">Discrepancies Flagged</span>
          </div>
          <span className="font-semibold text-rose-600">
            {breakdown.discrepancy} {total > 0 && <span className="text-[11px] text-rose-400 font-normal">({Math.round((breakdown.discrepancy / total) * 100)}%)</span>}
          </span>
        </div>

        <div className="flex items-center justify-between text-[12.5px]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="font-medium text-slate-700">Unverifiable Claims</span>
          </div>
          <span className="font-semibold text-slate-900">
            {breakdown.unverifiable} {total > 0 && <span className="text-[11px] text-slate-400 font-normal">({Math.round((breakdown.unverifiable / total) * 100)}%)</span>}
          </span>
        </div>
      </div>
    </div>
  );
}
