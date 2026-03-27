'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Standard fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.1.266/standard_fonts/Helvetica.dfont' },
    { src: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.1.266/standard_fonts/Helvetica-Bold.dfont', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a', // Navy blue from Branding
    paddingBottom: 20,
  },
  logoSection: {
    flexDirection: 'column',
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 2,
  },
  companyInfo: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 5,
    lineHeight: 1.4,
  },
  titleSection: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  meta: {
    fontSize: 10,
    color: '#0f172a',
    marginTop: 5,
    fontWeight: 'bold',
  },
  rangeLabel: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 40,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 5,
    letterSpacing: 1,
  },
  address: {
    lineHeight: 1.4,
    fontSize: 9,
  },
  bold: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 7,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 10,
    minHeight: 30,
    alignItems: 'center',
  },
  colDate: { flex: 1.2 },
  colRef: { flex: 1.5 },
  colDesc: { flex: 3 },
  colDebit: { flex: 1.5, textAlign: 'right' },
  colCredit: { flex: 1.5, textAlign: 'right' },
  colBalance: { flex: 1.5, textAlign: 'right', fontWeight: 'bold' },
  
  summary: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryBox: {
    width: 200,
    borderTopWidth: 2,
    borderTopColor: '#f97316', // Orange highlight for Balance
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  closingBalance: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
    lineHeight: 1.5,
  }
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-ZA', { 
    style: 'currency', 
    currency: 'ZAR',
    minimumFractionDigits: 2 
  }).format(val).replace('ZAR', 'R');
};

interface StatementTransaction {
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface ClientStatementPDFProps {
  client: any;
  transactions: StatementTransaction[];
  openingBalance: number;
  closingBalance: number;
  startDate: string;
  endDate: string;
}

export const ClientStatementPDF = ({ 
  client, 
  transactions, 
  openingBalance, 
  closingBalance,
  startDate,
  endDate
}: ClientStatementPDFProps) => {
  const today = new Date();
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.brandName}>TOUCH TEQNIQUES</Text>
            <Text style={styles.brandSub}>Engineering Services</Text>
            <View style={styles.companyInfo}>
              <Text>91 Sir George Grey Street, Horison, Roodepoort</Text>
              <Text>Johannesburg, 1724</Text>
              <Text>VAT No: 4940295068</Text>
            </View>
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.title}>STATEMENT</Text>
            <Text style={styles.meta}>Account Summary</Text>
            <Text style={styles.rangeLabel}>
              Period: {format(new Date(startDate), 'dd MMM yyyy')} - {format(new Date(endDate), 'dd MMM yyyy')}
            </Text>
          </View>
        </View>

        {/* Client Info Grid */}
        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.label}>Statement For:</Text>
            <View style={styles.address}>
              <Text style={styles.bold}>{client.company_name}</Text>
              {client.physical_address && <Text>{client.physical_address}</Text>}
              {client.vat_number && <Text>VAT: {client.vat_number}</Text>}
              {client.contact_person && <Text>Attn: {client.contact_person}</Text>}
            </View>
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>Summary:</Text>
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#64748b' }}>Opening Balance:</Text>
                <Text style={styles.bold}>{formatCurrency(openingBalance)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#64748b' }}>Closing Balance:</Text>
                <Text style={{ ...styles.bold, color: '#f97316' }}>{formatCurrency(closingBalance)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ color: '#64748b' }}>Statement Date:</Text>
                <Text>{format(today, 'dd MMM yyyy')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Transaction Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>DATE</Text>
            <Text style={styles.colRef}>REFERENCE</Text>
            <Text style={styles.colDesc}>DESCRIPTION</Text>
            <Text style={styles.colDebit}>DEBIT</Text>
            <Text style={styles.colCredit}>CREDIT</Text>
            <Text style={styles.colBalance}>BALANCE</Text>
          </View>

          {/* Opening Balance Row */}
          <View style={styles.tableRow}>
            <Text style={styles.colDate}>{format(new Date(startDate), 'dd/MM/yyyy')}</Text>
            <Text style={styles.colRef}>--</Text>
            <Text style={{ ...styles.colDesc, fontStyle: 'italic' }}>Opening Balance</Text>
            <Text style={styles.colDebit}>--</Text>
            <Text style={styles.colCredit}>--</Text>
            <Text style={styles.colBalance}>{formatCurrency(openingBalance)}</Text>
          </View>

          {transactions.map((tx, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDate}>{format(new Date(tx.date), 'dd/MM/yyyy')}</Text>
              <Text style={styles.colRef}>{tx.reference}</Text>
              <Text style={styles.colDesc}>{tx.description}</Text>
              <Text style={styles.colDebit}>{tx.debit > 0 ? formatCurrency(tx.debit) : '--'}</Text>
              <Text style={styles.colCredit}>{tx.credit > 0 ? formatCurrency(tx.credit) : '--'}</Text>
              <Text style={styles.colBalance}>{formatCurrency(tx.balance)}</Text>
            </View>
          ))}
        </View>

        {/* Summary Footer */}
        <View style={styles.summary}>
          <View style={styles.summaryBox}>
            <View style={styles.totalRow}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Closing Balance</Text>
              <Text style={styles.closingBalance}>{formatCurrency(closingBalance)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a statement of your account as at {format(today, 'dd MMMM yyyy')}. Please contact accounts@touchteq.co.za for queries.
          </Text>
          <Text style={{ ...styles.footerText, marginTop: 4 }}>
            Touch Teqniques Engineering Services • accounts@touchteq.co.za • 072 552 2110
          </Text>
        </View>
      </Page>
    </Document>
  );
};
