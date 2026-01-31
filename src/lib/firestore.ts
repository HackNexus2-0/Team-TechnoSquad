import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Portfolio,
  Transaction,
  Stock,
  UserPreferences,
  StockPrice,
  PortfolioSnapshot,
} from '../types';

// Collection references
const COLLECTIONS = {
  USER_PREFERENCES: 'user_preferences',
  PORTFOLIOS: 'portfolios',
  STOCKS: 'stocks',
  TRANSACTIONS: 'transactions',
  STOCK_PRICES: 'stock_prices',
  PORTFOLIO_SNAPSHOTS: 'portfolio_snapshots',
};

// Helper to convert Firestore timestamp to ISO string
const timestampToString = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString();
  if (timestamp.toDate) return timestamp.toDate().toISOString();
  return timestamp;
};

// Helper to convert data from Firestore
const convertFirestoreDoc = (docSnap: any) => {
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    created_at: timestampToString(data.created_at),
    updated_at: data.updated_at ? timestampToString(data.updated_at) : timestampToString(data.created_at),
  };
};

// USER PREFERENCES
export const userPreferencesService = {
  async get(userId: string): Promise<UserPreferences | null> {
    const q = query(
      collection(db, COLLECTIONS.USER_PREFERENCES),
      where('user_id', '==', userId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return convertFirestoreDoc(snapshot.docs[0]) as UserPreferences;
  },

  async create(userId: string, data: Partial<UserPreferences>): Promise<UserPreferences> {
    const docData = {
      user_id: userId,
      risk_profile: data.risk_profile || 'moderate',
      investment_horizon: data.investment_horizon || 'medium',
      preferred_sectors: data.preferred_sectors || [],
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.USER_PREFERENCES), docData);
    const docSnap = await getDoc(docRef);
    return convertFirestoreDoc(docSnap) as UserPreferences;
  },

  async update(id: string, data: Partial<UserPreferences>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.USER_PREFERENCES, id);
    await updateDoc(docRef, {
      ...data,
      updated_at: Timestamp.now(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.USER_PREFERENCES, id));
  },
};

// PORTFOLIOS
export const portfoliosService = {
  async getAll(userId: string): Promise<Portfolio[]> {
    const q = query(
      collection(db, COLLECTIONS.PORTFOLIOS),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => convertFirestoreDoc(doc) as Portfolio);
  },

  async getById(id: string): Promise<Portfolio | null> {
    const docSnap = await getDoc(doc(db, COLLECTIONS.PORTFOLIOS, id));
    return convertFirestoreDoc(docSnap) as Portfolio | null;
  },

  async create(userId: string, data: Partial<Portfolio>): Promise<Portfolio> {
    const docData = {
      user_id: userId,
      name: data.name || '',
      description: data.description || '',
      initial_capital: data.initial_capital || 0,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.PORTFOLIOS), docData);
    const docSnap = await getDoc(docRef);
    return convertFirestoreDoc(docSnap) as Portfolio;
  },

  async update(id: string, data: Partial<Portfolio>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PORTFOLIOS, id);
    await updateDoc(docRef, {
      ...data,
      updated_at: Timestamp.now(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.PORTFOLIOS, id));
  },
};

// STOCKS
export const stocksService = {
  async getAll(): Promise<Stock[]> {
    const snapshot = await getDocs(collection(db, COLLECTIONS.STOCKS));
    return snapshot.docs.map((doc) => convertFirestoreDoc(doc) as Stock);
  },

  async getBySymbol(symbol: string): Promise<Stock | null> {
    const q = query(
      collection(db, COLLECTIONS.STOCKS),
      where('symbol', '==', symbol.toUpperCase())
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return convertFirestoreDoc(snapshot.docs[0]) as Stock;
  },

  async create(data: Partial<Stock>): Promise<Stock> {
    const docData = {
      symbol: (data.symbol || '').toUpperCase(),
      name: data.name || '',
      sector: data.sector || '',
      industry: data.industry || '',
      exchange: data.exchange || '',
      currency: data.currency || 'USD',
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.STOCKS), docData);
    const docSnap = await getDoc(docRef);
    return convertFirestoreDoc(docSnap) as Stock;
  },

  async getOrCreate(data: Partial<Stock>): Promise<Stock> {
    const existing = await this.getBySymbol(data.symbol || '');
    if (existing) return existing;
    return await this.create(data);
  },
};

// TRANSACTIONS
export const transactionsService = {
  async getByPortfolio(portfolioId: string): Promise<Transaction[]> {
    const q = query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      where('portfolio_id', '==', portfolioId),
      orderBy('transaction_date', 'asc')
    );
    const snapshot = await getDocs(q);
    
    // Get stock details for each transaction
    const transactions = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const txn = convertFirestoreDoc(docSnap) as Transaction;
        if (txn.stock_id) {
          const stock = await stocksService.getById(txn.stock_id);
          return { ...txn, stock };
        }
        return txn;
      })
    );
    
    return transactions;
  },

  async create(data: Partial<Transaction>): Promise<Transaction> {
    const docData = {
      portfolio_id: data.portfolio_id || '',
      stock_id: data.stock_id || '',
      transaction_type: data.transaction_type || 'buy',
      quantity: data.quantity || 0,
      price: data.price || 0,
      fees: data.fees || 0,
      transaction_date: data.transaction_date ? Timestamp.fromDate(new Date(data.transaction_date)) : Timestamp.now(),
      notes: data.notes || '',
      created_at: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.TRANSACTIONS), docData);
    const docSnap = await getDoc(docRef);
    return convertFirestoreDoc(docSnap) as Transaction;
  },

  async update(id: string, data: Partial<Transaction>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TRANSACTIONS, id);
    const updateData: any = { ...data };
    if (data.transaction_date) {
      updateData.transaction_date = Timestamp.fromDate(new Date(data.transaction_date));
    }
    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.TRANSACTIONS, id));
  },
};

// STOCK PRICES
export const stockPricesService = {
  async getByStock(stockId: string, startDate?: Date, endDate?: Date): Promise<StockPrice[]> {
    const constraints: QueryConstraint[] = [
      where('stock_id', '==', stockId),
      orderBy('date', 'desc'),
    ];

    if (startDate) {
      constraints.push(where('date', '>=', Timestamp.fromDate(startDate)));
    }
    if (endDate) {
      constraints.push(where('date', '<=', Timestamp.fromDate(endDate)));
    }

    const q = query(collection(db, COLLECTIONS.STOCK_PRICES), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => convertFirestoreDoc(doc) as StockPrice);
  },

  async create(data: Partial<StockPrice>): Promise<StockPrice> {
    const docData = {
      stock_id: data.stock_id || '',
      date: data.date ? Timestamp.fromDate(new Date(data.date)) : Timestamp.now(),
      open: data.open || 0,
      high: data.high || 0,
      low: data.low || 0,
      close: data.close || 0,
      volume: data.volume || 0,
      created_at: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.STOCK_PRICES), docData);
    const docSnap = await getDoc(docRef);
    return convertFirestoreDoc(docSnap) as StockPrice;
  },
};

// PORTFOLIO SNAPSHOTS
export const portfolioSnapshotsService = {
  async getByPortfolio(portfolioId: string): Promise<PortfolioSnapshot[]> {
    const q = query(
      collection(db, COLLECTIONS.PORTFOLIO_SNAPSHOTS),
      where('portfolio_id', '==', portfolioId),
      orderBy('snapshot_date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => convertFirestoreDoc(doc) as PortfolioSnapshot);
  },

  async create(data: Partial<PortfolioSnapshot>): Promise<PortfolioSnapshot> {
    const docData = {
      portfolio_id: data.portfolio_id || '',
      snapshot_date: data.snapshot_date ? Timestamp.fromDate(new Date(data.snapshot_date)) : Timestamp.now(),
      total_value: data.total_value || 0,
      cash_balance: data.cash_balance || 0,
      total_return: data.total_return || 0,
      created_at: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.PORTFOLIO_SNAPSHOTS), docData);
    const docSnap = await getDoc(docRef);
    return convertFirestoreDoc(docSnap) as PortfolioSnapshot;
  },
};

// Helper function to get stock by ID (used internally)
stocksService.getById = async (id: string): Promise<Stock | null> => {
  const docSnap = await getDoc(doc(db, COLLECTIONS.STOCKS, id));
  return convertFirestoreDoc(docSnap) as Stock | null;
};
