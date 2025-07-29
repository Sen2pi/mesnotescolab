import React, { useEffect, useRef } from 'react';
import { Box, useTheme } from '@mui/material';

interface LaTeXRendererProps {
  formula: string;
  display?: boolean;
}

const LaTeXRenderer: React.FC<LaTeXRendererProps> = ({ formula, display = false }) => {
  const ref = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    const renderLaTeX = async () => {
      if (ref.current) {
        try {
          // Importar KaTeX dinamicamente
          const katex = await import('katex');
          
          // Limpar o conteúdo anterior
          ref.current.innerHTML = '';
          
          // Renderizar a fórmula
          katex.default.render(formula, ref.current, {
            displayMode: display,
            throwOnError: false,
            errorColor: isDark ? '#ff6b6b' : '#d32f2f',
            macros: {
              "\\RR": "\\mathbb{R}",
              "\\NN": "\\mathbb{N}",
              "\\ZZ": "\\mathbb{Z}",
              "\\QQ": "\\mathbb{Q}",
              "\\CC": "\\mathbb{C}"
            },
            strict: false
          });
        } catch (error) {
          console.error('Erro ao renderizar LaTeX:', error);
          if (ref.current) {
            ref.current.innerHTML = `<span style="color: ${isDark ? '#ff6b6b' : '#d32f2f'}">Erro na fórmula LaTeX: ${formula}</span>`;
          }
        }
      }
    };

    renderLaTeX();
  }, [formula, display, isDark]);

  return (
    <Box 
      ref={ref} 
      sx={{ 
        display: display ? 'block' : 'inline',
        textAlign: display ? 'center' : 'left',
        my: display ? 2 : 0,
        mx: display ? 0 : 0.5,
        '& .katex': {
          fontSize: display ? '1.2em' : '1em',
          color: isDark ? '#e0e0e0' : '#000',
        },
        '& .katex-display': {
          margin: display ? '1em 0' : '0',
        }
      }} 
    />
  );
};

export default LaTeXRenderer; 