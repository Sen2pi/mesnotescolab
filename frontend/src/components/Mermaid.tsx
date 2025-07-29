import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Box, useTheme } from '@mui/material';

interface MermaidProps {
  chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    const renderMermaid = async () => {
      if (ref.current) {
        // Definir tema do Mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          themeVariables: {
            background: isDark ? '#181818' : '#fff',
            primaryColor: isDark ? '#222' : '#eee',
            fontFamily: 'JetBrains Mono, monospace',
          },
        });
        
        try {
          mermaid.parse(chart); // Valida o diagrama
          const { svg } = await mermaid.render('mermaid-svg', chart);
          if (ref.current) {
            ref.current.innerHTML = svg;
          }
        } catch (e) {
          if (ref.current) {
            ref.current.innerHTML = '<div style="color:red">Erro no diagrama Mermaid</div>';
          }
        }
      }
    };

    renderMermaid();
  }, [chart, isDark]);

  return (
    <Box ref={ref} sx={{ width: '100%', overflowX: 'auto', my: 2, bgcolor: isDark ? '#181818' : '#fff', borderRadius: 2, p: 2, boxShadow: 1 }} />
  );
};

export default Mermaid; 