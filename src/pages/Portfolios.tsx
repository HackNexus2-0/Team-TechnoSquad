import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Portfolio, Stock, Transaction } from '../types';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

export default function Portfolios() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [portfolioForm, setPortfolioForm] = useState({
    name: '',
    description: '',
    initial_capital: 10000,
  });

  const [transactionForm, setTransactionForm] = useState({
    stock_symbol: '',
    stock_name: '',
    sector: '',
    transaction_type: 'buy' as 'buy' | 'sell',
    quantity: 0,
    price: 0,
    fees: 0,
    transaction_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadPortfolios();
      loadStocks();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPortfolio) {
      loadTransactions(selectedPortfolio.id);
    }
  }, [selectedPortfolio]);

  const loadPortfolios = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPortfolios(data || []);
    } catch (error) {
      console.error('Error loading portfolios:', error);
    }
  };

  const loadStocks = async () => {
    try {
      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .order('symbol');

      if (error) throw error;
      setStocks(data || []);
    } catch (error) {
      console.error('Error loading stocks:', error);
    }
  };

  const loadTransactions = async (portfolioId: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          stock:stocks(*)
        `)
        .eq('portfolio_id', portfolioId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const createPortfolio = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('portfolios')
        .insert([
          {
            user_id: user.id,
            name: portfolioForm.name,
            description: portfolioForm.description,
            initial_capital: portfolioForm.initial_capital,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setPortfolios([data, ...portfolios]);
      setShowCreateModal(false);
      setPortfolioForm({ name: '', description: '', initial_capital: 10000 });
    } catch (error) {
      console.error('Error creating portfolio:', error);
      alert('Failed to create portfolio');
    }
  };

  const deletePortfolio = async (portfolioId: string) => {
    if (!confirm('Are you sure you want to delete this portfolio?')) return;

    try {
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', portfolioId);

      if (error) throw error;

      setPortfolios(portfolios.filter((p) => p.id !== portfolioId));
      if (selectedPortfolio?.id === portfolioId) {
        setSelectedPortfolio(null);
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      alert('Failed to delete portfolio');
    }
  };

  const createTransaction = async () => {
    if (!selectedPortfolio) return;

    try {
      let stockId = null;
      const existingStock = stocks.find((s) => s.symbol === transactionForm.stock_symbol.toUpperCase());

      if (existingStock) {
        stockId = existingStock.id;
      } else {
        const { data: newStock, error: stockError } = await supabase
          .from('stocks')
          .insert([
            {
              symbol: transactionForm.stock_symbol.toUpperCase(),
              name: transactionForm.stock_name,
              sector: transactionForm.sector,
            },
          ])
          .select()
          .single();

        if (stockError) throw stockError;
        stockId = newStock.id;
        setStocks([...stocks, newStock]);
      }

      const { error } = await supabase.from('transactions').insert([
        {
          portfolio_id: selectedPortfolio.id,
          stock_id: stockId,
          transaction_type: transactionForm.transaction_type,
          quantity: transactionForm.quantity,
          price: transactionForm.price,
          fees: transactionForm.fees,
          transaction_date: transactionForm.transaction_date,
          notes: transactionForm.notes,
        },
      ]);

      if (error) throw error;

      loadTransactions(selectedPortfolio.id);
      setShowTransactionModal(false);
      setTransactionForm({
        stock_symbol: '',
        stock_name: '',
        sector: '',
        transaction_type: 'buy',
        quantity: 0,
        price: 0,
        fees: 0,
        transaction_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Failed to create transaction');
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      if (selectedPortfolio) {
        loadTransactions(selectedPortfolio.id);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Portfolios</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Portfolio
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolios</h2>
              <div className="space-y-2">
                {portfolios.map((portfolio) => (
                  <div
                    key={portfolio.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                      selectedPortfolio?.id === portfolio.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPortfolio(portfolio)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{portfolio.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{portfolio.description}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePortfolio(portfolio.id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {portfolios.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No portfolios yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            {selectedPortfolio ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{selectedPortfolio.name}</h2>
                  <button
                    onClick={() => setShowTransactionModal(true)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Transaction
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Stock</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((txn) => {
                        const total = txn.quantity * txn.price + txn.fees;
                        return (
                          <tr key={txn.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {new Date(txn.transaction_date).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                  txn.transaction_type === 'buy'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {txn.transaction_type === 'buy' ? (
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 mr-1" />
                                )}
                                {txn.transaction_type.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">{txn.stock?.symbol}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 text-right">{txn.quantity}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 text-right">${txn.price.toFixed(2)}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 text-right">${total.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => deleteTransaction(txn.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {transactions.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No transactions yet</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">Select a portfolio to view transactions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Portfolio</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={portfolioForm.name}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My Portfolio"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={portfolioForm.description}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Long-term growth portfolio"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Capital</label>
                <input
                  type="number"
                  value={portfolioForm.initial_capital}
                  onChange={(e) =>
                    setPortfolioForm({ ...portfolioForm, initial_capital: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10000"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={createPortfolio}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Transaction</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={transactionForm.transaction_type}
                  onChange={(e) =>
                    setTransactionForm({ ...transactionForm, transaction_type: e.target.value as 'buy' | 'sell' })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Symbol</label>
                <input
                  type="text"
                  value={transactionForm.stock_symbol}
                  onChange={(e) =>
                    setTransactionForm({ ...transactionForm, stock_symbol: e.target.value.toUpperCase() })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="AAPL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Name</label>
                <input
                  type="text"
                  value={transactionForm.stock_name}
                  onChange={(e) => setTransactionForm({ ...transactionForm, stock_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Apple Inc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                <input
                  type="text"
                  value={transactionForm.sector}
                  onChange={(e) => setTransactionForm({ ...transactionForm, sector: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Technology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  step="0.0001"
                  value={transactionForm.quantity}
                  onChange={(e) => setTransactionForm({ ...transactionForm, quantity: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price per Share</label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionForm.price}
                  onChange={(e) => setTransactionForm({ ...transactionForm, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="150.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fees</label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionForm.fees}
                  onChange={(e) => setTransactionForm({ ...transactionForm, fees: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Date</label>
                <input
                  type="date"
                  value={transactionForm.transaction_date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, transaction_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={transactionForm.notes}
                  onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowTransactionModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={createTransaction}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
              >
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
