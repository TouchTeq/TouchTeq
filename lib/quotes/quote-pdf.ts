export async function generateQuotePdfBlob(element: HTMLElement) {
  const html2pdfModule = await import('html2pdf.js');
  const html2pdf = (html2pdfModule as any).default || html2pdfModule;

  const worker = html2pdf()
    .set({
      margin: 0,
      filename: 'quotation.pdf',
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
