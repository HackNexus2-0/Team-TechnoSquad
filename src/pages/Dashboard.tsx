import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Portfolio, PortfolioMetrics, Holding } from '../types';
import { TrendingUp, TrendingDown, DollarSign, PieChart, AlertCircle } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPortfolios();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPortfolio) {
      loadPortfolioMetrics(selectedPortfolio.id);
    }
  }, [selectedPortfolio]);

  const loadPortfolios = async () => {
    if (!user) return;

    try {
      const portfoliosRef = collection(db, 'portfolios');
      const q = query(
        portfoliosRef,
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const portfolioData: Portfolio[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          user_id: data.user_id,
          name: data.name,
          description: data.description,
          initial_capital: data.initial_capital,
          created_at: data.created_at?.toDate().toISOString() || new Date().toISOString(),
          updated_at: data.updated_at?.toDate().toISOString() || new Date().toISOString(),
        };
      });

      setPortfolios(portfolioData);
      if (portfolioData.length > 0) {
        setSelectedPortfolio(portfolioData[0]);
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolioMetrics = async (portfolioId: string) => {
    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('portfolio_id', '==', portfolioId),
        orderBy('transaction_date', 'asc')
      );
      const querySnapshot = await getDocs(q);

      const holdings: Map<string, Holding> = new Map();
      let totalCost = 0;

      for (const txnDoc of querySnapshot.docs) {
        const txn = txnDoc.data();
        
        // Fetch related stock data
        const stockDocRef = doc(db, 'stocks', txn.stock_id);
        const stockDoc = await getDoc(stockDocRef);
        
        if (!stockDoc.exists()) continue;
        
        const stock = { id: stockDoc.id, ...stockDoc.data() } as any;

        const existingHolding = holdings.get(stock.symbol);

        if (txn.transaction_type === 'buy') {
          const cost = txn.quantity * txn.price + txn.fees;
          totalCost += cost;

          if (existingHolding) {
            const newQuantity = existingHolding.quantity + txn.quantity;
            const newTotalCost = existingHolding.totalCost + cost;
            existingHolding.quantity = newQuantity;
            existingHolding.totalCost = newTotalCost;
            existingHolding.averagePrice = newTotalCost / newQuantity;
          } else {
            holdings.set(stock.symbol, {
              stock,
              quantity: txn.quantity,
              averagePrice: txn.price,
              currentPrice: txn.price,
              totalCost: cost,
              currentValue: txn.quantity * txn.price,
              unrealizedGain: 0,
              unrealizedGainPercent: 0,
              weight: 0,
            });
          }
        } else if (txn.transaction_type === 'sell' && existingHolding) {
          existingHolding.quantity -= txn.quantity;
          if (existingHolding.quantity <= 0) {
            holdings.delete(stock.symbol);
          }
        }
      }

      const holdingsArray = Array.from(holdings.values());
      const totalValue = holdingsArray.reduce((sum, h) => sum + h.currentValue, 0);

      holdingsArray.forEach((holding) => {
        holding.unrealizedGain = holding.currentValue - holding.totalCost;
        holding.unrealizedGainPercent = ((holding.currentValue - holding.totalCost) / holding.totalCost) * 100;
        holding.weight = (holding.currentValue / totalValue) * 100;
      });

      const sectorMap = new Map<string, number>();
      holdingsArray.forEach((holding) => {
        const sector = holding.stock.sector || 'Unknown';
        sectorMap.set(sector, (sectorMap.get(sector) || 0) + holding.currentValue);
      });

      const sectorAllocation = Array.from(sectorMap.entries()).map(([sector, value]) => ({
        sector,
        value,
        percentage: (value / totalValue) * 100,
      }));

      setMetrics({
        totalValue,
        totalCost,
        totalGain: totalValue - totalCost,
        totalGainPercent: ((totalValue - totalCost) / totalCost) * 100,
        cagr: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        beta: 0,
        holdings: holdingsArray,
        sectorAllocation,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (portfolios.length === 0) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Portfolios Yet</h2>
          <p className="text-gray-600 mb-6">Create your first portfolio to start tracking your investments</p>
          <a
            href="/portfolios"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Create Portfolio
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <select
            value={selectedPortfolio?.id || ''}
            onChange={(e) => {
              const portfolio = portfolios.find((p) => p.id === e.target.value);
              setSelectedPortfolio(portfolio || null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {portfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name}
              </option>
            ))}
          </select>
        </div>

        {metrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Value</span>
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${metrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Gain/Loss</span>
                  {metrics.totalGain >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <p className={`text-2xl font-bold ${metrics.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(metrics.totalGain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className={`text-sm ${metrics.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.totalGainPercent >= 0 ? '+' : ''}{metrics.totalGainPercent.toFixed(2)}%
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Cost</span>
                  <DollarSign className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${metrics.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Holdings</span>
                  <PieChart className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{metrics.holdings.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Sector Allocation</h2>
                {metrics.sectorAllocation.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={metrics.sectorAllocation}
                        dataKey="value"
                        nameKey="sector"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.sector}: ${entry.percentage.toFixed(1)}%`}
                      >
                        {metrics.sectorAllocation.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-12">No data available</p>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Top Holdings</h2>
                <div className="space-y-4">
                  {metrics.holdings.slice(0, 5).map((holding) => (
                    <div key={holding.stock.symbol} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{holding.stock.symbol}</p>
                        <p className="text-sm text-gray-500">{holding.stock.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${holding.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className={`text-sm ${holding.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {holding.unrealizedGain >= 0 ? '+' : ''}{holding.unrealizedGainPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">All Holdings</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Symbol</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Avg Price</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Current Price</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Value</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Gain/Loss</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {metrics.holdings.map((holding) => (
                      <tr key={holding.stock.symbol} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{holding.stock.symbol}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{holding.stock.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 text-right">{holding.quantity}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 text-right">
                          ${holding.averagePrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 text-right">
                          ${holding.currentPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 text-right">
                          ${holding.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`py-3 px-4 text-sm text-right ${holding.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {holding.unrealizedGain >= 0 ? '+' : ''}${Math.abs(holding.unrealizedGain).toFixed(2)} ({holding.unrealizedGainPercent.toFixed(2)}%)
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 text-right">{holding.weight.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
