import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Portfolio, Stock, Transaction } from '../types';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

interface FirebasePortfolio extends Omit<Portfolio, 'created_at' | 'updated_at'> {
  created_at: Timestamp;
  updated_at: Timestamp;
}

interface FirebaseTransaction extends Omit<Transaction, 'created_at' | 'transaction_date'> {
  created_at: Timestamp;
  transaction_date: Timestamp;
}

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
        const data = doc.data() as FirebasePortfolio;
        return {
          id: doc.id,
          user_id: data.user_id,
          name: data.name,
          description: data.description,
          initial_capital: data.initial_capital,
          created_at: data.created_at.toDate().toISOString(),
          updated_at: data.updated_at.toDate().toISOString(),
        };
      });

      setPortfolios(portfolioData);
    } catch (error) {
      console.error('Error loading portfolios:', error);
    }
  };

  const loadStocks = async () => {
    try {
      const stocksRef = collection(db, 'stocks');
      const q = query(stocksRef, orderBy('symbol'));
      const querySnapshot = await getDocs(q);

      const stockData: Stock[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Stock[];

      setStocks(stockData);
    } catch (error) {
      console.error('Error loading stocks:', error);
    }
  };

  const loadTransactions = async (portfolioId: string) => {
    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('portfolio_id', '==', portfolioId),
        orderBy('transaction_date', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const transactionData: Transaction[] = [];
      
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as FirebaseTransaction;
        
        // Fetch related stock data
        const stockDocRef = doc(db, 'stocks', data.stock_id);
        const stockDoc = await getDoc(stockDocRef);
        const stockData = stockDoc.exists() ? { id: stockDoc.id, ...stockDoc.data() } as Stock : null;

        transactionData.push({
          id: docSnap.id,
          portfolio_id: data.portfolio_id,
          stock_id: data.stock_id,
          transaction_type: data.transaction_type,
          quantity: data.quantity,
          price: data.price,
          fees: data.fees,
          notes: data.notes,
          transaction_date: data.transaction_date.toDate().toISOString(),
          created_at: data.created_at.toDate().toISOString(),
          stock: stockData || undefined,
        });
      }

      setTransactions(transactionData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const createPortfolio = async () => {
    if (!user) return;

    try {
      const portfoliosRef = collection(db, 'portfolios');
      const docRef = await addDoc(portfoliosRef, {
        user_id: user.uid,
        name: portfolioForm.name,
        description: portfolioForm.description,
        initial_capital: portfolioForm.initial_capital,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      const newPortfolio: Portfolio = {
        id: docRef.id,
        user_id: user.uid,
        name: portfolioForm.name,
        description: portfolioForm.description,
        initial_capital: portfolioForm.initial_capital,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setPortfolios([newPortfolio, ...portfolios]);
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
      await deleteDoc(doc(db, 'portfolios', portfolioId));

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
        // Create new stock
        const stocksRef = collection(db, 'stocks');
        const newStockRef = await addDoc(stocksRef, {
          symbol: transactionForm.stock_symbol.toUpperCase(),
          name: transactionForm.stock_name,
          sector: transactionForm.sector,
          industry: '',
          exchange: '',
          currency: 'USD',
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });

        const newStock: Stock = {
          id: newStockRef.id,
          symbol: transactionForm.stock_symbol.toUpperCase(),
          name: transactionForm.stock_name,
          sector: transactionForm.sector,
          industry: '',
          exchange: '',
          currency: 'USD',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        stockId = newStockRef.id;
        setStocks([...stocks, newStock]);
      }

      // Create transaction
      const transactionsRef = collection(db, 'transactions');
      await addDoc(transactionsRef, {
        portfolio_id: selectedPortfolio.id,
        stock_id: stockId,
        transaction_type: transactionForm.transaction_type,
        quantity: transactionForm.quantity,
        price: transactionForm.price,
        fees: transactionForm.fees,
        transaction_date: Timestamp.fromDate(new Date(transactionForm.transaction_date)),
        notes: transactionForm.notes,
        created_at: serverTimestamp(),
      });

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
      await deleteDoc(doc(db, 'transactions', transactionId));
      
      if (selectedPortfolio) {
        loadTransactions(selectedPortfolio.id);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  const calculatePortfolioValue = () => {
    const holdings = new Map<string, { quantity: number; symbol: string; name: string }>();

    transactions.forEach((txn) => {
      const key = txn.stock_id;
      const current = holdings.get(key) || { quantity: 0, symbol: txn.stock?.symbol || '', name: txn.stock?.name || '' };

      if (txn.transaction_type === 'buy') {
        current.quantity += txn.quantity;
      } else {
        current.quantity -= txn.quantity;
      }

      holdings.set(key, current);
    });

    return Array.from(holdings.entries())
      .filter(([_, holding]) => holding.quantity > 0)
      .map(([stockId, holding]) => ({
        stockId,
        ...holding,
      }));
  };

  const holdings = selectedPortfolio ? calculatePortfolioValue() : [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Portfolios</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Portfolio
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600">
                <h2 className="text-white font-semibold">Portfolios</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {portfolios.map((portfolio) => (
                  <div
                    key={portfolio.id}
                    onClick={() => setSelectedPortfolio(portfolio)}
                    className={`p-4 cursor-pointer transition ${
                      selectedPortfolio?.id === portfolio.id
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{portfolio.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{portfolio.description}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          Initial: ${portfolio.initial_capital.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePortfolio(portfolio.id);
                        }}
                        className="text-red-600 hover:text-red-700 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {portfolios.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>No portfolios yet</p>
                    <p className="text-sm mt-1">Create your first portfolio to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {selectedPortfolio ? (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedPortfolio.name}</h2>
                      <p className="text-gray-600 mt-1">{selectedPortfolio.description}</p>
                    </div>
                    <button
                      onClick={() => setShowTransactionModal(true)}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Transaction
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                      <p className="text-sm text-blue-700 font-medium">Current Holdings</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">{holdings.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                      <p className="text-sm text-green-700 font-medium">Total Transactions</p>
                      <p className="text-2xl font-bold text-green-900 mt-1">{transactions.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Transaction History</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                          <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
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
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    txn.transaction_type === 'buy'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
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
                              <td className="py-3 px-4 text-sm">
                                <div>
                                  <div className="font-medium text-gray-900">{txn.stock?.symbol}</div>
                                  <div className="text-gray-500 text-xs">{txn.stock?.name}</div>
                                </div>
                              </td>
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
