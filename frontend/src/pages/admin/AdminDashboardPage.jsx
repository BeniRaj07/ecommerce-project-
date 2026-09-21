import React, { useState, useEffect } from 'react';
import API from '../../api';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import AdminLayout from '../../components/AdminLayout';
import {
  FaMoneyBillWave,
  FaClipboardList,
  FaUsers,
  FaBoxOpen,
  FaTruck,
  FaHourglassHalf,
  FaBan,
  FaUndo,
} from 'react-icons/fa';
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

const STAT_ACCENTS = {
  indigo: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  sky: 'bg-sky-50 text-sky-600',
  red: 'bg-red-50 text-red-600',
  slate: 'bg-slate-100 text-slate-600',
};

const StatTile = (props) => {
  const Icon = props.icon;
  return (
    <div className="bg-white rounded-2xl shadow-soft p-5 flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{props.label}</p>
        <p className="text-2xl font-bold mt-1 text-slate-900">{props.value}</p>
      </div>
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${STAT_ACCENTS[props.accent || 'indigo']}`}>
        <Icon />
      </span>
    </div>
  );
};

const ChartCard = ({ title, children, empty }) => (
  <div className="bg-white rounded-2xl shadow-soft p-5">
    <h3 className="font-bold text-slate-800 mb-4">{title}</h3>
    {empty ? (
      <p className="text-sm text-slate-400 py-16 text-center">Not enough order data yet.</p>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatTile label="Total Revenue" value={currency(totals.totalRevenue)} icon={FaMoneyBillWave} accent="emerald" />
        <StatTile label="Total Orders" value={totals.totalOrders} icon={FaClipboardList} accent="indigo" />
        <StatTile label="Total Users" value={totals.totalUsers} icon={FaUsers} accent="sky" />
        <StatTile label="Total Products" value={totals.totalProducts} icon={FaBoxOpen} accent="amber" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatTile label="Delivered Orders" value={totals.deliveredOrders} icon={FaTruck} accent="emerald" />
        <StatTile label="Pending Revenue" value={currency(totals.pendingRevenue)} icon={FaHourglassHalf} accent="amber" />
        <StatTile label="Cancellation Requests" value={totals.cancellationRequestsCount} icon={FaBan} accent="red" />
        <StatTile label="Return Requests" value={totals.returnRequestsCount} icon={FaUndo} accent="red" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 max-w-xl">
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Cancelled</p>
          <p className="text-xl font-bold mt-1 text-slate-900">{totals.cancelledOrders} orders</p>
          <p className="text-sm text-slate-500 mt-0.5">{currency(totals.cancelledAmount)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Returned / Refunded</p>
          <p className="text-xl font-bold mt-1 text-slate-900">{totals.returnedOrders} orders</p>
          <p className="text-sm text-slate-500 mt-0.5">{currency(totals.refundedAmount)}</p>
        </div>
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

      <div className="bg-white rounded-2xl shadow-soft p-5">
        <h3 className="font-bold text-slate-800 mb-4">Most Frequent Customers</h3>
        {topCustomers.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No orders placed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="py-3 px-3 font-semibold">Customer</th>
                  <th className="py-3 px-3 font-semibold">Email</th>
                  <th className="py-3 px-3 font-semibold">Orders</th>
                  <th className="py-3 px-3 font-semibold">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topCustomers.map((c) => (
                  <tr key={c.userId} className="hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                          {c.name?.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium text-slate-800">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3"><a href={`mailto:${c.email}`} className="text-brand-600 hover:underline">{c.email}</a></td>
                    <td className="py-3 px-3 text-slate-600">{c.orderCount}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{currency(c.totalSpent)}</td>
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
