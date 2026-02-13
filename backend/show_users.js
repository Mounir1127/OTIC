require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const showUsers = async () => {
    try {
        const dbUri = process.env.MONGODB_URI;

        console.log('\n🔌 Connexion à la base de données...');
        console.log('   URI:', dbUri);

        await mongoose.connect(dbUri);
        console.log('✅ Connecté avec succès!\n');

        const users = await User.find({}).select('-password');

        console.log('================================================================================');
        console.log(`📊 BASE DE DONNÉES: ${dbUri}`);
        console.log(`👥 NOMBRE TOTAL D'UTILISATEURS: ${users.length}`);
        console.log('================================================================================\n');

        if (users.length === 0) {
            console.log('❌ Aucun utilisateur trouvé dans la base de données.\n');
        } else {
            users.forEach((user, index) => {
                console.log(`\n┌─ 👤 UTILISATEUR #${index + 1} ${'─'.repeat(60)}`);
                console.log(`│`);
                console.log(`│  🆔 ID:          ${user._id}`);
                console.log(`│  👤 Nom:         ${user.nom}`);
                console.log(`│  👤 Prénom:      ${user.prenom}`);
                console.log(`│  📧 Email:       ${user.email}`);
                console.log(`│  📱 Téléphone:   ${user.telephone}`);
                console.log(`│  🎭 Rôle:        ${user.role}`);
                console.log(`│  📷 Photo:       ${user.photoProfil || 'Aucune'}`);

                if (user.adresse) {
                    if (typeof user.adresse === 'object' && user.adresse !== null) {
                        console.log(`│  🏠 Adresse:`);
                        console.log(`│     └─ Ville:       ${user.adresse.ville || 'N/A'}`);
                        console.log(`│     └─ Région:      ${user.adresse.region || 'N/A'}`);
                        console.log(`│     └─ Code Postal: ${user.adresse.codePostal || 'N/A'}`);
                    } else {
                        console.log(`│  ⚠️ Adresse (Format Incorrect): ${JSON.stringify(user.adresse)}`);
                    }
                } else {
                    console.log(`│  🏠 Adresse:     Non renseignée`);
                }

                console.log(`│`);
                console.log(`└${'─'.repeat(79)}\n`);
            });
        }

        console.log('================================================================================');
        console.log('✅ Affichage terminé');
        console.log('================================================================================\n');

        await mongoose.connection.close();
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Erreur:', err.message);
        console.error('Détails:', err);
        process.exit(1);
    }
};

showUsers();
