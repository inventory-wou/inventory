'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CategoryData {
    name: string;
    count: number;
}

interface CategoryChartProps {
    data: CategoryData[];
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6'];

export default function CategoryChart({ data }: CategoryChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-secondary-500">
                <p>No category data available</p>
            </div>
        );
    }

    // Filter out categories with 0 items
    const filteredData = data.filter(item => item.count > 0);

    if (filteredData.length === 0) {
        return (
            <div className="text-center py-8 text-secondary-500">
                <p>No items in any category</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={filteredData as any}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                >
                    {filteredData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                    }}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
