import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';

interface TableViewProps {
  data: any;
  title?: string;
}

const MAX_CELL_WIDTH = 150; // Maximum width for a cell
const SCREEN_WIDTH = Dimensions.get('window').width - 80; // Account for padding and margins

export default function TableView({ data, title }: TableViewProps) {
  // If data is null or undefined, return nothing
  if (data === null || data === undefined) {
    return <Text style={styles.errorText}>No table data available</Text>;
  }

  // Handle different data formats
  let tableData: any[] = [];
  let headers: string[] = [];

  // Case 1: Array of objects (most common format from APIs)
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    tableData = data;
    headers = Object.keys(data[0]);
  } 
  // Case 2: Object with arrays as values (column-based data)
  else if (!Array.isArray(data) && typeof data === 'object') {
    headers = Object.keys(data);
    
    // Find the maximum length of arrays
    const maxLength = Math.max(...headers.map(h => 
      Array.isArray(data[h]) ? data[h].length : 0
    ));
    
    // Convert to row-based format
    for (let i = 0; i < maxLength; i++) {
      const row: any = {};
      headers.forEach(header => {
        row[header] = Array.isArray(data[header]) && i < data[header].length 
          ? data[header][i] 
          : '';
      });
      tableData.push(row);
    }
  } 
  // Case 3: Simple array (single column)
  else if (Array.isArray(data)) {
    const header = 'Value';
    headers = [header];
    tableData = data.map(value => ({ [header]: value }));
  }
  // If we couldn't determine a format, show an error
  else {
    return <Text style={styles.errorText}>Unsupported table format</Text>;
  }

  // Calculate appropriate cell widths based on content
  const calculateColumnWidth = (header: string) => {
    // Calculate based on header length
    let width = Math.min(header.length * 12, MAX_CELL_WIDTH);
    
    // Also consider value lengths
    tableData.forEach(row => {
      const cellValue = row[header]?.toString() || '';
      width = Math.max(width, Math.min(cellValue.length * 8, MAX_CELL_WIDTH));
    });
    
    return width;
  };

  const columnWidths = headers.reduce((acc, header) => {
    acc[header] = calculateColumnWidth(header);
    return acc;
  }, {} as Record<string, number>);

  // Make sure table isn't wider than screen for small data sets
  const totalWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);
  const shouldScaleDown = totalWidth < SCREEN_WIDTH && headers.length <= 3;
  
  // Format cell value for display
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      // Format numbers with commas and up to 2 decimal places
      return value.toLocaleString(undefined, { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }
    return value.toString();
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.tableTitle}>{title}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={shouldScaleDown ? { width: SCREEN_WIDTH } : undefined}>
          {/* Table Headers */}
          <View style={styles.headerRow}>
            {headers.map((header, index) => (
              <View 
                key={`header-${index}`} 
                style={[
                  styles.headerCell,
                  { width: shouldScaleDown ? `${100 / headers.length}%` : columnWidths[header] }
                ]}
              >
                <Text style={styles.headerText} numberOfLines={2}>{header}</Text>
              </View>
            ))}
          </View>

          {/* Table Rows */}
          {tableData.map((row: any, rowIndex: number) => (
            <View key={`row-${rowIndex}`} style={styles.row}>
              {headers.map((header, cellIndex) => (
                <View 
                  key={`cell-${rowIndex}-${cellIndex}`} 
                  style={[
                    styles.cell,
                    rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow,
                    { width: shouldScaleDown ? `${100 / headers.length}%` : columnWidths[header] }
                  ]}
                >
                  <Text style={styles.cellText} numberOfLines={3}>
                    {formatCellValue(row[header])}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  headerCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    minWidth: 80,
  },
  headerText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
  },
  evenRow: {
    backgroundColor: '#ffffff',
  },
  oddRow: {
    backgroundColor: '#f9f9f9',
  },
  cell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    minWidth: 80,
  },
  cellText: {
    color: '#333',
    fontSize: 12,
  },
  errorText: {
    color: 'red',
    padding: 10,
    fontSize: 12,
  },
}); 