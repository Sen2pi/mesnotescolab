const mongoose = require('mongoose');
const Note = require('./models/Note');

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mesnotescolab');

async function testPermissions() {
  try {
    
    
    // Buscar a nota específica
    const note = await Note.findById('688290afd14a2a2a4fe3028a')
      .populate('auteur', 'nom email avatar')
      .populate('collaborateurs.userId', 'nom email avatar');
    
    if (!note) {

      return;
    }
    

    
    const userId = '68829094d14a2a2a4fe30276';
    

    
    // Testar diferentes permissões
    const permissions = ['lecture', 'ecriture', 'admin'];
    
    for (const permission of permissions) {
      const hasPermission = note.hasPermission(userId, permission);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    mongoose.connection.close();
  }
}

testPermissions(); 