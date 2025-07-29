import React, { useEffect, useRef } from 'react';
import { Box, useTheme } from '@mui/material';

interface SimpleLatexRendererProps {
  formula: string;
  display?: boolean;
}

/**
 * Componente para renderizar fórmulas LaTeX usando KaTeX
 * 
 * @param formula - A fórmula LaTeX a ser renderizada
 * @param display - Se true, renderiza em modo bloco (display), senão inline
 * 
 * @example
 * // Fórmula inline
 * <SimpleLatexRenderer formula="x^2 + y^2 = z^2" />
 * 
 * // Fórmula em bloco
 * <SimpleLatexRenderer formula="\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}" display={true} />
 * 
 * // Fórmulas com macros personalizados
 * <SimpleLatexRenderer formula="\\RR^n" /> // ℝⁿ
 * <SimpleLatexRenderer formula="\\NN \\subset \\ZZ \\subset \\QQ \\subset \\RR \\subset \\CC" display={true} />
 */
const SimpleLatexRenderer: React.FC<SimpleLatexRendererProps> = ({ formula, display = false }) => {
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
            strict: false,
            trust: true
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
      component={display ? 'div' : 'span'}
      sx={{ 
        display: display ? 'block' : 'inline',
        textAlign: display ? 'center' : 'left',
        my: display ? 2 : 0,
        mx: display ? 0 : 0.5,
        '& .katex': {
          fontSize: display ? '1.2em' : '1em',
          color: isDark ? '#e0e0e0' : '#000',
          lineHeight: display ? '1.2' : '1',
        },
        '& .katex-display': {
          margin: display ? '1em 0' : '0',
          textAlign: 'center',
        },
        '& .katex-html': {
          display: display ? 'block' : 'inline',
        },
        // Estilos específicos para modo inline
        ...(display ? {} : {
          '& .katex': {
            fontSize: '1em',
            lineHeight: '1',
          },
          '& .katex-html': {
            whiteSpace: 'nowrap',
          }
        }),
        // Estilos específicos para modo display
        ...(display ? {
          '& .katex-display': {
            margin: '1em 0',
            textAlign: 'center',
          },
          '& .katex': {
            fontSize: '1.2em',
            lineHeight: '1.2',
          }
        } : {})
      }} 
    />
  );
};

export default SimpleLatexRenderer; 