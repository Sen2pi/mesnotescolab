import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { Note } from '../types';
import { apiService } from '../services/api';
import NoteReference from './NoteReference';
import CodeBlock from './CodeBlock';
import Mermaid from './Mermaid';
import LaTeXRenderer from './LatexRenderer';

interface MarkdownRendererProps {
  content: string;
  workspaceId?: string;
  onNoteClick?: (note: Note) => void;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  workspaceId, 
  onNoteClick 
}) => {
  const [referencedNotes, setReferencedNotes] = useState<Note[]>([]);
  const theme = useTheme();



  // Processar conteúdo para detectar LaTeX
  const processLatexContent = (text: string) => {
    const parts: Array<{ type: 'text' | 'latex'; content?: string; formula?: string; display?: boolean }> = [];
    let lastIndex = 0;
    
    // Detectar blocos LaTeX $$...$$ primeiro
    const blockPattern = /\$\$([^$]+)\$\$/g;
    let blockMatch;
    while ((blockMatch = blockPattern.exec(text)) !== null) {
      const beforeMatch = text.slice(lastIndex, blockMatch.index);
      if (beforeMatch) {
        parts.push({ type: 'text', content: beforeMatch });
      }
      parts.push({ 
        type: 'latex', 
        formula: blockMatch[1].trim(), 
        display: true 
      });
      lastIndex = blockMatch.index + blockMatch[0].length;
    }
    
    // Detectar fórmulas inline $...$ no texto restante
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      const inlinePattern = /\$([^$\n\r]+?)\$/g;
      let inlineLastIndex = 0;
      let inlineMatch;
      
      while ((inlineMatch = inlinePattern.exec(remainingText)) !== null) {
        const beforeInlineMatch = remainingText.slice(inlineLastIndex, inlineMatch.index);
        if (beforeInlineMatch) {
          parts.push({ type: 'text', content: beforeInlineMatch });
        }
        parts.push({ 
          type: 'latex', 
          formula: inlineMatch[1].trim(), 
          display: false 
        });
        inlineLastIndex = inlineMatch.index + inlineMatch[0].length;
      }
      
      const finalRemainingText = remainingText.slice(inlineLastIndex);
      if (finalRemainingText) {
        parts.push({ type: 'text', content: finalRemainingText });
      }
    }
    
    return parts;
  };

  // Extrair referências do conteúdo
  const extractReferences = (text: string) => {
    const referencePattern = /\{\{([^}]+)\}\}/g;
    const references: string[] = [];
    let match;
    while ((match = referencePattern.exec(text)) !== null) {
      references.push(match[1].trim());
    }
    return references;
  };

  // Carregar notas referenciadas
  useEffect(() => {
    const references = extractReferences(content);
    if (references.length > 0 && workspaceId) {
      const loadReferencedNotes = async () => {
        try {
          const notes = await Promise.all(
            references.map(async (title) => {
              const response = await apiService.searchNotesByTitle(title, workspaceId);
              return response.data?.[0] || null;
            })
          );
          setReferencedNotes(notes.filter((note): note is Note => note !== null));
        } catch (error) {
          console.error('Erro ao carregar notas referenciadas:', error);
        }
      };
      loadReferencedNotes();
    }
  }, [content, workspaceId]);

  // Substituir referências por componentes clicáveis
  const processContent = (text: string) => {
    const referencePattern = /\{\{([^}]+)\}\}/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = referencePattern.exec(text)) !== null) {
      const beforeMatch = text.slice(lastIndex, match.index);
      if (beforeMatch) {
        parts.push({ type: 'text', content: beforeMatch });
      }
      const noteTitle = match[1].trim();
      const referencedNote = referencedNotes.find(note => 
        note.titre.toLowerCase() === noteTitle.toLowerCase()
      );
      if (referencedNote) {
        parts.push({ type: 'reference', note: referencedNote });
      } else {
        parts.push({ type: 'text', content: match[0] });
      }
      lastIndex = match.index + match[0].length;
    }
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }
    return parts;
  };



  return (
    <Box sx={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '14px',
      lineHeight: 1.6,
      '& .katex': {
        fontSize: '1em',
        color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#000',
      },
      '& .katex-display': {
        margin: '1em 0',
        textAlign: 'center',
      },
      '& .katex-display .katex': {
        fontSize: '1.2em',
      },
      '& h1, & h2, & h3, & h4, & h5, & h6': {
        fontWeight: 600,
        marginTop: 2,
        marginBottom: 1,
      },
      '& p': { marginBottom: 2 },
      '& code': {
        fontFamily: 'JetBrains Mono, monospace',
        backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
        padding: '2px 4px',
        borderRadius: 1,
        fontSize: '0.9em',
      },
      '& pre': {
        fontFamily: 'JetBrains Mono, monospace',
        backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
        color: theme.palette.mode === 'dark' ? 'white' : 'black',
        padding: 2,
        borderRadius: 2,
        overflow: 'auto',
        fontSize: '0.9em',
        marginY: 2,
      },
      '& blockquote': {
        borderLeft: '4px solid',
        borderColor: 'primary.main',
        paddingLeft: 2,
        marginLeft: 0,
        fontStyle: 'italic',
      },
      '& ul, & ol': { paddingLeft: 3 },
      '& li': { marginBottom: 0.5 },
      '& table': {
        borderCollapse: 'collapse',
        width: '100%',
        marginY: 2,
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.300',
        borderRadius: 1,
        overflow: 'hidden',
      },
      '& th, & td': {
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.300',
        padding: 1.5,
        textAlign: 'left',
        verticalAlign: 'top',
      },
      '& th': {
        backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
        fontWeight: 600,
        fontSize: '0.9em',
      },
      '& td': {
        fontSize: '0.9em',
      },
      '& tr:nth-of-type(even)': {
        backgroundColor: theme.palette.mode === 'dark' ? 'grey.700' : 'grey.50',
      },
      '& tr:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.100',
      },
    }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <Typography variant="h4" component="h1" gutterBottom>{children}</Typography>,
          h2: ({ children }) => <Typography variant="h5" component="h2" gutterBottom>{children}</Typography>,
          h3: ({ children }) => <Typography variant="h6" component="h3" gutterBottom>{children}</Typography>,
          h4: ({ children }) => <Typography variant="subtitle1" component="h4" gutterBottom>{children}</Typography>,
          h5: ({ children }) => <Typography variant="subtitle2" component="h5" gutterBottom>{children}</Typography>,
          h6: ({ children }) => <Typography variant="body1" component="h6" gutterBottom sx={{ fontWeight: 600 }}>{children}</Typography>,
          p: ({ children }) => {
            const content = String(children);
            const parts = processLatexContent(content);
            
            return (
              <Typography variant="body1" paragraph>
                {parts.map((part, index) => {
                  if (part.type === 'latex' && part.formula) {
                    return (
                      <LaTeXRenderer 
                        key={index}
                        formula={part.formula} 
                        display={part.display || false} 
                      />
                    );
                  }
                  return <span key={index}>{part.content}</span>;
                })}
              </Typography>
            );
          },
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            
            // Renderizar Mermaid
            if (lang === 'mermaid') {
              return (
                <Box sx={{ my: 2 }}>
                  <Mermaid chart={String(children).trim()} />
                </Box>
              );
            }
            
            // Renderizar LaTeX
            if (lang === 'latex' || lang === 'math') {
              return (
                <Box sx={{ my: 2, textAlign: 'center' }}>
                  <LaTeXRenderer formula={String(children).trim()} display={true} />
                </Box>
              );
            }
            
            // Renderizar bloco de código customizado
            if (!inline) {
              return (
                <CodeBlock code={String(children)} language={lang} showLineNumbers />
              );
            }
            
            // Código inline
            return (
              <Box component="code" sx={{
                backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                padding: '2px 4px',
                borderRadius: 1,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.9em',
              }} {...props}>
                {children}
              </Box>
            );
          },
          blockquote: ({ children }) => (
            <Box sx={{
              borderLeft: '4px solid',
              borderColor: 'primary.main',
              paddingLeft: 2,
              marginLeft: 0,
              fontStyle: 'italic',
              backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
              padding: 2,
              borderRadius: 1
            }}>
              {children}
            </Box>
          ),
          ul: ({ children }) => <Box component="ul" sx={{ paddingLeft: 3 }}>{children}</Box>,
          ol: ({ children }) => <Box component="ol" sx={{ paddingLeft: 3 }}>{children}</Box>,
          li: ({ children }) => <Box component="li" sx={{ marginBottom: 0.5 }}>{children}</Box>,
          table: ({ children }) => (
            <Paper elevation={1} sx={{ overflow: 'auto', my: 2 }}>
              <Box component="table" sx={{
                borderCollapse: 'collapse',
                width: '100%',
                minWidth: '100%',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.300',
                borderRadius: 1,
                overflow: 'hidden',
              }}>
                {children}
              </Box>
            </Paper>
          ),
          thead: ({ children }) => (
            <Box component="thead" sx={{ 
              backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100' 
            }}>
              {children}
            </Box>
          ),
          tbody: ({ children }) => (
            <Box component="tbody">
              {children}
            </Box>
          ),
          tr: ({ children }) => (
            <Box component="tr" sx={{
              '&:nth-of-type(even)': {
                backgroundColor: theme.palette.mode === 'dark' ? 'grey.700' : 'grey.50',
              },
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.100',
              },
            }}>
              {children}
            </Box>
          ),
          th: ({ children }) => (
            <Box component="th" sx={{
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.300',
              padding: 1.5,
              textAlign: 'left',
              verticalAlign: 'top',
              backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
              fontWeight: 600,
              fontSize: '0.9em',
              color: theme.palette.mode === 'dark' ? 'grey.100' : 'grey.900',
            }}>
              {children}
            </Box>
          ),
          td: ({ children }) => (
            <Box component="td" sx={{
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.300',
              padding: 1.5,
              textAlign: 'left',
              verticalAlign: 'top',
              fontSize: '0.9em',
              color: theme.palette.mode === 'dark' ? 'grey.100' : 'grey.900',
            }}>
              {children}
            </Box>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownRenderer; 