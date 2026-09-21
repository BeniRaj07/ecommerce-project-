import React, { useState, useEffect } from 'react';
import API from '../../api';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import AdminLayout from '../../components/AdminLayout';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// Validated categorical palette (fixed order — see dataviz skill reference palette)
const CATEGORICAL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300'];
const SEQUENTIAL_BLUE = '#2a78d6';
const OTHER_GRAY = '#c3c2b7';
const GRIDLINE = '#e1e0d9';
const AXIS_INK = '#898781';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const currency = (n) => `Rs ${Number(n || 0).toLocaleString('en-IN')}/-`;

const StatTile = ({ label, value }) => (
  <div className="bg-white border rounded-lg p-4">
    <p className="text-xs uppercase text-gray-500 font-semibold">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

const ChartCard = ({ title, children, empty }) => (
  <div className="bg-white border rounded-lg p-4">
    <h3 className="font-bold mb-4">{title}</h3>
    {empty ? (
      <p className="text-sm text-gray-500 py-16 text-center">Not enough order data yet.</p>
    ) : (
      <div style={{ width: '100%', height: 280 }}>{children}</div>
    )}
  </div>
);

// Folds a ranked list down to `limit` entries + a rolled-up "Other" slice
const withOtherSlice = (rows, limit, valueKey) => {
  if (rows.length <= limit) return rows;
  const head = rows.slice(0, limit);
  const restTotal = rows.slice(limit).reduce((acc, r) => acc + r[valueKey], 0);
  return [...head, { name: 'Other', [valueKey]: restTotal }];
};

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/api/orders/stats');
        setStats(data);
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Loader />;
  if (!stats) return null;

  const { topProducts, monthlySales, topCustomers, totals } = stats;

  const productPieData = withOtherSlice(topProducts, 5, 'qtySold');

  const monthlyBars = monthlySales.map((m) => ({
    label: `${MONTH_NAMES[m._id.month - 1]} ${m._id.year}`,
    revenue: m.revenue,
    orders: m.orders,
  }));
  const monthlyPieData = monthlySales.slice(-6).map((m) => ({
    name: `${MONTH_NAMES[m._id.month - 1]} ${m._id.year}`,
    revenue: m.revenue,
  }));

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatTile label="Total Revenue" value={currency(totals.totalRevenue)} />
        <StatTile label="Total Orders" value={totals.totalOrders} />
        <StatTile label="Total Users" value={totals.totalUsers} />
        <StatTile label="Total Products" value={totals.totalProducts} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Best-Selling Products (units sold)" empty={topProducts.length === 0}>
          <ResponsiveContainer>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRIDLINE} horizontal={false} />
              <XAxis type="number" tick={{ fill: AXIS_INK, fontSize: 12 }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fill: AXIS_INK, fontSize: 12 }}
                tickFormatter={(v) => (v.length > 18 ? `${v.slice(0, 18)}…` : v)}
              />
              <Tooltip formatter={(value) => [value, 'Units sold']} />
              <Bar dataKey="qtySold" fill={SEQUENTIAL_BLUE} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Product Sales Share (top 5 + Other)" empty={topProducts.length === 0}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={productPieData} dataKey="qtySold" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                {productPieData.map((entry, i) => (
                  <Cell key={entry.name} fill={entry.name === 'Other' ? OTHER_GRAY : CATEGORICAL[i % CATEGORICAL.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Units sold']} />
              <Legend verticalAlign="bottom" height={48} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Monthly Sales (revenue)" empty={monthlySales.length === 0}>
          <ResponsiveContainer>
            <LineChart data={monthlyBars} margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRIDLINE} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: AXIS_INK, fontSize: 11 }} />
              <YAxis tick={{ fill: AXIS_INK, fontSize: 12 }} />
              <Tooltip formatter={(value) => [currency(value), 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke={SEQUENTIAL_BLUE} strokeWidth={2} dot={{ r: 4, fill: SEQUENTIAL_BLUE }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue Share by Month (last 6)" empty={monthlySales.length === 0}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={monthlyPieData} dataKey="revenue" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                {monthlyPieData.map((entry, i) => (
                  <Cell key={entry.name} fill={CATEGORICAL[i % CATEGORICAL.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [currency(value), 'Revenue']} />
              <Legend verticalAlign="bottom" height={48} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-bold mb-4">Most Frequent Customers</h3>
        {topCustomers.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No orders placed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Name</th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Email</th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Orders</th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Total Spent</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {topCustomers.map((c) => (
                  <tr key={c.userId} className="border-b hover:bg-gray-100">
                    <td className="py-3 px-4">{c.name}</td>
                    <td className="py-3 px-4"><a href={`mailto:${c.email}`} className="text-blue-500">{c.email}</a></td>
                    <td className="py-3 px-4">{c.orderCount}</td>
                    <td className="py-3 px-4">{currency(c.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
