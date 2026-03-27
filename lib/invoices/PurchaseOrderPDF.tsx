'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

export const PurchaseOrderPDF = ({ purchaseOrder, lineItems, businessProfile }: any) => {
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
      borderBottomColor: primaryColor,
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
    poTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: 5,
    },
    poNumber: {
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
    supplierBox: {
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
      borderTopColor: primaryColor,
      marginTop: 5,
    },
    grandTotalLabel: {
      fontSize: 12,
      fontWeight: 'bold',
      color: primaryColor,
    },
    grandTotalValue: {
      fontSize: 12,
      fontWeight: 'bold',
      color: primaryColor,
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
    notesBox: {
      marginTop: 20,
      padding: 15,
      backgroundColor: '#F8F9FA',
      borderRadius: 4,
    },
    notesTitle: {
      fontSize: 9,
      fontWeight: 'bold',
      marginBottom: 5,
      color: '#666666',
    },
    notesText: {
      fontSize: 9,
      color: '#666666',
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
            <Text style={styles.poTitle}>PURCHASE ORDER</Text>
            <Text style={styles.poNumber}>{purchaseOrder.po_number}</Text>
          </View>
        </View>

        {/* Supplier Details */}
        <View style={styles.supplierBox}>
          <Text style={styles.label}>SUPPLIER</Text>
          <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 3 }}>
            {purchaseOrder.supplier_name}
          </Text>
          {purchaseOrder.supplier_contact && (
            <Text style={{ fontSize: 9, color: '#666666' }}>
              Contact: {purchaseOrder.supplier_contact}
            </Text>
          )}
          {purchaseOrder.supplier_email && (
            <Text style={{ fontSize: 9, color: '#666666' }}>
              Email: {purchaseOrder.supplier_email}
            </Text>
          )}
        </View>

        {/* Order Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailsCol}>
            <Text style={styles.label}>Order Details</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text style={{ fontSize: 9, color: '#666666' }}>Date Raised:</Text>
              <Text style={{ fontSize: 9 }}>{purchaseOrder.date_raised}</Text>
            </View>
            {purchaseOrder.delivery_date && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 9, color: '#666666' }}>Expected Delivery:</Text>
                <Text style={{ fontSize: 9 }}>{purchaseOrder.delivery_date}</Text>
              </View>
            )}
          </View>
          <View style={styles.detailsCol}>
            <Text style={styles.label}>Status</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: primaryColor }}>
              {purchaseOrder.status}
            </Text>
          </View>
        </View>

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
            <Text style={styles.totalsValue}>R {purchaseOrder.subtotal?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>VAT (15%)</Text>
            <Text style={styles.totalsValue}>R {purchaseOrder.vat_amount?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>R {purchaseOrder.total?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>

        {/* Notes */}
        {purchaseOrder.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>NOTES</Text>
            <Text style={styles.notesText}>{purchaseOrder.notes}</Text>
          </View>
        )}

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
