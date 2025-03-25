import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';

const Dashboard = () => {
  // Sample financial KPI data
  const financialKPIs = [
    { title: 'Net Sales', value: '$5.2M', change: '+8.5%', color: '#4CAF50' },
    { title: 'Gross Margin', value: '42.3%', change: '+2.1%', color: '#2196F3' },
    { title: 'EBITDA', value: '$1.8M', change: '+5.2%', color: '#9C27B0' },
    { title: 'Operating Income', value: '$1.2M', change: '+3.7%', color: '#FF9800' },
  ];

  // Sample monthly trend data
  const monthlyTrends = [
    { month: 'January', netSales: '$4.8M', cogs: '$2.8M' },
    { month: 'February', netSales: '$4.9M', cogs: '$2.85M' },
    { month: 'March', netSales: '$5.0M', cogs: '$2.9M' },
    { month: 'April', netSales: '$5.1M', cogs: '$2.95M' },
    { month: 'May', netSales: '$5.15M', cogs: '$3.0M' },
    { month: 'June', netSales: '$5.2M', cogs: '$3.1M' },
  ];

  // Sample detailed metrics
  const detailedMetrics = [
    {
      category: 'Income Statement',
      metrics: [
        { title: 'Net Sales', value: '$5.2M', change: '+8.5%' },
        { title: 'COGS', value: '$3.1M', change: '+6.2%' },
        { title: 'Gross Margin', value: '$2.1M', change: '+12.3%' },
        { title: 'SG&A', value: '$900K', change: '+3.1%' },
        { title: 'Operating Income', value: '$1.2M', change: '+15.4%' },
      ],
    },
    {
      category: 'Ratios',
      metrics: [
        { title: 'Gross Margin %', value: '42.3%', change: '+2.1%' },
        { title: 'Operating Margin %', value: '23.1%', change: '+1.4%' },
        { title: 'EBITDA Margin', value: '34.6%', change: '+1.8%' },
        { title: 'Working Capital', value: '$2.4M', change: '+5.2%' },
      ],
    },
  ];

  // KPI Card Component
  const KPICard = ({ title, value, change, color }) => (
    <TouchableOpacity style={[styles.kpiCard, { borderLeftColor: color }]}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={[styles.kpiChange, { color: change.includes('+') ? '#4CAF50' : '#F44336' }]}>
        {change}
      </Text>
    </TouchableOpacity>
  );

  // Trend Row Component
  const TrendRow = ({ month, netSales, cogs }) => (
    <View style={styles.trendRow}>
      <Text style={styles.trendMonth}>{month}</Text>
      <Text style={styles.trendValue}>{netSales}</Text>
      <Text style={styles.trendValue}>{cogs}</Text>
    </View>
  );

  // Metric Row Component
  const MetricRow = ({ title, value, change }) => (
    <View style={styles.metricRow}>
      <Text style={styles.metricTitle}>{title}</Text>
      <View style={styles.metricValues}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text 
          style={[
            styles.metricChange,
            { color: change.includes('+') ? '#4CAF50' : '#F44336' }
          ]}
        >
          {change}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Financial Dashboard</Text>
          <Text style={styles.headerSubtitle}>June 2024</Text>
        </View>

        {/* KPIs Section */}
        <View style={styles.kpiContainer}>
          {financialKPIs.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              color={kpi.color}
            />
          ))}
        </View>

        {/* Monthly Trends Section */}
        <View style={styles.trendSection}>
          <Text style={styles.sectionTitle}>Monthly Trends</Text>
          <View style={styles.trendHeader}>
            <Text style={styles.trendHeaderText}>Month</Text>
            <Text style={styles.trendHeaderText}>Net Sales</Text>
            <Text style={styles.trendHeaderText}>COGS</Text>
          </View>
          {monthlyTrends.map((trend, index) => (
            <TrendRow
              key={index}
              month={trend.month}
              netSales={trend.netSales}
              cogs={trend.cogs}
            />
          ))}
        </View>

        {/* Detailed Metrics Sections */}
        {detailedMetrics.map((section, index) => (
          <View key={index} style={styles.metricsSection}>
            <Text style={styles.sectionTitle}>{section.category}</Text>
            <View style={styles.metricsContainer}>
              {section.metrics.map((metric, metricIndex) => (
                <MetricRow
                  key={metricIndex}
                  title={metric.title}
                  value={metric.value}
                  change={metric.change}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    justifyContent: 'space-between',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    width: Dimensions.get('window').width / 2 - 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderLeftWidth: 4,
  },
  kpiTitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  kpiChange: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 5,
  },
  trendSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginVertical: 10,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  trendHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
    textAlign: 'left',
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  trendMonth: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  trendValue: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'left',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  metricsSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  metricsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  metricTitle: {
    fontSize: 15,
    color: '#333333',
  },
  metricValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  metricChange: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Dashboard;