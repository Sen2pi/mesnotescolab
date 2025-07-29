import React from 'react';
import { Box, Typography } from '@mui/material';
import MarkdownRenderer from './MarkdownRenderer';

const LaTeXTest: React.FC = () => {
  const testContent = `
# Teste de Renderização LaTeX

## Equação Inline
Aqui está uma equação inline: $E = mc^2$

## Equação em Bloco
Aqui está uma equação em bloco:

$$
\\int_0^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$

## Outras Equações
- Equação quadrática: $ax^2 + bx + c = 0$
- Fórmula de Euler: $e^{i\\pi} + 1 = 0$
- Série de Taylor: $f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n$

## Matriz
$$
\\begin{pmatrix}
1 & 2 & 3 \\\\
4 & 5 & 6 \\\\
7 & 8 & 9
\\end{pmatrix}
$$

## Sistema de Equações
$$
\\begin{cases}
x + y = 5 \\\\
2x - y = 1
\\end{cases}
$$
`;

  return (
    <Box sx={{ p: 3, maxWidth: '800px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Teste de Renderização LaTeX
      </Typography>
      <Typography variant="body1" paragraph>
        Este é um teste para verificar se a renderização do LaTeX está funcionando corretamente sem duplicação.
      </Typography>
      
      <Box sx={{ 
        border: '1px solid #ccc', 
        borderRadius: 2, 
        p: 2, 
        bgcolor: 'background.paper',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
        <MarkdownRenderer content={testContent} />
      </Box>
    </Box>
  );
};

export default LaTeXTest; 