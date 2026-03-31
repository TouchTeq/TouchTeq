import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#F97316',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 36,
    height: 36,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  logoLetter: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A2B4C',
  },
  brandSpan: {
    color: '#F97316',
  },
  brandSub: {
    fontSize: 8,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  docTitleContainer: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F97316',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  docNumber: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A2B4C',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  gridCol: {
    width: '48%',
  },
  label: {
    fontSize: 8,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: '#1A2B4C',
    fontWeight: 'bold',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableCell: {
    fontSize: 9,
    color: '#1A2B4C',
  },
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '20%', textAlign: 'center' },
  col4: { width: '15%', textAlign: 'right' },
  signatureArea: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  signatureBox: {
    width: '45%',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#64748B',
    height: 25,
    marginTop: 30,
  },
  stampBox: {
    width: '45%',
    height: 60,
    borderWidth: 1,
    borderColor: '#64748B',
    borderStyle: 'dashed',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampText: {
    fontSize: 8,
    color: '#94A3B8',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#64748B',
    textAlign: 'center',
  },
});

export const DeliveryNotePDF = ({ deliveryNote, businessProfile }: any) => {
  const items = deliveryNote.delivery_note_items || [];
  
  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'New': return 'New';
      case 'Used': return 'Used';
      case 'Repaired': return 'Repaired';
      default: return condition;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>T</Text>
            </View>
            <View>
              <Text style={styles.brandName}>
                TOUCH<Text style={styles.brandSpan}>TEQ</Text>
              </Text>
              <Text style={styles.brandSub}>Engineering Services</Text>
            </View>
          </View>
          <View style={styles.docTitleContainer}>
            <Text style={styles.docTitle}>DELIVERY NOTE</Text>
            <Text style={styles.docNumber}>DOCUMENT NO: {deliveryNote.delivery_note_number}</Text>
          </View>
        </View>

        {/* Client & Project Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client & Delivery Information</Text>
          <View style={styles.grid}>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Client / Recipient</Text>
              <Text style={styles.value}>{deliveryNote.clients?.company_name}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Delivery Note Date</Text>
              <Text style={styles.value}>
                {new Date(deliveryNote.date_of_delivery).toLocaleDateString('en-ZA', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Delivery Address</Text>
              <Text style={styles.value}>{deliveryNote.delivery_address || 'N/A'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Linked Invoice</Text>
              <Text style={styles.value}>
                {deliveryNote.invoices?.invoice_number || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items Delivered</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.col1]}>Description</Text>
              <Text style={[styles.tableHeaderCell, styles.col2]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.col3]}>Condition</Text>
            </View>
            {items.map((item: any, index: number) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.col1]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.col2]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.col3]}>{getConditionLabel(item.condition)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Delivered By */}
        {deliveryNote.delivered_by && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            <View style={styles.grid}>
              <View style={styles.gridCol}>
                <Text style={styles.label}>Delivered By</Text>
                <Text style={styles.value}>{deliveryNote.delivered_by}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Notes */}
        {deliveryNote.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.value}>{deliveryNote.notes}</Text>
          </View>
        )}

        {/* Signature Area */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <Text style={styles.label}>Received by (Print)</Text>
            <View style={styles.signatureLine} />
            <Text style={[styles.label, { marginTop: 5 }]}>Signature</Text>
            <View style={styles.signatureLine} />
            <Text style={[styles.label, { marginTop: 5 }]}>Date</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.stampBox}>
            <Text style={styles.stampText}>COMPANY STAMP</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {businessProfile.legal_name} • VAT: {businessProfile.vat_number} • REG: {businessProfile.registration_number}
          </Text>
          <Text style={[styles.footerText, { marginTop: 2 }]}>
            {businessProfile.physical_address} • {businessProfile.email}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default DeliveryNotePDF;
