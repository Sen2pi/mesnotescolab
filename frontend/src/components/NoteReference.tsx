import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';
import { Note } from '../types';

interface NoteReferenceProps {
  note: Note;
  onClick?: (note: Note) => void;
}

const NoteReference: React.FC<NoteReferenceProps> = ({ note, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(note);
    }
  };

  return (
    <Tooltip title={`Clique para abrir "${note.titre}"`}>
      <Chip
        label={note.titre}
        size="small"
        color="primary"
        variant="outlined"
        clickable
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'primary.main',
            color: 'white',
          },
          borderColor: note.couleur,
          color: note.couleur,
          '&:hover .MuiChip-label': {
            color: 'white',
          },
        }}
      />
    </Tooltip>
  );
};

export default NoteReference; 