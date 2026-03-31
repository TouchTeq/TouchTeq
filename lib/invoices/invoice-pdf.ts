export async function generateInvoicePdfBlob(element: HTMLElement) {
  const html2pdfModule = await import('html2pdf.js');
  const html2pdf = (html2pdfModule as any).default || html2pdfModule;

  const worker = html2pdf()
    .set({
      margin: 0,
      filename: 'invoice.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        unit: 'px',
        format: [794, 1123],
        orientation: 'portrait',
      },
      pagebreak: {
        mode: ['avoid-all', 'css'],
      },
    })
    .from(element)
    .toPdf();

  return worker.outputPdf('blob');
}

export async function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result?.toString().split(',')[1];
      if (result) {
        resolve(result);
      } else {
        reject(new Error('Failed to read PDF blob.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to convert PDF blob.'));
    reader.readAsDataURL(blob);
  });
}
