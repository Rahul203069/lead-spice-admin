"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { 
  Bar, 
  BarChart, 
 
 
  PieChart, 
  Pie, 
  Cell
 
 
} from "recharts";

// --- Bar Chart for Workflow Popularity ---
export function WorkflowBarChart({ data }: { data: { workflowType: string | null; count: number }[] }) {
  // Filter out nulls and format for the chart
  const chartData = data
    .filter(d => d.workflowType !== null)
    .map(d => ({
      name: d.workflowType,
      total: Number(d.count)
    }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <XAxis 
          dataKey="name" 
          stroke="#888888" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          stroke="#888888" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => `${value}`} 
        />
        <Tooltip 
          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// --- Donut Chart for Job Status ---
export function JobStatusChart({ completed, failed, processing }: { completed: number, failed: number, processing: number }) {
  const data = [
    { name: "Completed", value: completed, color: "#10b981" }, // Emerald
    { name: "Processing", value: processing, color: "#f59e0b" }, // Amber
    { name: "Failed", value: failed, color: "#ef4444" }, // Red
  ];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          paddingAngle={5}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}



export function UserGrowthChart({ data }: { data: { date: string; newUsers: number }[] }) {
  const safeData = data.length > 0 ? data : [{ date: "Today", newUsers: 0 }];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={safeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} dy={10} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          itemStyle={{ color: '#3b82f6', fontWeight: 600 }}
        />
        <Area type="monotone" dataKey="newUsers" name="New Users" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ActiveUsersChart({ data }: { data: { date: string; signIns: number }[] }) {
  // Safe fallback if the database returns an empty array
  const safeData = data.length > 0 ? data : [{ date: "Today", signIns: 0 }];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={safeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSignIns" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date" 
          stroke="#888888" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          dy={10}
        />
        <YAxis 
          stroke="#888888" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          allowDecimals={false} 
        />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          itemStyle={{ color: '#8b5cf6', fontWeight: 600 }}
        />
        <Area 
          type="monotone" 
          dataKey="signIns" 
          name="Active Users"
          stroke="#8b5cf6" 
          strokeWidth={2} 
          fillOpacity={1} 
          fill="url(#colorSignIns)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

