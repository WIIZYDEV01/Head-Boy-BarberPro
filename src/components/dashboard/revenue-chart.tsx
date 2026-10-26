"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/money";

export function RevenueChart({
  data,
  currency,
}: {
  data: { date: string; amount: number }[];
  currency: string;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="date" stroke="#a8a29a" fontSize={12} />
          <YAxis stroke="#a8a29a" fontSize={12} />
          <Tooltip
            formatter={(value) => formatMoney(Number(value), currency)}
            contentStyle={{ background: "#141416", border: "1px solid #2a2a2e" }}
          />
          <Bar dataKey="amount" fill="#c6a15b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
