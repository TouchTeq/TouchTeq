'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts if needed, or use defaults
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#F97316',
    paddingBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 35,
    height: 35,
    backgroundColor: '#F97316',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'black',
    fontStyle: 'italic',
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'black',
    textTransform: 'uppercase',
  },
  brandSpan: {
    color: '#F97316',
  },
  brandSub: {
    fontSize: 7,
    textTransform: 'uppercase',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 1,
  },
  docTitleContainer: {
    textAlign: 'right',
  },
  docTitle: {
    fontSize: 24,
    fontWeight: 'black',
    textTransform: 'uppercase',
    color: '#0F172A',
    marginBottom: 4,
  },
  docNumber: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: 'bold',
  },

  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'black',
    textTransform: 'uppercase',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 4,
  },
  
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCol: {
    width: '50%',
    paddingRight: 20,
    marginBottom: 10,
  },
  label: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E293B',
  },

  infoBox: {
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  
  outcomeContainer: {
    marginTop: 40,
    padding: 20,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
  },
  outcomePass: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  outcomeFail: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  outcomeText: {
    fontSize: 14,
    fontWeight: 'black',
    textTransform: 'uppercase',
  },
  outcomeTextPass: {
    color: '#166534',
  },
  outcomeTextFail: {
    color: '#991B1B',
  },

  remarks: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    minHeight: 100,
  },
  remarksText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#334155',
  },

  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 15,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  signatureArea: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '40%',
    borderTopWidth: 1,
    borderTopColor: '#64748B',
    paddingTop: 10,
    alignItems: 'center',
  },
});

export const CertificatePDF = ({ certificate, businessProfile }: any) => {
  const isPass = certificate.pass_fail_status;
  
  const getTypeName = (type: string) => {
    const types: Record<string, string> = {
      commissioning: 'Commissioning Certificate',
      hac: 'Hazardous Area Classification',
      sat: 'Site Acceptance Test (SAT)',
      as_built: 'As-Built Certificate',
      installation: 'Equipment Installation',
      maintenance: 'Maintenance & Inspection',
      sil: 'SIL Verification Report',
    };
    return types[type] || 'Compliance Certificate';
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
            <Text style={styles.docTitle}>{getTypeName(certificate.certificate_type)}</Text>
            <Text style={styles.docNumber}>DOCUMENT NO: {certificate.certificate_number}</Text>
          </View>
        </View>

        {/* Client & Project Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client & Project Information</Text>
          <View style={styles.grid}>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Client / Recipient</Text>
              <Text style={styles.value}>{certificate.clients?.company_name}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Project Reference</Text>
              <Text style={styles.value}>{certificate.project_reference || 'N/A'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Site Name</Text>
              <Text style={styles.value}>{certificate.site_name || 'N/A'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Site Address</Text>
              <Text style={styles.value}>{certificate.site_address || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Technical Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certification Details</Text>
          <View style={styles.grid}>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Inspection Date</Text>
              <Text style={styles.value}>{new Date(certificate.inspection_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Issue Date</Text>
              <Text style={styles.value}>{new Date(certificate.issue_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Lead Engineer</Text>
              <Text style={styles.value}>{certificate.engineer_name}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Standards Referenced</Text>
              <Text style={styles.value}>{certificate.standards_referenced || 'General Engineering Best Practices'}</Text>
            </View>
          </View>
        </View>

        {/* Compliance Outcome */}
        <View style={[styles.outcomeContainer, isPass ? styles.outcomePass : styles.outcomeFail]}>
          <Text style={[styles.outcomeText, isPass ? styles.outcomeTextPass : styles.outcomeTextFail]}>
            STATUS: {isPass ? 'COMPLIANT / PASSED' : 'NON-COMPLIANT / FAILED'}
          </Text>
        </View>

        {/* Remarks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Remarks & Technical Findings</Text>
          <View style={styles.remarks}>
            <Text style={styles.remarksText}>{certificate.notes || 'No additional remarks provided.'}</Text>
          </View>
        </View>

        {/* Signature Area */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <Text style={styles.label}>Lead Engineer Signature</Text>
            <Text style={[styles.value, { marginTop: 10 }]}>{certificate.engineer_name}</Text>
            <Text style={[styles.label, { marginTop: 4 }]}>REG: {certificate.engineer_registration || 'N/A'}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.label}>Client Acknowledgement</Text>
            <Text style={[styles.value, { marginTop: 10, color: '#CBD5E1' }]}>[ SIGNATURE ON DOCUMENT ]</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {businessProfile.legal_name} • VAT: {businessProfile.vat_number} • REG: {businessProfile.registration_number}
          </Text>
          <Text style={[styles.footerText, { marginTop: 4 }]}>
            {businessProfile.physical_address} • {businessProfile.email}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
