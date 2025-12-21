'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DepartmentData {
    name: string;
    code: string;
    total: number;
    available: number;
    issued: number;
}

interface DepartmentChartProps {
    data: DepartmentData[];
}

export default function DepartmentChart({ data }: DepartmentChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-secondary-500">
                <p>No department data available</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="code"
                    tick={{ fontSize: 12 }}
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
                <Bar dataKey="total" fill="#8b5cf6" name="Total Items" />
                <Bar dataKey="available" fill="#10b981" name="Available" />
                <Bar dataKey="issued" fill="#f59e0b" name="Issued" />
            </BarChart>
        </ResponsiveContainer>
    );
}
