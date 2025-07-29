/**
 * Utilitário para exportar conteúdo como arquivo markdown
 */

export const exportAsMarkdown = (content: string, filename: string): void => {
  try {
    // Criar blob com o conteúdo
    const blob = new Blob([content], { type: 'text/markdown' });
    
    // Criar URL para o blob
    const url = URL.createObjectURL(blob);
    
    // Criar elemento de download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.md') ? filename : `${filename}.md`;
    
    // Adicionar ao DOM, clicar e remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar URL
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao exportar markdown:', error);
    throw new Error('Erro ao exportar arquivo');
  }
};

/**
 * Gera um nome de arquivo baseado no título da nota
 */
export const generateFilename = (title: string): string => {
  // Remover caracteres especiais e espaços
  const cleanTitle = title
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .toLowerCase()
    .trim();
  
  return cleanTitle || 'nota';
}; 