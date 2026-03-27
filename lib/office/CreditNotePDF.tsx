'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

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
    padding: 50,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#f97316', // Orange for Credit Notes
    paddingBottom: 20,
    alignItems: 'center',
  },
  logoSection: {
    flexDirection: 'column',
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 2,
  },
  titleSection: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316',
  },
  meta: {
    fontSize: 11,
    color: '#0f172a',
    marginTop: 5,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 50,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 1,
  },
  address: {
    lineHeight: 1.4,
  },
  bold: {
    fontWeight: 'bold',
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    padding: 10,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: 10,
    minHeight: 40,
    alignItems: 'center',
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right', fontWeight: 'bold' },
  
  summary: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryBox: {
    width: 200,
    borderTopWidth: 2,
    borderTopColor: '#f97316',
    paddingTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  reasonBox: {
    marginTop: 50,
    padding: 15,
    backgroundColor: '#fff7ed',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  reasonLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#9a3412',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 50,
    right: 50,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
    lineHeight: 1.5,
  }
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-ZA', { 
    style: 'currency', 
    currency: 'ZAR',
    minimumFractionDigits: 2 
  }).format(val);
};

export const CreditNotePDF = ({ cn, client, invoice }: { cn: any, client: any, invoice?: any }) => {
  const lineItems = cn.credit_note_items || [];
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.brandName}>TOUCH TEQNIQUES</Text>
            <Text style={styles.brandSub}>Engineering Services</Text>
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.title}>CREDIT NOTE</Text>
            <Text style={styles.meta}>{cn.credit_note_number}</Text>
            <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
              Date: {new Date(cn.issue_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.label}>Bill To:</Text>
            <View style={styles.address}>
              <Text style={styles.bold}>{client.company_name}</Text>
              {client.physical_address && <Text>{client.physical_address}</Text>}
              {client.vat_number && <Text>VAT: {client.vat_number}</Text>}
            </View>
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>Details:</Text>
            <View style={styles.address}>
              {invoice && <Text>Orig. Invoice: <Text style={styles.bold}>{invoice.invoice_number}</Text></Text>}
              <Text>Reason: <Text style={styles.bold}>{cn.reason}</Text></Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>DESCRIPTION</Text>
            <Text style={styles.colQty}>QTY</Text>
            <Text style={styles.colPrice}>UNIT PRICE</Text>
            <Text style={styles.colTotal}>TOTAL</Text>
          </View>

          {lineItems.map((item: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.line_total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text>Subtotal</Text>
              <Text>{formatCurrency(cn.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>VAT (15%)</Text>
              <Text>{formatCurrency(cn.vat_amount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Credit</Text>
              <Text style={styles.totalValue}>{formatCurrency(cn.total)}</Text>
            </View>
          </View>
        </View>

        {cn.notes && (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>Internal Notes</Text>
            <Text style={{ lineHeight: 1.5, color: '#9a3412' }}>{cn.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This Credit Note is issued against account balance settlements or returns.
          </Text>
          <Text style={styles.footerText}>
            Touch Teqniques • accounts@touchteq.co.za • 072 552 2110
          </Text>
        </View>
      </Page>
    </Document>
  );
};
