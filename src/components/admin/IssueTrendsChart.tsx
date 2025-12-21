'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyTrend {
    month: string;
    issued: number;
    returned: number;
}

interface IssueTrendsChartProps {
    data: MonthlyTrend[];
}

export default function IssueTrendsChart({ data }: IssueTrendsChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-secondary-500">
                <p>No trend data available</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                    }}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="issued"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Items Issued"
                    activeDot={{ r: 8 }}
                />
                <Line
                    type="monotone"
                    dataKey="returned"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Items Returned"
                    activeDot={{ r: 8 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
