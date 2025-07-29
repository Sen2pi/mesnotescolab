import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import SimpleLatexRenderer from './SimpleLatexRenderer';

/**
 * Componente de exemplo para demonstrar o uso do SimpleLatexRenderer
 */
const LatexExample: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Exemplos de Fórmulas LaTeX
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Fórmulas Inline
        </Typography>
        
        <Typography paragraph>
          A fórmula de Bhaskara é <SimpleLatexRenderer formula="x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" /> 
          onde a, b e c são os coeficientes da equação quadrática.
        </Typography>
        
        <Typography paragraph>
          O teorema de Pitágoras: <SimpleLatexRenderer formula="a^2 + b^2 = c^2" /> 
          onde c é a hipotenusa.
        </Typography>
        
        <Typography paragraph>
          A série de Taylor: <SimpleLatexRenderer formula="f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n" />
        </Typography>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Fórmulas em Bloco
        </Typography>
        
        <Typography paragraph>
          Integral definida:
        </Typography>
        <SimpleLatexRenderer 
          formula="\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}" 
          display={true} 
        />
        
        <Typography paragraph>
          Série infinita:
        </Typography>
        <SimpleLatexRenderer 
          formula="\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}" 
          display={true} 
        />
        
        <Typography paragraph>
          Matriz:
        </Typography>
        <SimpleLatexRenderer 
          formula="\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} ax + by \\\\ cx + dy \\end{pmatrix}" 
          display={true} 
        />
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Conjuntos Numéricos
        </Typography>
        
        <Typography paragraph>
          Relação entre conjuntos: <SimpleLatexRenderer formula="\\NN \\subset \\ZZ \\subset \\QQ \\subset \\RR \\subset \\CC" />
        </Typography>
        
        <Typography paragraph>
          Espaço vetorial: <SimpleLatexRenderer formula="\\RR^n" />
        </Typography>
        
        <Typography paragraph>
          Números complexos: <SimpleLatexRenderer formula="z = a + bi \\in \\CC" />
        </Typography>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Fórmulas Complexas em Bloco
        </Typography>
        
        <Typography paragraph>
          Equação diferencial:
        </Typography>
        <SimpleLatexRenderer 
          formula="\\frac{d^2y}{dx^2} + \\alpha \\frac{dy}{dx} + \\beta y = f(x)" 
          display={true} 
        />
        
        <Typography paragraph>
          Transformada de Fourier:
        </Typography>
        <SimpleLatexRenderer 
          formula="F(\\omega) = \\int_{-\\infty}^{\\infty} f(t) e^{-i\\omega t} dt" 
          display={true} 
        />
      </Paper>
    </Box>
  );
};

export default LatexExample; 