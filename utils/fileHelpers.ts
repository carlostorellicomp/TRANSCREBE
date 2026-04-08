import { jsPDF } from 'jspdf';
import { TranscriptionData } from '../types';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const generatePDF = (data: TranscriptionData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text('Transcrição Gerada', 20, 20);
  
  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Arquivo Original: ${data.fileName}`, 20, 30);
  doc.text(`Data: ${data.date}`, 20, 35);
  doc.line(20, 40, 190, 40); // Horizontal line

  // Content
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const maxWidth = 170;
  let yPosition = 50;

  // Split text to fit width
  const lines = doc.splitTextToSize(data.text, maxWidth);

  lines.forEach((line: string) => {
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(line, margin, yPosition);
    yPosition += 7;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} - Gerado automaticamente por TranscreveAI`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`transcricao_${data.fileName.split('.')[0]}.pdf`);
};

export const downloadTXT = (filename: string, text: string) => {
  const element = document.createElement("a");
  const file = new Blob([text], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = `transcricao_${filename.split('.')[0]}.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
