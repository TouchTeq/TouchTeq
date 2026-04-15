'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

export const QuotePDF = ({ quote, lineItems, businessProfile }: any) => {
  const settings = businessProfile.document_settings || {};
  const primaryColor = settings.primary_color || '#F97316';
  const fontFamily = settings.document_font === 'Times New Roman' ? 'Times-Roman' : 'Helvetica';

  const clientName = quote.clients?.company_name ?? quote.quick_client_name ?? 'N/A';
  const clientContact = quote.clients?.contact_person ?? quote.quick_client_email ?? '';
  const clientAddress = quote.clients?.physical_address ?? quote.quick_client_address ?? '';
  const clientEmail = quote.clients?.email ?? quote.quick_client_email ?? '';

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      backgroundColor: '#FFFFFF',
      fontFamily: fontFamily,
      fontSize: 10,
      color: '#333333',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 40,
    },
    logoBox: {
      width: 50,
      height: 50,
      backgroundColor: primaryColor,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    logoImage: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    },
    logoText: {
      color: '#FFFFFF',
      fontSize: 24,
      fontWeight: 'bold',
    },
    titleSection: {
      alignItems: 'flex-end',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: 5,
    },
    businessInfo: {
      marginBottom: 30,
      lineHeight: 1.4,
    },
    clientSection: {
      marginBottom: 30,
      padding: 15,
      backgroundColor: '#F8F9FA',
      borderRadius: 4,
    },
    label: {
      fontSize: 8,
      color: '#666666',
      textTransform: 'uppercase',
      fontWeight: 'bold',
      marginBottom: 4,
    },
    table: {
      marginTop: 10,
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#1E293B',
      color: '#FFFFFF',
      padding: 8,
      fontSize: 9,
      fontWeight: 'bold',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#EEEEEE',
      padding: 8,
      alignItems: 'center',
    },
    colDesc: { width: '55%' },
    colQty: { width: '10%', textAlign: 'center' },
    colPrice: { width: '15%', textAlign: 'right' },
    colTotal: { width: '20%', textAlign: 'right' },
    totals: {
      alignItems: 'flex-end',
      marginTop: 10,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 4,
    },
    totalLabel: {
      width: 100,
      textAlign: 'right',
      paddingRight: 10,
      color: '#666666',
    },
    totalValue: {
      width: 100,
      textAlign: 'right',
    },
    grandTotal: {
      fontSize: 14,
      fontWeight: 'bold',
      color: primaryColor,
    },
    notes: {
      marginTop: 40,
      padding: 15,
      borderLeftWidth: 3,
      borderLeftColor: primaryColor,
      backgroundColor: '#F8F9FA',
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 40,
      right: 40,
      borderTopWidth: 1,
      borderTopColor: '#EEEEEE',
      paddingTop: 10,
      textAlign: 'center',
      fontSize: 8,
      color: '#999999',
    }
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 2 }).format(val);
  };

  const renderMultilineText = (text: string, style: any) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => (
      <Text key={idx} style={idx > 0 ? [style, { marginTop: 3 }] : style}>
        {line}
      </Text>
    ));
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <View style={styles.logoBox}>
              {businessProfile.logo_url ? (
                <Image src={businessProfile.logo_url} style={styles.logoImage} />
              ) : (
                <Text style={styles.logoText}>{businessProfile.trading_name?.charAt(0) || 'T'}</Text>
              )}
            </View>
            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{businessProfile.trading_name}</Text>
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.title}>QUOTATION</Text>
            <Text>Quote #: {quote.quote_number}</Text>
            <Text>Date: {new Date(quote.issue_date).toLocaleDateString('en-ZA')}</Text>
            <Text>Expires: {new Date(quote.expiry_date).toLocaleDateString('en-ZA')}</Text>
          </View>
        </View>

        <View style={styles.businessInfo}>
          <Text style={{ fontWeight: 'bold' }}>{businessProfile.legal_name}</Text>
          <Text>{businessProfile.physical_address}</Text>
          <Text>VAT No: {businessProfile.vat_number}</Text>
          <Text>Reg No: {businessProfile.registration_number}</Text>
          {settings.show_csd && businessProfile.csd_number && <Text>CSD: {businessProfile.csd_number}</Text>}
          <Text>Email: {businessProfile.accounts_email || businessProfile.email}</Text>
        </View>

        <View style={styles.clientSection}>
          <Text style={styles.label}>Quoted To:</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 11 }}>{clientName}</Text>
          {clientContact && <Text>Attn: {clientContact}</Text>}
          {clientAddress && <Text>{clientAddress}</Text>}
          {clientEmail && <Text>{clientEmail}</Text>}
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
              <View style={styles.colDesc}>
                {renderMultilineText(item.description, styles.colDesc)}
              </View>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.line_total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>R {formatCurrency(quote.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VAT (15%)</Text>
            <Text style={styles.totalValue}>R {formatCurrency(quote.vat_amount)}</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 10 }]}>
            <Text style={[styles.totalLabel, { fontWeight: 'bold', color: '#000', flex: 1, textAlign: 'left', paddingRight: 0 }]}>GRAND TOTAL</Text>
            <Text style={[styles.totalValue, styles.grandTotal, { flexShrink: 0, width: 'auto', minWidth: 80 }]}>R {formatCurrency(quote.total)}</Text>
          </View>
        </View>

        {(quote.notes || settings.quote_terms) && (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes & Terms:</Text>
            <Text style={{ fontSize: 9, lineHeight: 1.4 }}>{quote.notes || settings.quote_notes}</Text>
            {settings.quote_terms && (
              <Text style={{ fontSize: 8, color: '#666', marginTop: 10 }}>{settings.quote_terms}</Text>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text>
            {businessProfile.legal_name} • VAT: {businessProfile.vat_number} • Reg: {businessProfile.registration_number}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
