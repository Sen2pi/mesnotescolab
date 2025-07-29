const mongoose = require('mongoose');
const Note = require('./models/Note');

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mesnotescolab');

async function testPermissions() {
  try {
    console.log('🧪 Testando permissões...');
    
    // Buscar a nota específica
    const note = await Note.findById('688290afd14a2a2a4fe3028a')
      .populate('auteur', 'nom email avatar')
      .populate('collaborateurs.userId', 'nom email avatar');
    
    if (!note) {
      console.log('❌ Nota não encontrada');
      return;
    }
    
    console.log('📝 Nota encontrada:', {
      id: note._id,
      titulo: note.titre,
      autor: note.auteur._id,
      autorNome: note.auteur.nom
    });
    
    const userId = '68829094d14a2a2a4fe30276';
    
    console.log('\n🔍 Testando permissões para usuário:', userId);
    console.log('🔍 Autor da nota:', note.auteur._id);
    console.log('🔍 São iguais?', userId === note.auteur._id.toString());
    
    // Testar diferentes permissões
    const permissions = ['lecture', 'ecriture', 'admin'];
    
    for (const permission of permissions) {
      console.log(`\n🧪 Testando permissão: ${permission}`);
      const hasPermission = note.hasPermission(userId, permission);
      console.log(`✅ Resultado: ${hasPermission}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    mongoose.connection.close();
  }
}

testPermissions(); 