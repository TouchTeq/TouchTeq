'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

const CATEGORY_COLORS: any = {
  'Materials': '#f97316',
  'Travel': '#3b82f6',
  'Equipment': '#8b5cf6',
  'Software': '#10b981',
  'Professional Fees': '#ec4899',
  'Other': '#64748b'
};

export function CategorySpendChart({ data }: { data: any[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="category" 
            stroke="#64748b" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tick={{ fontWeight: 'bold' }}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `R${value}`}
            tick={{ fontWeight: 'bold' }}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const category = payload[0].payload.category;
                const value = payload[0].value as number;
                return (
                  <div className="bg-[#151B28] border border-slate-800 p-3 rounded-lg shadow-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{category}</p>
                    <p className="text-white font-black text-sm">R {value.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#475569'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryDistributionPie({ data }: { data: any[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="total"
            nameKey="category"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#475569'} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const category = payload[0].name;
                const value = payload[0].value as number;
                return (
                  <div className="bg-[#151B28] border border-slate-800 p-3 rounded-lg shadow-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{category}</p>
                    <p className="text-white font-black text-sm">R {value.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
