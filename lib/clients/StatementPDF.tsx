'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

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
    color: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 3,
    borderBottomColor: '#F97316', // Orange accent
    backgroundColor: '#0F172A', // Navy background
    padding: 20,
    marginHorizontal: -40,
    marginTop: -40,
  },
  logoSection: {
    flexDirection: 'column',
    gap: 4,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 8,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  titleSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  periodText: {
    fontSize: 8,
    color: '#F97316',
    fontWeight: 'bold',
    marginTop: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 30,
    marginTop: 20,
  },
  detailsCol: {
    flex: 1,
  },
  label: {
    fontSize: 7,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  addressBox: {
    lineHeight: 1.4,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#0F172A',
    fontSize: 10,
    marginBottom: 2,
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 15,
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 7,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    padding: 8,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    padding: 8,
    alignItems: 'center',
  },
  colDate: { width: '12%' },
  colRef: { width: '18%' },
  colDesc: { width: '30%' },
  colDebit: { width: '13%', textAlign: 'right' },
  colCredit: { width: '13%', textAlign: 'right' },
  colBalance: { width: '14%', textAlign: 'right', fontWeight: 'bold' },
  
  openingRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 15,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#94A3B8',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 8,
    color: '#475569',
    fontWeight: 'bold',
  }
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 2 }).format(val);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const StatementPDF = ({ data }: { data: any }) => {
  const { business, client, transactions, openingBalance, closingBalance, periodStart, periodEnd, generatedAt } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Navy & Orange Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.brandName}>TOUCH TEQNIQUES</Text>
            <Text style={styles.headerSub}>Engineering Services</Text>
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.title}>STATEMENT</Text>
            <Text style={styles.periodText}>
              {formatDate(periodStart)} - {formatDate(periodEnd)}
            </Text>
          </View>
        </View>

        {/* Address Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailsCol}>
            <Text style={styles.label}>Statement From:</Text>
            <View style={styles.addressBox}>
              <Text style={styles.boldText}>Touch Teqniques Engineering Services</Text>
              <Text>91 Sir George Grey Street, Horison</Text>
              <Text>Roodepoort, Johannesburg, 1724</Text>
              <Text>VAT No: 4940295068</Text>
              <Text>Email: accounts@touchteq.co.za</Text>
            </View>
          </View>

          <View style={styles.detailsCol}>
            <Text style={styles.label}>Statement To:</Text>
            <View style={styles.addressBox}>
              <Text style={styles.boldText}>{client.company_name}</Text>
              {client.contact_person && <Text>Attn: {client.contact_person}</Text>}
              <Text>{client.physical_address}</Text>
              {client.vat_number && <Text>VAT No: {client.vat_number}</Text>}
              {client.email && <Text>Email: {client.email}</Text>}
            </View>
          </View>
        </View>

        {/* Financial Summary Box */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Opening Balance</Text>
            <Text style={styles.summaryValue}>R {formatCurrency(openingBalance)}</Text>
          </View>
          <View style={{ width: 1, backgroundColor: '#E2E8F0' }} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Range Movements</Text>
            <Text style={styles.summaryValue}>
              R {formatCurrency(transactions.reduce((s: any, t: any) => s + t.debit - t.credit, 0))}
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: '#E2E8F0' }} />
          <View style={[styles.summaryItem, { backgroundColor: '#FFF7ED', borderRadius: 4, padding: 5, margin: -5 }]}>
            <Text style={[styles.summaryLabel, { color: '#F97316' }]}>Closing Balance</Text>
            <Text style={[styles.summaryValue, { color: '#F97316' }]}>R {formatCurrency(closingBalance)}</Text>
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
          <View style={styles.openingRow}>
            <Text style={styles.colDate}>{formatDate(periodStart)}</Text>
            <Text style={styles.colRef}>O/BAL</Text>
            <Text style={styles.colDesc}>Opening Balance Brought Forward</Text>
            <Text style={styles.colDebit}>-</Text>
            <Text style={styles.colCredit}>-</Text>
            <Text style={styles.colBalance}>{formatCurrency(openingBalance)}</Text>
          </View>

          {transactions.map((t: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDate}>{formatDate(t.date)}</Text>
              <Text style={styles.colRef}>{t.ref}</Text>
              <Text style={styles.colDesc}>{t.desc}</Text>
              <Text style={styles.colDebit}>{t.debit > 0 ? formatCurrency(t.debit) : '-'}</Text>
              <Text style={styles.colCredit}>{t.credit > 0 ? formatCurrency(t.credit) : '-'}</Text>
              <Text style={styles.colBalance}>{formatCurrency(t.balance)}</Text>
            </View>
          ))}
        </View>

        {/* Final Balance Footer in Body */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
          <View style={{ width: 200, padding: 10, borderTopWidth: 2, borderTopColor: '#0F172A' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ fontWeight: 'bold' }}>Closing Balance Due:</Text>
              <Text style={{ fontWeight: 'bold', color: '#F97316' }}>R {formatCurrency(closingBalance)}</Text>
            </View>
          </View>
        </View>

        {/* Fixed Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated at {new Date(generatedAt).toLocaleString('en-ZA')} • Page 1 of 1
          </Text>
          <Text style={styles.contactText}>
            This is a statement of your account as at {formatDate(new Date().toISOString())}. 
            Please contact accounts@touchteq.co.za for queries.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
