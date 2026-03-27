import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts? Or use defaults. Native PDF fonts are safer.
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontSize: 10,
    color: '#333333',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '2pt solid #f97316',
    paddingBottom: 20,
    marginBottom: 30,
  },
  logoContainer: {
    flexDirection: 'column',
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  businessDetails: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 4,
  },
  reportTitleContainer: {
    alignItems: 'flex-end',
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'black',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  reportDate: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    padding: 8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    border: '1pt solid #e2e8f0',
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 7,
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  table: {
    width: 'auto',
    marginTop: 10,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    minHeight: 25,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
    borderBottomColor: '#cbd5e1',
    borderBottomWidth: 2,
  },
  tableCell: {
    padding: 6,
  },
  tableCellHeader: {
    fontWeight: 'bold',
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#475569',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1pt solid #e2e8f0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#94a3b8',
  },
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val).replace('ZAR', 'R ');
};

interface BaseReportProps {
  title: string;
  subtitle: string;
  summary: { label: string; value: string | number; color?: string }[];
  tableHeaders: string[];
  tableData: any[][];
  columnWidths: number[];
}

export const BaseReportPDF = ({ title, subtitle, summary, tableHeaders, tableData, columnWidths, profile }: BaseReportProps & { profile?: any }) => {
  const primaryColor = profile?.document_settings?.primary_color || '#f97316';
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: primaryColor }]}>
          <View style={styles.logoContainer}>
            {profile?.logo_url ? (
              <Image src={profile.logo_url} style={{ width: 100, height: 40, objectFit: 'contain', marginBottom: 5 }} />
            ) : (
              <Text style={styles.businessName}>{profile?.legal_name || 'Touch Teqniques Engineering Services'}</Text>
            )}
            <Text style={styles.businessDetails}>VAT Reg No: {profile?.vat_number || '4940295068'} | Reg: {profile?.registration_number || '2017/149740/07'}</Text>
            <Text style={styles.businessDetails}>{profile?.physical_address?.split('\n')[0]}</Text>
          </View>
          <View style={styles.reportTitleContainer}>
            <Text style={styles.reportTitle}>{title}</Text>
            <Text style={styles.reportDate}>{subtitle}</Text>
            <Text style={styles.reportDate}>Generated: {new Date().toLocaleDateString('en-ZA')}</Text>
          </View>
        </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        {summary.map((item, i) => (
          <View key={i} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{item.label}</Text>
            <Text style={[styles.summaryValue, item.color ? { color: item.color } : {}]}>
              {typeof item.value === 'number' ? formatCurrency(item.value) : item.value}
            </Text>
          </View>
        ))}
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          {tableHeaders.map((header, i) => (
            <View key={i} style={[styles.tableCell, { width: `${columnWidths[i]}%` }]}>
              <Text style={styles.tableCellHeader}>{header}</Text>
            </View>
          ))}
        </View>
        {tableData.map((row, i) => (
          <View key={i} style={styles.tableRow} wrap={false}>
            {row.map((cell, j) => (
              <View key={j} style={[styles.tableCell, { width: `${columnWidths[j]}%` }]}>
                <Text style={{ fontSize: 8 }}>{cell}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Confidential — Touch Teqniques Engineering Services — Generated by Touch Teq Office</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  </Document>
);
};
