import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Dimensions, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';

// FMP API Configuration
const FMP_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_FMP_API_KEY || '',
  BASE_URL: 'https://financialmodelingprep.com/api/v3'
};

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changesPercentage: number;
  dayLow: number;
  dayHigh: number;
  yearLow: number;
  yearHigh: number;
  marketCap: number;
  volume: number;
  name: string;
  pe: number;
  eps: number;
}

interface HistoricalPrice {
  date: string;
  close: number;
}

interface NewsItem {
  title: string;
  text: string;
  url: string;
  publishedDate: string;
  image: string;
  site: string;
}

export default function StockInfo() {
  const [stockData, setStockData] = useState<StockQuote | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalPrice[]>([]);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ChartComponent, setChartComponent] = useState<any>(null);

  useEffect(() => {
    // Dynamically import the appropriate chart library based on platform
    async function loadChartLibrary() {
      try {
        if (Platform.OS === 'web') {
          const recharts = await import('recharts');
          setChartComponent({
            type: 'web',
            components: recharts
          });
        } else {
          const { LineChart } = await import('react-native-chart-kit');
          setChartComponent({
            type: 'mobile',
            components: { LineChart }
          });
        }
      } catch (err) {
        console.error('Error loading chart library:', err);
        setError('Failed to load chart component');
      }
    }

    loadChartLibrary();
  }, []);

  const fetchStockData = async () => {
    try {
      if (!FMP_CONFIG.API_KEY) {
        throw new Error('FMP API key not configured');
      }

      // Fetch current quote
      const quoteResponse = await fetch(
        `${FMP_CONFIG.BASE_URL}/quote/MOS?apikey=${FMP_CONFIG.API_KEY}`
      );

      if (!quoteResponse.ok) {
        throw new Error(`HTTP error! status: ${quoteResponse.status}`);
      }

      const quoteData = await quoteResponse.json();
      if (quoteData && quoteData.length > 0) {
        setStockData(quoteData[0]);
        setError(null);
        
        // If PE or EPS is missing, fetch additional data
        if (quoteData[0].pe === undefined || quoteData[0].eps === undefined) {
          try {
            const profileResponse = await fetch(
              `${FMP_CONFIG.BASE_URL}/profile/MOS?apikey=${FMP_CONFIG.API_KEY}`
            );
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              if (profileData && profileData.length > 0) {
                setStockData(prevData => ({
                  ...prevData!,
                  pe: profileData[0].pe || 0,
                  eps: profileData[0].eps || 0
                }));
              }
            }
          } catch (profileErr) {
            console.error('Error fetching profile data:', profileErr);
          }
        }
      } else {
        throw new Error('No quote data received');
      }

      // Fetch historical data
      const today = new Date();
      const oneYearAgo = new Date(today.setFullYear(today.getFullYear() - 1));
      const fromDate = oneYearAgo.toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];

      const historicalResponse = await fetch(
        `${FMP_CONFIG.BASE_URL}/historical-price-full/MOS?from=${fromDate}&to=${toDate}&apikey=${FMP_CONFIG.API_KEY}`
      );

      if (!historicalResponse.ok) {
        throw new Error(`HTTP error! status: ${historicalResponse.status}`);
      }

      const historicalData = await historicalResponse.json();
      if (historicalData && historicalData.historical) {
        // Use daily data points but ensure they're sorted from oldest to newest
        const dailyData = historicalData.historical
          .sort((a: HistoricalPrice, b: HistoricalPrice) => 
            new Date(a.date).getTime() - new Date(b.date).getTime());
        setHistoricalData(dailyData);
      } else {
        throw new Error('No historical data received');
      }

      // Fetch news data
      try {
        const newsResponse = await fetch(
          `${FMP_CONFIG.BASE_URL}/stock_news?tickers=MOS&limit=5&apikey=${FMP_CONFIG.API_KEY}`
        );

        if (newsResponse.ok) {
          const newsItems = await newsResponse.json();
          setNewsData(newsItems || []);
        } else {
          console.error('Failed to fetch news:', newsResponse.status);
        }
      } catch (newsErr) {
        console.error('Error fetching news data:', newsErr);
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `${(marketCap / 1e12).toFixed(2)}T`;
    }
    if (marketCap >= 1e9) {
      return `${(marketCap / 1e9).toFixed(2)}B`;
    }
    if (marketCap >= 1e6) {
      return `${(marketCap / 1e6).toFixed(2)}M`;
    }
    return formatNumber(marketCap);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatNewsDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const renderChart = () => {
    if (!ChartComponent || historicalData.length === 0) return null;

    if (ChartComponent.type === 'web') {
      const {
        LineChart,
        ResponsiveContainer,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        Line
      } = ChartComponent.components;

      // Use all data points but only show a subset of labels for readability
      const data = [...historicalData].map(item => ({
        date: formatDate(item.date),
        price: item.close
      }));

      return (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ 
                fontSize: 11,
                fontFamily: Platform.OS === 'web' ? '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto' : undefined,
                fill: '#666',
                dy: 10
              }}
              interval={Math.floor(data.length / 6)} // Show approximately 6 labels
              axisLine={{ stroke: '#e0e0e0' }}
              tickLine={{ stroke: '#e0e0e0' }}
            />
            <YAxis 
              tick={{ 
                fontSize: 11,
                fontFamily: Platform.OS === 'web' ? '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto' : undefined,
                fill: '#666',
                dx: -10
              }}
              domain={['auto', 'auto']}
              tickFormatter={(value: number) => `$${value}`}
              axisLine={{ stroke: '#e0e0e0' }}
              tickLine={{ stroke: '#e0e0e0' }}
            />
            <Tooltip 
              formatter={(value: number) => [`$${formatNumber(Number(value))}`, 'Price']}
              labelFormatter={(label: string) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: 4,
                padding: '8px 12px',
                fontSize: 12,
                fontFamily: Platform.OS === 'web' ? '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto' : undefined,
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#007AFF"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#007AFF' }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    } else {
      const { LineChart } = ChartComponent.components;
      
      // For mobile, we need to limit the number of labels to avoid overcrowding
      const labels = [...historicalData].map(data => formatDate(data.date));
      const interval = Math.max(1, Math.floor(labels.length / 6)); // Show approximately 6 labels
      const filteredLabels = labels.filter((_, i) => i % interval === 0);
      
      const chartData = {
        labels: filteredLabels,
        datasets: [{
          data: [...historicalData].map(data => data.close),
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          strokeWidth: 2
        }]
      };

      const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 2,
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: {
          borderRadius: 16
        },
        propsForDots: {
          r: '0',
        },
        // Enhanced styling for mobile
        propsForLabels: {
          fontSize: 11,
          fontWeight: '400',
        },
        formatYLabel: (value: string) => `$${value}`,
        formatXLabel: (value: string) => value.length > 6 ? value.substring(0, 6) : value,
      };

      return (
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 64}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withDots={false}
          withInnerLines={false}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={false}
        />
      );
    }
  };

  const renderNewsItems = () => {
    if (newsData.length === 0) {
      return (
        <View style={styles.noNewsContainer}>
          <Text style={styles.noNewsText}>No recent news available</Text>
        </View>
      );
    }

    return newsData.map((item, index) => (
      <TouchableOpacity 
        key={index} 
        style={[
          styles.newsItem, 
          index < newsData.length - 1 && styles.newsItemBorder
        ]}
        onPress={() => Linking.openURL(item.url)}
      >
        <View style={styles.newsContent}>
          <Text style={styles.newsTitle}>{item.title}</Text>
          <Text style={styles.newsSource}>{item.site} • {formatNewsDate(item.publishedDate)}</Text>
          <Text style={styles.newsSummary}>{truncateText(item.text, 150)}</Text>
        </View>
        {item.image && (
          <Image 
            source={{ uri: item.image }} 
            style={styles.newsImage}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>
    ));
  };

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
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!stockData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No stock data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.symbol}>{stockData.symbol}</Text>
        <Text style={styles.name}>{stockData.name}</Text>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.price}>${formatNumber(stockData.price)}</Text>
        <Text style={[
          styles.change,
          stockData.change >= 0 ? styles.positive : styles.negative
        ]}>
          {stockData.change >= 0 ? '+' : ''}{formatNumber(stockData.change)} ({formatNumber(stockData.changesPercentage)}%)
        </Text>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Day's Range</Text>
            <Text style={styles.value}>${formatNumber(stockData.dayLow)} - ${formatNumber(stockData.dayHigh)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>52 Week Range</Text>
            <Text style={styles.value}>${formatNumber(stockData.yearLow)} - ${formatNumber(stockData.yearHigh)}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Market Cap</Text>
            <Text style={styles.value}>${formatMarketCap(stockData.marketCap)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Volume</Text>
            <Text style={styles.value}>{new Intl.NumberFormat('en-US').format(stockData.volume)}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>P/E Ratio</Text>
            <Text style={styles.value}>{stockData.pe ? formatNumber(stockData.pe) : 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>EPS</Text>
            <Text style={styles.value}>{stockData.eps ? `$${formatNumber(stockData.eps)}` : 'N/A'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>52 Week Price History</Text>
        {renderChart()}
      </View>

      <View style={styles.newsContainer}>
        <Text style={styles.newsHeader}>Recent News</Text>
        {renderNewsItems()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 0,
    padding: 16,
    margin: 0,
    ...Platform.select({
      web: {
        boxShadow: 'none',
      },
      default: {
        elevation: 0,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
    }),
  },
  header: {
    marginBottom: 12,
  },
  symbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  name: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  priceContainer: {
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  change: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 4,
  },
  positive: {
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },
  infoGrid: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    marginHorizontal: 8,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
  },
  chartContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    minHeight: 280,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  newsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  newsHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  newsItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'flex-start',
  },
  newsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  newsContent: {
    flex: 1,
    marginRight: 12,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
    lineHeight: 22,
  },
  newsSource: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  newsSummary: {
    fontSize: 14,
    color: '#444444',
    lineHeight: 20,
  },
  newsImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  noNewsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noNewsText: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
  },
}); 