import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Utilitário para exportar conteúdo como PDF
 */

interface PDFOptions {
  title?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter' | 'legal';
  margin?: number;
}

export const exportAsPDF = async (
  element: HTMLElement,
  options: PDFOptions = {}
): Promise<void> => {
  try {
    const {
      title = 'Documento',
      filename = 'documento.pdf',
      orientation = 'portrait',
      format = 'a4',
      margin = 20
    } = options;

    // Configurar html2canvas
    const canvas = await html2canvas(element);

    // Calcular dimensões do PDF
    const imgWidth = format === 'a4' ? 210 : 216;
    const pageHeight = format === 'a4' ? 295 : 279;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Criar PDF com a sintaxe moderna
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format
    });
    let position = 0;

    // Adicionar título se fornecido
    if (title) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, 20);
      position = 30;
    }

    // Adicionar imagem do canvas
    pdf.addImage(canvas, 'PNG', margin, position, imgWidth - (margin * 2), imgHeight);

    heightLeft -= pageHeight;

    // Adicionar páginas adicionais se necessário
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas, 'PNG', margin, position, imgWidth - (margin * 2), imgHeight);
      heightLeft -= pageHeight;
    }

    // Salvar PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error('Erro ao gerar PDF');
  }
};

/**
 * Prepara o elemento para exportação PDF
 */
export const prepareElementForPDF = (element: HTMLElement): HTMLElement => {
  // Clonar o elemento para não afetar o original
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Aplicar estilos para PDF
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#000000';
  clone.style.fontFamily = 'Arial, sans-serif';
  clone.style.fontSize = '12px';
  clone.style.lineHeight = '1.5';
  clone.style.padding = '20px';
  clone.style.margin = '0';
  clone.style.width = '100%';
  clone.style.maxWidth = 'none';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  
  // Remover elementos interativos
  const interactiveElements = clone.querySelectorAll('button, input, select, textarea');
  interactiveElements.forEach(el => el.remove());
  
  return clone;
}; 