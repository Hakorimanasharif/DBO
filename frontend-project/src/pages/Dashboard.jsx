import { useState, useEffect } from 'react';
import { productAPI, saleAPI, reportAPI } from '../services/api';
import { getUser } from '../utils/auth';

const Dashboard = () => {
  const user = getUser();
  const [stats, setStats] = useState({ products: 0, salesToday: 0, lowStock: 0, revenue: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, salesRes, stockRes] = await Promise.all([
          productAPI.getAll(),        // Fetch products
          saleAPI.getAll(),           // Fetch sales
          reportAPI.stockStatus(),    // Fetch stock status report
        ]);
        const products = productsRes.data;
        const sales = salesRes.data;
        const stockReport = stockRes.data;

        const today = new Date().toISOString().split('T')[0];
        const todaySales = sales.filter((s) => {
          const d = new Date(s.saleDate).toISOString().split('T')[0];
          return d === today;
        });
        const todayTotal = todaySales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
        const totalRevenue = sales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);

        setStats({
          products: products.length,
          salesToday: todayTotal,
          lowStock: stockReport.lowStock || 0,
          revenue: totalRevenue,
        });
        setRecentSales(sales.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatRWF = (amount) =>
    new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const cards = [
    { label: 'Total Products', value: stats.products, gradient: 'from-blue-500 to-blue-600', icon: '📦', light: 'bg-blue-50 text-blue-600' },
    { label: 'Sales Today', value: formatRWF(stats.salesToday), gradient: 'from-emerald-500 to-green-600', icon: '💰', light: 'bg-emerald-50 text-emerald-600' },
    { label: 'Low Stock Items', value: stats.lowStock, gradient: 'from-amber-500 to-yellow-600', icon: '⚠️', light: 'bg-amber-50 text-amber-600' },
    { label: 'Total Revenue', value: formatRWF(stats.revenue), gradient: 'from-violet-500 to-indigo-600', icon: '📈', light: 'bg-violet-50 text-violet-600' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse border border-gray-100">
              <div className="h-10 w-10 bg-gray-100 rounded-xl mb-4" />
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-7 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse border border-gray-100">
          <div className="h-6 bg-gray-100 rounded w-1/4 mb-6" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-50 rounded-xl mb-3" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, <span className="font-semibold text-gray-700">{user?.username || 'User'}</span></p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gray-500">System active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-4">
              <div className={`${card.light} w-11 h-11 rounded-xl flex items-center justify-center text-lg`}>
                {card.icon}
              </div>
              <div className={`bg-gradient-to-r ${card.gradient} w-1.5 h-8 rounded-full opacity-60`} />
            </div>
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
          <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">Last 5 transactions</span>
        </div>
        {recentSales.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 opacity-30">📭</div>
            <p className="text-gray-400 font-medium">No sales recorded yet</p>
            <p className="text-gray-300 text-sm mt-1">Sales will appear here once you start recording</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentSales.map((s, i) => (
                  <tr key={s._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        {new Date(s.saleDate).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{s.product?.name || 'Deleted'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{s.quantity}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">{formatRWF(s.totalPrice)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
