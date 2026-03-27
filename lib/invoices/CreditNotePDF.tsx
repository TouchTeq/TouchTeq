'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

export const CreditNotePDF = ({ creditNote, lineItems, businessProfile }: any) => {
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
      marginBottom: 30,
      borderBottomWidth: 2,
      borderBottomColor: '#DC2626',
      paddingBottom: 15,
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
    creditNoteTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#DC2626',
      marginBottom: 5,
    },
    creditNoteNumber: {
      fontSize: 12,
      color: '#666666',
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
      backgroundColor: '#FEF2F2',
      padding: 15,
      borderRadius: 4,
      marginBottom: 30,
      borderLeftWidth: 4,
      borderLeftColor: '#DC2626',
    },
    creditReason: {
      fontSize: 10,
      color: '#7F1D1D',
      marginBottom: 20,
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
      borderBottomColor: '#E5E7EB',
      padding: 8,
    },
    descriptionCol: {
      flex: 3,
      fontSize: 9,
    },
    qtyCol: {
      flex: 1,
      fontSize: 9,
      textAlign: 'right',
    },
    priceCol: {
      flex: 1,
      fontSize: 9,
      textAlign: 'right',
    },
    totalCol: {
      flex: 1,
      fontSize: 9,
      textAlign: 'right',
    },
    totalsSection: {
      alignItems: 'flex-end',
      marginTop: 20,
    },
    totalsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: 200,
      paddingVertical: 5,
    },
    totalsLabel: {
      fontSize: 10,
      color: '#666666',
    },
    totalsValue: {
      fontSize: 10,
      fontWeight: 'bold',
    },
    grandTotal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: 200,
      paddingVertical: 8,
      borderTopWidth: 2,
      borderTopColor: '#DC2626',
      marginTop: 5,
    },
    grandTotalLabel: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#DC2626',
    },
    grandTotalValue: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#DC2626',
    },
    footer: {
      position: 'absolute',
      bottom: 40,
      left: 40,
      right: 40,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      paddingTop: 20,
    },
    footerText: {
      fontSize: 8,
      color: '#999999',
      textAlign: 'center',
    },
    bankingSection: {
      marginTop: 30,
      padding: 15,
      backgroundColor: '#F8F9FA',
      borderRadius: 4,
    },
    bankingTitle: {
      fontSize: 9,
      fontWeight: 'bold',
      marginBottom: 8,
      color: '#666666',
    },
    bankingRow: {
      fontSize: 8,
      color: '#666666',
      marginBottom: 3,
    },
    sarsDisclaimer: {
      marginTop: 20,
      padding: 10,
      backgroundColor: '#FFF7ED',
      borderRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: '#F97316',
    },
    sarsText: {
      fontSize: 7,
      color: '#9A3412',
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <View style={styles.logoBox}>
              {businessProfile.logo_url ? (
                <Image src={businessProfile.logo_url} style={styles.logoBox} />
              ) : (
                <Text style={styles.logoText}>T</Text>
              )}
            </View>
            <View>
              <Text style={styles.brandName}>{businessProfile.company_name || 'Touch Teq'}</Text>
              <Text style={{ fontSize: 8, color: '#666666' }}>Engineering Services</Text>
            </View>
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.creditNoteTitle}>CREDIT NOTE</Text>
            <Text style={styles.creditNoteNumber}>{creditNote.credit_note_number}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailsCol}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 3 }}>
              {creditNote.clients?.company_name || 'N/A'}
            </Text>
            <Text style={{ fontSize: 9, color: '#666666' }}>
              {creditNote.clients?.contact_person || ''}
            </Text>
            <Text style={{ fontSize: 9, color: '#666666' }}>
              {creditNote.clients?.email || ''}
            </Text>
          </View>
          <View style={styles.detailsCol}>
            <Text style={styles.label}>Credit Note Details</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text style={{ fontSize: 9, color: '#666666' }}>Date:</Text>
              <Text style={{ fontSize: 9 }}>{creditNote.issue_date}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 9, color: '#666666' }}>Status:</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{creditNote.status}</Text>
            </View>
          </View>
        </View>

        {/* Original Invoice Reference */}
        <View style={styles.invoiceMeta}>
          <Text style={styles.label}>Original Invoice Reference</Text>
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>
            {creditNote.invoices?.invoice_number || 'N/A'}
          </Text>
        </View>

        {/* Reason */}
        {creditNote.reason && (
          <Text style={styles.creditReason}>
            Reason for Credit: {creditNote.reason}
          </Text>
        )}

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.descriptionCol, { flex: 3 }]}>Description</Text>
            <Text style={[styles.qtyCol, { flex: 1 }]}>Qty</Text>
            <Text style={[styles.priceCol, { flex: 1 }]}>Unit Price</Text>
            <Text style={[styles.totalCol, { flex: 1 }]}>Total</Text>
          </View>
          {lineItems?.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.descriptionCol, { flex: 3 }]}>{item.description}</Text>
              <Text style={[styles.qtyCol, { flex: 1 }]}>{item.quantity}</Text>
              <Text style={[styles.priceCol, { flex: 1 }]}>R {item.unit_price?.toFixed(2)}</Text>
              <Text style={[styles.totalCol, { flex: 1 }]}>R {item.line_total?.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>R {creditNote.subtotal?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>VAT (15%)</Text>
            <Text style={styles.totalsValue}>R {creditNote.vat_amount?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>TOTAL CREDIT</Text>
            <Text style={styles.grandTotalValue}>R {creditNote.total?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>

        {/* Banking Details */}
        {banking.bank_name && (
          <View style={styles.bankingSection}>
            <Text style={styles.bankingTitle}>Banking Details</Text>
            <Text style={styles.bankingRow}>Bank: {banking.bank_name}</Text>
            <Text style={styles.bankingRow}>Account Name: {banking.account_name}</Text>
            <Text style={styles.bankingRow}>Account Number: {banking.account_number}</Text>
            <Text style={styles.bankingRow}>Branch Code: {banking.branch_code}</Text>
          </View>
        )}

        {/* SARS Disclaimer */}
        <View style={styles.sarsDisclaimer}>
          <Text style={styles.sarsText}>
            This credit note is issued in accordance with SARS requirements. VAT has been calculated at 15% in accordance with the Value-Added Tax Act.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {businessProfile.company_name || 'Touch Teq'} | {businessProfile.email || 'info@touchteq.co.za'} | {businessProfile.phone || '+27 72 552 2110'}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
