export function getWhatsAppUrl(phoneNumber: string, message?: string): string {
  let cleaned = phoneNumber.replace(/[\s\-\(\)\+]/g, "");

  if (cleaned.startsWith("0")) {
    cleaned = "27" + cleaned.substring(1);
  }

  if (cleaned.length === 9) {
    cleaned = "27" + cleaned;
  }

  let url = `https://wa.me/${cleaned}`;
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }

  return url;
}

export function getWhatsAppInvoiceMessage(
  clientName: string,
  invoiceNumber: string,
  total: number
): string {
  return `Good day,\n\nPlease find attached Invoice ${invoiceNumber} for R${total.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}.\n\nKind regards,\nTouch Teq Engineering`;
}

export function getWhatsAppQuoteMessage(
  clientName: string,
  quoteNumber: string,
  total: number
): string {
  return `Good day,\n\nPlease find attached Quotation ${quoteNumber} for R${total.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}.\n\nPlease let us know if you have any questions.\n\nKind regards,\nTouch Teq Engineering`;
}

export function getWhatsAppPaymentReminderMessage(
  clientName: string,
  invoiceNumber: string,
  total: number,
  daysOverdue: number
): string {
  return `Good day,\n\nThis is a friendly reminder regarding Invoice ${invoiceNumber} for R${total.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}, which is now ${daysOverdue} day(s) overdue.\n\nWe would appreciate it if payment could be arranged at your earliest convenience.\n\nKind regards,\nTouch Teq Engineering`;
}

export function getWhatsAppGeneralMessage(contactName: string): string {
  return `Good day ${contactName},\n\n`;
}
