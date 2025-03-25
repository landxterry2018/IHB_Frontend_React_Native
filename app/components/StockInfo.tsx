import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

// FMP API Configuration
const FMP_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_FMP_API_KEY || '',
  BASE_URL: 'https://financialmodelingprep.com/api/v3',
};

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changesPercentage: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  volume: number;
}

export default function StockInfo() {
  const [stockData, setStockData] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${FMP_CONFIG.BASE_URL}/quote/MOS?apikey=${FMP_CONFIG.API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.length > 0) {
        setStockData(data[0]);
      } else {
        throw new Error('No stock data available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
      console.error('Error fetching stock data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchStockData, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );
  }

  if (!stockData) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No stock data available</Text>
      </View>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    }
    if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    }
    if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    }
    return `$${formatNumber(marketCap)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.symbol}>{stockData.symbol}</Text>
        <Text style={styles.price}>${formatNumber(stockData.price)}</Text>
        <Text
          style={[
            styles.change,
            stockData.change >= 0 ? styles.positive : styles.negative,
          ]}
        >
          {stockData.change >= 0 ? '+' : ''}
          {formatNumber(stockData.change)} ({formatNumber(stockData.changesPercentage)}%)
        </Text>
      </View>

      <View style={styles.details}>
        <View style={styles.row}>
          <View style={styles.item}>
            <Text style={styles.label}>Day Range</Text>
            <Text style={styles.value}>
              ${formatNumber(stockData.dayLow)} - ${formatNumber(stockData.dayHigh)}
            </Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.label}>Year Range</Text>
            <Text style={styles.value}>
              ${formatNumber(stockData.yearLow)} - ${formatNumber(stockData.yearHigh)}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.item}>
            <Text style={styles.label}>Market Cap</Text>
            <Text style={styles.value}>{formatMarketCap(stockData.marketCap)}</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.label}>Volume</Text>
            <Text style={styles.value}>
              {new Intl.NumberFormat('en-US').format(stockData.volume)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 15,
  },
  symbol: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  change: {
    fontSize: 18,
    fontWeight: '500',
  },
  positive: {
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  item: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  error: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
  },
}); 