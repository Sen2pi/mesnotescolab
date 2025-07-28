import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import { Note } from '../types';
import { apiService } from '../services/api';
import NoteReference from './NoteReference';

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

  // Extrair referências du contenu
  const extractReferences = (text: string) => {
    const referencePattern = /\{\{([^}]+)\}\}/g;
    const references: string[] = [];
    let match;
    
    while ((match = referencePattern.exec(text)) !== null) {
      references.push(match[1].trim());
    }
    
    return references;
  };

  // Charger les notes référencées
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
          console.error('Erreur chargement notes référencées:', error);
        }
      };
      
      loadReferencedNotes();
    }
  }, [content, workspaceId]);

  // Remplacer les références par des composants cliquables
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
        parts.push({ 
          type: 'reference', 
          note: referencedNote 
        });
      } else {
        parts.push({ 
          type: 'text', 
          content: match[0] 
        });
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }
    
    return parts;
  };

  const renderContent = () => {
    const parts = processContent(content);
    
    return parts.map((part, index) => {
      if (part.type === 'reference' && part.note) {
        return (
          <NoteReference
            key={index}
            note={part.note}
            onClick={onNoteClick}
          />
        );
      }
      return (
        <span key={index}>{part.content}</span>
      );
    });
  };

  return (
    <Box sx={{ 
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '14px',
      lineHeight: 1.6,
      '& h1, & h2, & h3, & h4, & h5, & h6': {
        fontWeight: 600,
        marginTop: 2,
        marginBottom: 1,
      },
      '& p': {
        marginBottom: 2,
      },
      '& code': {
        fontFamily: 'JetBrains Mono, monospace',
        backgroundColor: 'grey.100',
        padding: '2px 4px',
        borderRadius: 1,
        fontSize: '0.9em',
      },
      '& pre': {
        fontFamily: 'JetBrains Mono, monospace',
        backgroundColor: 'grey.900',
        color: 'white',
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
      '& ul, & ol': {
        paddingLeft: 3,
      },
      '& li': {
        marginBottom: 0.5,
      },
      '& table': {
        borderCollapse: 'collapse',
        width: '100%',
        marginY: 2,
      },
      '& th, & td': {
        border: '1px solid',
        borderColor: 'grey.300',
        padding: 1,
        textAlign: 'left',
      },
      '& th': {
        backgroundColor: 'grey.100',
        fontWeight: 600,
      },
    }}>
      {renderContent()}
    </Box>
  );
};

export default MarkdownRenderer; 