'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

export const InvoicePDF = ({ invoice, lineItems, businessProfile }: any) => {
  const settings = businessProfile.document_settings || {};
  const primaryColor = settings.primary_color || '#F97316';
  const fontFamily = settings.document_font === 'Times New Roman' ? 'Times-Roman' : 'Helvetica';
  const banking = businessProfile.banking_details || {};

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
      borderBottomWidth: 1,
      borderBottomColor: primaryColor,
      paddingBottom: 20,
    },
    logoSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    logoBox: {
      width: 40,
      height: 40,
      backgroundColor: primaryColor,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoImage: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    },
    logoText: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: 'bold',
    },
    brandName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    titleSection: {
      alignItems: 'flex-end',
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: 5,
    },
    detailsGrid: {
      flexDirection: 'row',
      gap: 40,
      marginBottom: 30,
    },
    detailsCol: {
      flex: 1,
    },
    label: {
      fontSize: 8,
      color: '#666666',
      textTransform: 'uppercase',
      fontWeight: 'bold',
      marginBottom: 5,
    },
    invoiceMeta: {
      backgroundColor: '#F8F9FA',
      padding: 15,
      borderRadius: 4,
      marginBottom: 30,
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
      borderRadius: 2,
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
    totalsSection: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 10,
    },
    totalsBox: {
      width: 240,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 4,
      paddingVertical: 2,
    },
    grandTotalRow: {
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#000',
      paddingTop: 8,
    },
    grandTotalLabel: {
      fontWeight: 'bold',
      fontSize: 11,
    },
    grandTotalValue: {
      fontWeight: 'bold',
      color: primaryColor,
      fontSize: 14,
      textAlign: 'right',
    },
    bankingSection: {
      marginTop: 40,
      padding: 15,
      backgroundColor: '#F8F9FA',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#EEEEEE',
    },
    bankingTitle: {
      fontSize: 9,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#000',
      textTransform: 'uppercase',
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <View style={styles.logoBox}>
              {businessProfile.logo_url ? (
                <Image src={businessProfile.logo_url} style={styles.logoImage} />
              ) : (
                <Text style={styles.logoText}>{businessProfile.trading_name?.charAt(0) || 'T'}</Text>
              )}
            </View>
            <View>
              <Text style={styles.brandName}>{businessProfile.trading_name || 'TouchTeq'}</Text>
              {settings.show_website && businessProfile.website && (
                 <Text style={{ fontSize: 7, color: '#666' }}>{businessProfile.website.toUpperCase()}</Text>
              )}
            </View>
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.title}>TAX INVOICE</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold' }}>#{invoice.invoice_number}</Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailsCol}>
            <Text style={styles.label}>Tax Invoice From:</Text>
            <View style={{ lineHeight: 1.4 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 2 }}>{businessProfile.legal_name}</Text>
              <Text>{businessProfile.physical_address}</Text>
              <Text>VAT No: {businessProfile.vat_number}</Text>
              <Text>Reg No: {businessProfile.registration_number}</Text>
              {settings.show_csd && businessProfile.csd_number && <Text>CSD: {businessProfile.csd_number}</Text>}
              <Text>Email: {businessProfile.email}</Text>
            </View>
          </View>

          <View style={styles.detailsCol}>
            <Text style={styles.label}>Tax Invoice For:</Text>
            <View style={{ lineHeight: 1.4 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 2 }}>{invoice.clients.company_name}</Text>
              {invoice.clients.contact_person && <Text>Attn: {invoice.clients.contact_person}</Text>}
              <Text>{invoice.clients.physical_address}</Text>
              {invoice.clients.vat_number && <Text>VAT No: {invoice.clients.vat_number}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.invoiceMeta}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={styles.label}>Date of Issue:</Text>
              <Text style={{ fontWeight: 'bold' }}>{new Date(invoice.issue_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
            </View>
            <View>
              <Text style={styles.label}>Due Date:</Text>
              <Text style={{ fontWeight: 'bold' }}>{new Date(invoice.due_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
            </View>
            <View>
              <Text style={styles.label}>Reference:</Text>
              <Text style={{ fontWeight: 'bold' }}>{invoice.invoice_number}</Text>
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

        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={{ color: '#666', fontSize: 9 }}>Subtotal</Text>
              <Text style={{ textAlign: 'right', fontSize: 9 }}>R {formatCurrency(invoice.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={{ color: '#666', fontSize: 9 }}>VAT (15%)</Text>
              <Text style={{ textAlign: 'right', fontSize: 9 }}>R {formatCurrency(invoice.vat_amount)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>R {formatCurrency(invoice.total)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bankingSection}>
          <Text style={styles.bankingTitle}>Banking Details</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
            <View style={{ width: '45%' }}>
              <Text style={styles.label}>Bank:</Text>
              <Text style={{ fontSize: 9 }}>{banking.bank_name || 'N/A'}</Text>
            </View>
            <View style={{ width: '45%' }}>
              <Text style={styles.label}>Acc Number:</Text>
              <Text style={{ fontSize: 9 }}>{banking.account_number || 'N/A'}</Text>
            </View>
            <View style={{ width: '45%' }}>
              <Text style={styles.label}>Acc Type:</Text>
              <Text style={{ fontSize: 9 }}>{banking.account_type || 'N/A'}</Text>
            </View>
            <View style={{ width: '45%' }}>
              <Text style={styles.label}>Branch Code:</Text>
              <Text style={{ fontSize: 9 }}>{banking.branch_code || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {invoice.notes && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.label}>Notes / Late Payment:</Text>
            <Text style={{ fontSize: 8, color: '#666' }}>{invoice.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>
            {businessProfile.legal_name} • VAT: {businessProfile.vat_number} • Reg: {businessProfile.registration_number}
          </Text>
          <Text style={{ marginTop: 4 }}>{settings.invoice_terms || 'Payment due within 30 days.'}</Text>
        </View>
      </Page>
    </Document>
  );
};
