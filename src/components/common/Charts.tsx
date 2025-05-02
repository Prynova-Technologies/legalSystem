import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import './CommonStyles.css';
import { DashboardData } from '../../services/dashboardService';

interface DashboardChartsProps {
  className?: string;
  dashboardData: DashboardData | null;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ className, dashboardData }) => {
  // Prepare data for case status chart
  const caseStatusData = dashboardData?.graphs?.caseStatusDistribution?.map(item => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' '),
    value: item.count
  })) || [];

  // Prepare data for task priority chart
  const taskPriorityData = dashboardData?.graphs?.taskPriorityBreakdown?.map(item => ({
    name: item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
    value: item.count
  })) || [];

  // Prepare data for monthly income and expenditure
  const currentYear = new Date().getFullYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Format monthly financial data for the chart
  const monthlyFinancialData = dashboardData?.graphs?.monthlyFinancial?.map((item) => {
    return {
      name: monthNames[item.month - 1],
      income: item.income,
      expenditure: item.expenditure || 0
    };
  }) || [];
  
  // If no data is available, create empty placeholder data
  const financialChartData = monthlyFinancialData.length > 0 ? 
    monthlyFinancialData : 
    monthNames.map(month => ({ name: month, income: 0, expenditure: 0 }));

  // Prepare data for case types
  const caseTypeData = dashboardData?.graphs?.caseTypeDistribution?.map(item => ({
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1).replace('_', ' '),
    value: item.count
  })) || [];

  // Colors for charts
  const COLORS = ['#4a6cf7', '#6979f8', '#00C49F', '#FFBB28', '#FF8042', '#a855f7'];

  return (
    <div className={`dashboard-charts ${className || ''}`}>
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Case Status Distribution</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={caseStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {caseStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} cases`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Task Priority Breakdown</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={taskPriorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
                <Bar dataKey="value" fill="#4a6cf7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Monthly Income & Expenditure</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={financialChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, '']} />
                <Legend />
                <Area type="monotone" dataKey="income" stackId="1" stroke="#4a6cf7" fill="#4a6cf7" name="Income" />
                <Area type="monotone" dataKey="expenditure" stackId="2" stroke="#FF8042" fill="#FF8042" name="Expenditure" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Case Types</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={caseTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {caseTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} cases`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;