import React, { useState } from 'react';
import { Box, Typography, IconButton, Tooltip, Select, MenuItem, useTheme } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { 
  tomorrow,
  oneDark,
  oneLight,
  vs,
  dracula,
  atomDark,
  materialDark,
  materialLight
} from 'react-syntax-highlighter/dist/esm/styles/prism';

// Declaração de tipo para html2canvas
declare global {
  interface Window {
    html2canvas: any;
  }
}

// Lista expandida de linguagens suportadas com cores específicas
const languages = [
  { code: 'javascript', label: 'JavaScript', color: '#f7df1e' },
  { code: 'typescript', label: 'TypeScript', color: '#3178c6' },
  { code: 'python', label: 'Python', color: '#3776ab' },
  { code: 'java', label: 'Java', color: '#ed8b00' },
  { code: 'c', label: 'C', color: '#a8b9cc' },
  { code: 'cpp', label: 'C++', color: '#00599c' },
  { code: 'csharp', label: 'C#', color: '#178600' },
  { code: 'php', label: 'PHP', color: '#777bb4' },
  { code: 'ruby', label: 'Ruby', color: '#cc342d' },
  { code: 'go', label: 'Go', color: '#00add8' },
  { code: 'rust', label: 'Rust', color: '#ce422b' },
  { code: 'swift', label: 'Swift', color: '#ff6b4a' },
  { code: 'kotlin', label: 'Kotlin', color: '#7f52ff' },
  { code: 'scala', label: 'Scala', color: '#dc322f' },
  { code: 'dart', label: 'Dart', color: '#00b4ab' },
  { code: 'r', label: 'R', color: '#276dc3' },
  { code: 'matlab', label: 'MATLAB', color: '#e16737' },
  { code: 'sql', label: 'SQL', color: '#e48e00' },
  { code: 'html', label: 'HTML', color: '#e34c26' },
  { code: 'css', label: 'CSS', color: '#1572b6' },
  { code: 'scss', label: 'SCSS', color: '#cf649a' },
  { code: 'sass', label: 'Sass', color: '#cf649a' },
  { code: 'less', label: 'Less', color: '#1d365d' },
  { code: 'jsx', label: 'JSX', color: '#61dafb' },
  { code: 'tsx', label: 'TSX', color: '#3178c6' },
  { code: 'vue', label: 'Vue', color: '#4fc08d' },
  { code: 'bash', label: 'Bash', color: '#4eaa25' },
  { code: 'powershell', label: 'PowerShell', color: '#012456' },
  { code: 'yaml', label: 'YAML', color: '#cb171e' },
  { code: 'toml', label: 'TOML', color: '#9c4121' },
  { code: 'ini', label: 'INI', color: '#d1dbe0' },
  { code: 'json', label: 'JSON', color: '#000000' },
  { code: 'xml', label: 'XML', color: '#f0f0f0' },
  { code: 'markdown', label: 'Markdown', color: '#083fa1' },
  { code: 'latex', label: 'LaTeX', color: '#008080' },
  { code: 'dockerfile', label: 'Dockerfile', color: '#2496ed' },
  { code: 'nginx', label: 'Nginx', color: '#009639' },
  { code: 'apache', label: 'Apache', color: '#d22128' },
  { code: 'git', label: 'Git', color: '#f05032' },
  { code: 'diff', label: 'Diff', color: '#e6e6e6' },
  { code: 'shell', label: 'Shell', color: '#4eaa25' },
  { code: 'perl', label: 'Perl', color: '#39457e' },
  { code: 'lua', label: 'Lua', color: '#000080' },
  { code: 'haskell', label: 'Haskell', color: '#5d4f85' },
  { code: 'clojure', label: 'Clojure', color: '#5881d8' },
  { code: 'elixir', label: 'Elixir', color: '#4b275f' },
  { code: 'erlang', label: 'Erlang', color: '#b83998' },
  { code: 'fsharp', label: 'F#', color: '#b845fc' },
  { code: 'ocaml', label: 'OCaml', color: '#3be133' },
  { code: 'nim', label: 'Nim', color: '#ffc200' },
  { code: 'zig', label: 'Zig', color: '#ec915c' },
  { code: 'v', label: 'V', color: '#5d87f1' },
  { code: 'crystal', label: 'Crystal', color: '#000100' },
  { code: 'd', label: 'D', color: '#ba595e' },
  { code: 'fortran', label: 'Fortran', color: '#4d41b1' },
  { code: 'cobol', label: 'COBOL', color: '#ff6d77' },
  { code: 'pascal', label: 'Pascal', color: '#e3f171' },
  { code: 'assembly', label: 'Assembly', color: '#6e4c13' },
  { code: 'mermaid', label: 'Mermaid', color: '#ff6b6b' },
];

interface CodeBlockProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, showLineNumbers = true }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(language || 'javascript');
  const [copied, setCopied] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Função para obter o tema de cores baseado na linguagem e modo
  const getSyntaxTheme = (lang: string, darkMode: boolean) => {
    // Para Python, usar temas específicos que funcionam bem
    if (lang === 'python') {
      return darkMode ? dracula : oneLight; // Changed from vs2015 to oneLight
    }
    
    const languageMap: { [key: string]: any } = {
      javascript: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      typescript: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      python: darkMode ? dracula : oneLight, // Changed from dracula to oneLight
      java: darkMode ? oneDark : oneLight, // Changed from monokai to oneDark
      c: darkMode ? vs : oneLight, // Changed from vs2015 to vs
      cpp: darkMode ? vs : oneLight, // Changed from vs2015 to vs
      csharp: darkMode ? vs : oneLight, // Changed from vs2015 to vs
      php: darkMode ? oneDark : oneLight, // Changed from dracula to oneDark
      ruby: darkMode ? oneDark : oneLight, // Changed from monokai to oneDark
      go: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      rust: darkMode ? oneDark : oneLight, // Changed from dracula to oneDark
      swift: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      kotlin: darkMode ? oneDark : oneLight, // Changed from dracula to oneDark
      scala: darkMode ? oneDark : oneLight, // Changed from monokai to oneDark
      dart: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      r: darkMode ? oneDark : oneLight, // Changed from dracula to oneDark
      matlab: darkMode ? oneDark : oneLight, // Changed from monokai to oneDark
      sql: darkMode ? vs : oneLight, // Changed from vs2015 to vs
      html: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      css: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      scss: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      sass: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      less: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      jsx: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      tsx: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      vue: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      bash: darkMode ? oneDark : oneLight, // Changed from dracula to oneDark
      powershell: darkMode ? vs : oneLight, // Changed from vs2015 to vs
      yaml: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      toml: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      ini: darkMode ? vs : oneLight, // Changed from vs2015 to vs
      json: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      xml: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      markdown: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      latex: darkMode ? oneDark : oneLight, // Changed from dracula to oneDark
      dockerfile: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      nginx: darkMode ? oneDark : oneLight, // Changed from dracula to oneDark
      apache: darkMode ? oneDark : oneLight, // Changed from monokai to oneDark
      git: darkMode ? oneDark : oneLight, // Changed from dracula to oneDark
      diff: darkMode ? vs : oneLight, // Changed from vs2015 to vs
      shell: darkMode ? oneDark : oneLight, // Changed from dracula to oneDark
      perl: darkMode ? oneDark : oneLight, // Changed from monokai to oneDark
      lua: darkMode ? oneDark : oneLight, // Changed from dracula to oneDark
      haskell: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      clojure: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      elixir: darkMode ? oneDark : oneLight, // Changed from monokai to oneDark
      erlang: darkMode ? oneDark : oneLight, // Changed from dracula to oneDark
      fsharp: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      ocaml: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      nim: darkMode ? oneDark : oneLight, // Changed from dracula to oneDark
      zig: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      v: darkMode ? oneDark : oneLight, // Changed from dracula to oneDark
      crystal: darkMode ? oneDark : oneLight, // Changed from monokai to oneDark
      d: darkMode ? oneDark : oneLight, // Changed from dracula to oneDark
      fortran: darkMode ? vs : oneLight, // Changed from vs2015 to vs
      cobol: darkMode ? oneDark : oneLight, // Changed from monokai to oneDark
      pascal: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
      assembly: darkMode ? oneDark : oneLight, // Changed from dracula to oneDark
      mermaid: darkMode ? atomDark : oneLight, // Changed from atomOneDark to atomDark
    };
    
    // Usar temas com cores mais vibrantes
    const defaultTheme = darkMode ? atomDark : oneLight; // Changed from atomOneDark to atomDark
    return languageMap[lang] || defaultTheme;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Exportar como arquivo
  const handleExportFile = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codigo_${selectedLanguage}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Exportar como imagem (simples: print da div)
  const handleExportImage = async () => {
    // Para exportar como imagem, pode-se usar html2canvas ou dom-to-image
    if (window.html2canvas) {
      const element = document.getElementById('codeblock-preview');
      if (element) {
        const canvas = await window.html2canvas(element);
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `codigo_${selectedLanguage}.png`;
        a.click();
      }
    } else {
      alert('Exportação de imagem não suportada neste navegador.');
    }
  };

  return (
    <Box
      id="codeblock-preview"
      sx={{
        my: 2,
        borderRadius: 2,
        boxShadow: 3,
        overflow: 'hidden',
        bgcolor: isDark ? 'grey.900' : 'grey.100',
        border: `1px solid ${isDark ? theme.palette.grey[800] : theme.palette.grey[300]}`,
      }}
    >
      {/* Cabeçalho */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1,
          bgcolor: isDark ? 'grey.800' : 'grey.200',
          borderBottom: `1px solid ${isDark ? theme.palette.grey[800] : theme.palette.grey[300]}`,
        }}
      >
        {/* Linguagem */}
        <Select
          size="small"
          value={selectedLanguage}
          onChange={e => setSelectedLanguage(e.target.value)}
          sx={{ 
            minWidth: 120, 
            fontWeight: 600, 
            fontSize: 13, 
            mr: 2,
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }
          }}
        >
          {languages.map(lang => (
            <MenuItem key={lang.code} value={lang.code}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: lang.color,
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}
                />
                {lang.label}
              </Box>
            </MenuItem>
          ))}
        </Select>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: languages.find(l => l.code === selectedLanguage)?.color || '#666',
              border: '1px solid rgba(0,0,0,0.1)'
            }}
          />
        </Box>
        {/* Botões */}
        <Tooltip title={copied ? 'Copiado!' : 'Copiar código'}>
          <IconButton onClick={handleCopy} size="small" color="primary">
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Exportar como arquivo">
          <IconButton onClick={handleExportFile} size="small" color="primary">
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Exportar como imagem">
          <IconButton onClick={handleExportImage} size="small" color="primary">
            <ImageIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      {/* Código */}
      <Box sx={{ p: 0 }}>
        <SyntaxHighlighter
          language={selectedLanguage}
          style={getSyntaxTheme(selectedLanguage, isDark)}
          showLineNumbers={showLineNumbers}
          customStyle={{ 
            margin: 0, 
            borderRadius: 0, 
            fontSize: 14, 
            fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
            padding: '16px',
            lineHeight: '1.5'
          }}
          lineNumberStyle={{
            color: '#d4af37',
            fontWeight: 'bold',
            fontSize: '12px',
            minWidth: '3em',
            paddingRight: '0.5em',
            textAlign: 'right',
            userSelect: 'none'
          }}
        >
          {code}
        </SyntaxHighlighter>
      </Box>
    </Box>
  );
};

export default CodeBlock; 