'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

export const InvoicePDF = ({ invoice, lineItems, businessProfile }: any) => {
  const settings = businessProfile.document_settings || {};
  const primaryColor = settings.primary_color || '#F97316';
  const fontFamily = settings.document_font === 'Times New Roman' ? 'Times-Roman' : 'Helvetica';
  const banking = businessProfile.banking_details || {};

  const clientName = invoice.clients?.company_name ?? invoice.quick_client_name ?? 'N/A';
  const clientContact = invoice.clients?.contact_person ?? invoice.quick_client_email ?? '';
  const clientAddress = invoice.clients?.physical_address ?? invoice.quick_client_address ?? '';
  const clientVatNumber = invoice.clients?.vat_number ?? '';

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      paddingBottom: 70,
      backgroundColor: '#FFFFFF',
      fontFamily: fontFamily,
      fontSize: 10,
      color: '#333333',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 25,
      borderBottomWidth: 1,
      borderBottomColor: primaryColor,
      paddingBottom: 15,
    },
    logoSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoImage: {
      width: 120,
      height: 'auto',
      objectFit: 'contain',
    },
    brandName: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    titleSection: {
      alignItems: 'flex-end',
    },
    title: {
      fontSize: 10,
      fontWeight: 'bold',
      color: primaryColor,
      marginBottom: 5,
    },
    invoiceNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1E293B',
      marginBottom: 4,
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 2,
    },
    dateLabel: {
      fontSize: 14,
      color: '#666666',
      marginRight: 8,
    },
    dateValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#666666',
    },
    detailsGrid: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    detailsCol: {
      flex: 1,
    },
    detailsColRight: {
      flex: 1,
      marginLeft: 60,
    },
    label: {
      fontSize: 8,
      color: '#666666',
      textTransform: 'uppercase',
      fontWeight: 'bold',
      marginBottom: 4,
    },
    supplierInfo: {
      lineHeight: 1.5,
    },
    supplierName: {
      fontWeight: 'bold',
      fontSize: 12,
      marginBottom: 3,
    },
    supplierAddress: {
      fontSize: 9,
      marginBottom: 6,
    },
    supplierDetail: {
      fontSize: 9,
      color: '#444444',
    },
    invoiceMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
      paddingVertical: 12,
      paddingHorizontal: 15,
      backgroundColor: '#F8F9FA',
      borderRadius: 4,
    },
    metaItem: {
      alignItems: 'center',
    },
    table: {
      marginTop: 5,
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#1E293B',
      color: '#FFFFFF',
      paddingVertical: 8,
      paddingHorizontal: 10,
      fontSize: 9,
      fontWeight: 'bold',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#EEEEEE',
      paddingVertical: 8,
      paddingHorizontal: 10,
      alignItems: 'center',
    },
    colDesc: { width: '55%' },
    colQty: { width: '10%', textAlign: 'center' },
    colPrice: { width: '17%', textAlign: 'right' },
    colTotal: { width: '18%', textAlign: 'right' },
    totalsSection: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 5,
    },
    totalsBox: {
      width: 220,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 3,
      paddingVertical: 2,
    },
    grandTotalRow: {
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#000',
      paddingTop: 8,
    },
    grandTotalLabel: {
      fontWeight: 'bold',
      fontSize: 12,
    },
    grandTotalValue: {
      fontWeight: 'bold',
      color: primaryColor,
      fontSize: 14,
      textAlign: 'right',
    },
    bankingSection: {
      marginTop: 25,
      padding: 15,
      backgroundColor: '#F8F9FA',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#EEEEEE',
    },
    bankingTitle: {
      fontSize: 10,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#000',
    },
    bankingRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    bankingItem: {
      width: '25%',
      marginBottom: 4,
    },
    bankingLabel: {
      fontSize: 7,
      color: '#666666',
      textTransform: 'uppercase',
    },
    bankingValue: {
      fontSize: 9,
    },
    thankYouMessage: {
      marginTop: 15,
      textAlign: 'center',
      fontSize: 9,
      fontStyle: 'italic',
      color: '#666666',
    },
    notesSection: {
      marginTop: 20,
      padding: 12,
      backgroundColor: '#FFF9F0',
      borderRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: primaryColor,
    },
    notesLabel: {
      fontSize: 8,
      fontWeight: 'bold',
      color: '#666666',
      marginBottom: 4,
    },
    notesText: {
      fontSize: 9,
      color: '#555555',
      lineHeight: 1.4,
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 40,
      right: 40,
      borderTopWidth: 1,
      borderTopColor: '#EEEEEE',
      paddingTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    footerText: {
      fontSize: 8,
      color: '#999999',
      textAlign: 'center',
    },
    footerPayment: {
      fontSize: 8,
      color: '#999999',
    },
    pageNumber: {
      position: 'absolute',
      bottom: 30,
      right: 40,
      fontSize: 8,
      color: '#CCCCCC',
    },
    header2: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#EEEEEE',
    },
    header2Left: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#333333',
    },
    header2Right: {
      fontSize: 10,
      color: '#666666',
    },
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 2 }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatQty = (item: any) => {
    if (item.qty_type === 'hrs') {
      return `${item.quantity} hrs`;
    }
    return String(item.quantity);
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

  const addressLines = (businessProfile.physical_address || '').split(',').map((line: string) => line.trim());
  const formattedAddress = addressLines.length > 2 
    ? `${addressLines[0]}, ${addressLines[1]},\n${addressLines.slice(2).join(', ')}`
    : businessProfile.physical_address;

  const renderPage = (pageNum: number, isLastPage: boolean) => (
    <Page key={pageNum} size="A4" style={styles.page}>
      {pageNum > 1 && (
        <View style={styles.header2}>
          <Text style={styles.header2Left}>#{invoice.invoice_number}</Text>
          <Text style={styles.header2Right}>{clientName}</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.logoSection}>
          {businessProfile.logo_url ? (
            <Image src={businessProfile.logo_url} style={styles.logoImage} />
          ) : (
            <View>
              <Text style={styles.brandName}>{businessProfile.trading_name || 'TouchTeq'}</Text>
            </View>
          )}
        </View>
        <View style={styles.titleSection}>
          <Text style={styles.title}>TAX INVOICE</Text>
          <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
          <View style={{ marginTop: 5 }}>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Issue Date:</Text>
              <Text style={styles.dateValue}>{formatDate(invoice.issue_date)}</Text>
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Due Date:</Text>
              <Text style={styles.dateValue}>{formatDate(invoice.due_date)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailsCol}>
          <Text style={styles.label}>Tax Invoice From:</Text>
          <View style={styles.supplierInfo}>
            <Text style={styles.supplierName}>{businessProfile.legal_name}</Text>
            <Text style={styles.supplierAddress}>{formattedAddress}</Text>
            <Text style={styles.supplierDetail}>VAT No: {businessProfile.vat_number}</Text>
            <Text style={styles.supplierDetail}>Reg No: {businessProfile.registration_number}</Text>
            {settings.show_csd && businessProfile.csd_number && (
              <Text style={styles.supplierDetail}>CSD: {businessProfile.csd_number}</Text>
            )}
            <Text style={styles.supplierDetail}>Email: {businessProfile.accounts_email || businessProfile.email}</Text>
          </View>
        </View>

        <View style={styles.detailsColRight}>
          <Text style={styles.label}>Bill To:</Text>
          <View style={styles.supplierInfo}>
            <Text style={styles.supplierName}>{clientName}</Text>
            {clientContact && (
              <Text style={styles.supplierDetail}>Attn: {clientContact}</Text>
            )}
            {clientAddress && (
              <Text style={styles.supplierAddress}>{clientAddress}</Text>
            )}
            {clientVatNumber && (
              <Text style={styles.supplierDetail}>VAT No: {clientVatNumber}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.invoiceMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.label}>Reference</Text>
          <Text style={{ fontWeight: 'bold' }}>{invoice.invoice_number}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.label}>Date of Issue</Text>
          <Text style={{ fontWeight: 'bold' }}>{formatDate(invoice.issue_date)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.label}>Due Date</Text>
          <Text style={{ fontWeight: 'bold' }}>{formatDate(invoice.due_date)}</Text>
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
            <View style={styles.colDesc}>
              {renderMultilineText(item.description, styles.colDesc)}
            </View>
            <Text style={styles.colQty}>{formatQty(item)}</Text>
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
        <Text style={styles.bankingTitle}>Please Make Payment To:</Text>
        <View style={styles.bankingRow}>
          <View style={styles.bankingItem}>
            <Text style={styles.bankingLabel}>Bank</Text>
            <Text style={styles.bankingValue}>{banking.bank_name || 'N/A'}</Text>
          </View>
          <View style={styles.bankingItem}>
            <Text style={styles.bankingLabel}>Acc Number</Text>
            <Text style={styles.bankingValue}>{banking.account_number || 'N/A'}</Text>
          </View>
          <View style={styles.bankingItem}>
            <Text style={styles.bankingLabel}>Acc Type</Text>
            <Text style={styles.bankingValue}>{banking.account_type || 'N/A'}</Text>
          </View>
          <View style={styles.bankingItem}>
            <Text style={styles.bankingLabel}>Branch Code</Text>
            <Text style={styles.bankingValue}>{banking.branch_code || 'N/A'}</Text>
          </View>
        </View>
        <Text style={styles.thankYouMessage}>Thank you for your business — it was a pleasure working with you!</Text>
      </View>

      {invoice.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes / Late Payment:</Text>
          <Text style={styles.notesText}>{invoice.notes}</Text>
        </View>
      )}

      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>
          {businessProfile.legal_name} • VAT: {businessProfile.vat_number} • Reg: {businessProfile.registration_number}
        </Text>
        <Text style={styles.footerPayment}>Payment due within 30 days</Text>
      </View>
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `${pageNumber} / ${totalPages}`
      )} fixed />
    </Page>
  );

  return (
    <Document>
      {renderPage(1, true)}
    </Document>
  );
};
