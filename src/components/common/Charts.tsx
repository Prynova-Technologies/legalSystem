import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import './CommonStyles.css';

interface DashboardChartsProps {
  className?: string;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ className }) => {
  const { cases } = useSelector((state: RootState) => state.cases);
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { timeEntries } = useSelector((state: RootState) => state.billing);

  // Prepare data for case status chart
  const caseStatusData = [
    { name: 'Open', value: cases.filter(c => c.status === 'open').length },
    { name: 'Pending', value: cases.filter(c => c.status === 'pending').length },
    { name: 'Awaiting Response', value: cases.filter(c => c.status === 'awaiting_response').length },
    { name: 'Closed', value: cases.filter(c => c.status === 'closed').length },
  ];

  // Prepare data for task priority chart
  const taskPriorityData = [
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length },
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length },
    { name: 'Urgent', value: tasks.filter(t => t.priority === 'urgent').length },
  ];

  // Prepare data for billing by month
  const currentYear = new Date().getFullYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const billingByMonth = monthNames.map((month, index) => {
    const entriesInMonth = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === index && entryDate.getFullYear() === currentYear;
    });
    
    const totalHours = entriesInMonth.reduce((sum, entry) => sum + entry.duration / 60, 0);
    const billedHours = entriesInMonth.filter(entry => entry.billed).reduce((sum, entry) => sum + entry.duration / 60, 0);
    const unbilledHours = totalHours - billedHours;
    
    return {
      name: month,
      billed: parseFloat(billedHours.toFixed(1)),
      unbilled: parseFloat(unbilledHours.toFixed(1)),
    };
  });

  // Prepare data for case types
  const caseTypeData = [
    { name: 'Corporate', value: cases.filter(c => c.caseType === 'corporate').length },
    { name: 'Criminal', value: cases.filter(c => c.caseType === 'criminal').length },
    { name: 'Family', value: cases.filter(c => c.caseType === 'family').length },
    { name: 'Real Estate', value: cases.filter(c => c.caseType === 'real_estate').length },
    { name: 'Intellectual Property', value: cases.filter(c => c.caseType === 'intellectual_property').length },
    { name: 'Other', value: cases.filter(c => !['corporate', 'criminal', 'family', 'real_estate', 'intellectual_property'].includes(c.caseType)).length },
  ];

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
          <h3>Billing Hours by Month</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={billingByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} hours`, '']} />
                <Legend />
                <Area type="monotone" dataKey="billed" stackId="1" stroke="#4a6cf7" fill="#4a6cf7" />
                <Area type="monotone" dataKey="unbilled" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
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