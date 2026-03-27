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
    borderBottomColor: '#0f172a',
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
    color: '#0f172a',
  },
  meta: {
    fontSize: 10,
    color: '#1e293b',
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
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 10,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#475569',
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
    borderTopColor: '#0f172a',
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
  notes: {
    marginTop: 50,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
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

export const PurchaseOrderPDF = ({ po }: { po: any }) => {
  const lineItems = po.purchase_order_items || [];
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.brandName}>TOUCH TEQNIQUES</Text>
            <Text style={styles.brandSub}>Engineering Services</Text>
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.title}>PURCHASE ORDER</Text>
            <Text style={styles.meta}>{po.po_number}</Text>
            <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
              Issued: {new Date(po.date_raised).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.label}>Supplier:</Text>
            <View style={styles.address}>
              <Text style={styles.bold}>{po.supplier_name}</Text>
              {po.supplier_contact && <Text>{po.supplier_contact}</Text>}
              {po.supplier_email && <Text>{po.supplier_email}</Text>}
            </View>
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>Ship To:</Text>
            <View style={styles.address}>
              <Text style={styles.bold}>Touch Teqniques Engineering Services</Text>
              <Text>91 Sir George Grey Street</Text>
              <Text>Horison, Roodepoort</Text>
              <Text>Johannesburg, 1724</Text>
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
              <Text>Subtotal (Excl. VAT)</Text>
              <Text>{formatCurrency(po.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>VAT (15%)</Text>
              <Text>{formatCurrency(po.vat_amount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(po.total)}</Text>
            </View>
          </View>
        </View>

        {po.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes / Instructions</Text>
            <Text style={{ lineHeight: 1.5 }}>{po.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Touch Teqniques Engineering Services • Reg: 2013/118320/07 • VAT: 4940295068
          </Text>
          <Text style={styles.footerText}>
            91 Sir George Grey St, Horison, Roodepoort • 072 552 2110 • accounts@touchteq.co.za
          </Text>
        </View>
      </Page>
    </Document>
  );
};
