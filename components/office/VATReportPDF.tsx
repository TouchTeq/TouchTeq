'use client';

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register a clean font if possible, or use standard ones
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 20,
    marginBottom: 30,
  },
  logoContainer: {
    flexDirection: 'column',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'black',
    color: '#111827',
  },
  logoSubtext: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  businessDetails: {
    textAlign: 'right',
  },
  businessName: {
    fontWeight: 'bold',
    fontSize: 11,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'black',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 5,
    color: '#111827',
  },
  periodDates: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 20,
  },
  summaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flexDirection: 'column',
  },
  summaryLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#64748b',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  netBox: {
    backgroundColor: '#111827',
    padding: 15,
    borderRadius: 6,
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  netValue: {
    color: '#f97316',
    fontSize: 20,
    fontWeight: 'black',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#111827',
    marginBottom: 10,
    marginTop: 20,
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'black',
    textTransform: 'uppercase',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: 8,
  },
  tableCell: {
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#94a3b8',
    fontSize: 8,
  },
});

const formatCurrency = (amount: number) => {
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
};

export default function VATReportPDF({ period, invoices, expenses, businessProfile }: any) {
  const netDue = Number(period.output_vat) - Number(period.input_vat);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>TOUCHTEQ</Text>
            <Text style={styles.logoSubtext}>Engineering Services</Text>
          </View>
          <View style={styles.businessDetails}>
            <Text style={styles.businessName}>{businessProfile.legal_name}</Text>
            <Text>VAT Reg No: {businessProfile.vat_number || '4940295068'}</Text>
            <Text>Reg No: {businessProfile.registration_number}</Text>
            <Text>{businessProfile.email}</Text>
          </View>
        </View>

        <Text style={styles.title}>VAT Return Working Paper</Text>
        <Text style={styles.periodDates}>Period: {format(new Date(period.period_start), 'dd MMMM yyyy')} — {format(new Date(period.period_end), 'dd MMMM yyyy')}</Text>

        <View style={styles.summaryBox}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Output VAT</Text>
              <Text style={styles.summaryValue}>{formatCurrency(Number(period.output_vat))}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Input VAT</Text>
              <Text style={styles.summaryValue}>{formatCurrency(Number(period.input_vat))}</Text>
            </View>
          </View>
          <View style={styles.netBox}>
            <Text style={styles.netLabel}>Net VAT Payable to SARS</Text>
            <Text style={styles.netValue}>{formatCurrency(netDue)}</Text>
          </View>
          <Text style={{ fontSize: 8, color: '#64748b', marginTop: 15, fontStyle: 'italic' }}>
            The net VAT payable amount of {formatCurrency(netDue)} should be declared on your VAT201 return for the period. Submit via SARS eFiling.
          </Text>
        </View>

        {/* Output VAT Detail */}
        <Text style={styles.sectionTitle}>Output VAT Detail (Invoices)</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>INV No</Text>
            <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Client</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Date</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Excl VAT</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>VAT</Text>
          </View>
          {invoices.map((inv: any) => (
            <View key={inv.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '20%' }]}>{inv.invoice_number}</Text>
              <Text style={[styles.tableCell, { width: '35%' }]}>{inv.clients?.company_name}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>{inv.issue_date}</Text>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{formatCurrency(Number(inv.subtotal))}</Text>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{formatCurrency(Number(inv.vat_amount))}</Text>
            </View>
          ))}
          <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
            <Text style={[styles.tableCell, { width: '70%', fontWeight: 'bold' }]}>TOTAL OUTPUT VAT</Text>
            <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{formatCurrency(invoices.reduce((sum: number, i: any) => sum + Number(i.subtotal), 0))}</Text>
            <Text style={[styles.tableCell, { width: '15%', textAlign: 'right', fontWeight: 'bold' }]}>{formatCurrency(Number(period.output_vat))}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>VAT Working Paper — {businessProfile.trading_name}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        {/* Input VAT Detail */}
        <Text style={styles.sectionTitle}>Input VAT Detail (Expenses)</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Date</Text>
            <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Supplier</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Category</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Excl VAT</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>VAT</Text>
          </View>
          {expenses.map((ex: any) => (
            <View key={ex.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '20%' }]}>{ex.expense_date}</Text>
              <Text style={[styles.tableCell, { width: '35%' }]}>{ex.supplier_name}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>{ex.category}</Text>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{formatCurrency(Number(ex.amount_exclusive))}</Text>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{formatCurrency(Number(ex.input_vat_amount))}</Text>
            </View>
          ))}
          <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
            <Text style={[styles.tableCell, { width: '70%', fontWeight: 'bold' }]}>TOTAL INPUT VAT</Text>
            <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{formatCurrency(expenses.reduce((sum: number, e: any) => sum + Number(e.amount_exclusive), 0))}</Text>
            <Text style={[styles.tableCell, { width: '15%', textAlign: 'right', fontWeight: 'bold' }]}>{formatCurrency(Number(period.input_vat))}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>This document is prepared for record keeping purposes. VAT Reg No: {businessProfile.vat_number}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
