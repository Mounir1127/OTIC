const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Reclamation = require('../models/Reclamation');
const WaterBrand = require('../models/WaterBrand');
const ThermalBath = require('../models/ThermalBath');

// Local middleware for admin check
const adminAuth = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || (user.role !== 'super_admin' && user.role !== 'admin_regional' && user.role !== 'admin_tre')) {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }
        next();
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// @route   POST api/chatbot
// @desc    Chat with AI assistant (Streaming version)
// @access  Public
router.post('/', async (req, res) => {
    const { message, userType } = req.body;

    if (!message) {
        return res.status(400).json({ msg: 'Please provide a message' });
    }

    // Processing...

    try {
        console.log(`[Chatbot] Message from ${userType}: ${message.substring(0, 30)}...`);

        // Fetch catalogs for AI context
        const waterBrands = await WaterBrand.find({}, 'marque tds ph notes');
        const thermalBaths = await ThermalBath.find({}, 'name location type temperature indications');

        const waterList = waterBrands.map(b => `${b.marque} (PH: ${b.ph}, TDS: ${b.tds})`).join(', ');
        const bathList = thermalBaths.map(b => `${b.name} (${b.type} à ${b.location})`).join(' | ');

        const systemPrompt = `Tu es le chatbot officiel de l’OTIC (Organisation Tunisienne pour l’Information du Consommateur).
        Ton rôle est de répondre exclusivement aux questions liées aux droits des consommateurs en Tunisie.

        DOMAINES DE COMPÉTENCE :
        - Garantie, remboursement et retour de produits.
        - Réclamations et fraudes commerciales.
        - Qualité des services (Internet, Téléphone, Énergie, Achats).
        - Qualité et normes des Eaux Minérales (Marques disponibles : ${waterList}).
        - Droits dans les Stations Thermales et Thalassothérapie (Bains disponibles : ${bathList}).

        CONSIGNES :
        1. Réponds de manière claire, simple et très concise.
        2. Utilise le Français ou l'Arabe facile selon la langue de l'utilisateur.
        3. SI LA QUESTION EST HORS SUJET (non liée aux droits du consommateur ou à l'OTIC), RÉPONDS EXACTEMENT : 
           "Cette question est hors du domaine de l’OTIC. Je peux uniquement vous aider sur les droits des consommateurs."

        Utilise les listes de marques et de stations fournies pour étayer tes réponses si nécessaire, mais garde toujours l'angle de "l'Information du Consommateur".`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:4300',
                'X-Title': 'OTIC Chatbot'
            },
            body: JSON.stringify({
                model: 'openrouter/auto',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                stream: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorDetail = {};
            try { errorDetail = JSON.parse(errorText); } catch (e) { errorDetail = { raw: errorText }; }
            console.error('OpenRouter Error:', errorDetail);
            return res.status(response.status).json({ msg: 'Erreur API OpenRouter', detail: errorDetail });
        }

        // Set headers for SSE only AFTER we are sure the AI is responding
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        const decoder = new TextDecoder();
        let buffer = '';

        for await (const chunk of response.body) {
            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep partial line in buffer

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('data: ')) {
                    const data = trimmedLine.slice(6);
                    if (data === '[DONE]') {
                        res.end();
                        return;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        if (content) {
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                        }
                    } catch (e) {
                        // Ignore partial JSON
                    }
                }
            }
        }

        res.end();

    } catch (err) {
        console.error('Streaming Error:', err.message);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
    }
});


// @route   POST api/chatbot/copilot
// @desc    Generate professional response for a reclamation (Streaming version)
// @access  Public
router.post('/copilot', async (req, res) => {
    const { reclamation } = req.body;

    if (!reclamation) {
        return res.status(400).json({ msg: 'Please provide a reclamation object' });
    }

    // Copilot processing...

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:4300',
                'X-Title': 'OTIC Admin Copilot'
            },
            body: JSON.stringify({
                model: 'openrouter/auto',
                messages: [
                    {
                        role: 'system',
                        content: `Tu es le Copilote IA officiel de la plateforme OTIC (Office du Thermalisme et de l'Hydrothérapie en Tunisie). 
                        Ton rôle est d'aider les administrateurs et agents régionaux à rédiger des réponses officielles, professionnelles et courtoises aux réclamations déposées par les citoyens.

                        INSTRUCTIONS DE RÉDACTION :
                        1. Écris une lettre ou un e-mail officiel à destination du citoyen.
                        2. Commencez par des salutations formelles et personnalisées (ex: "Cher(e) Monsieur/Madame [Nom Citoyen]").
                        3. Remercie chaleureusement le citoyen pour sa réclamation et pour sa contribution à l'amélioration de la qualité de nos services thermaux.
                        4. Réfère-toi explicitement aux détails fournis (ex: Secteur [Secteur], Opérateur concerné [Opérateur], Natures du grief [Motifs]).
                        5. Explique les prochaines étapes concrètes entreprises par l'OTIC.
                        6. Garde un ton extrêmement professionnel, rassurant, rigoureux, et respectueux.
                        7. Sois concis et efficace (environ 120-180 mots).
                        8. Termine par une formule de politesse formelle de la part de l'Administration Centrale de l'OTIC.

                        GÉNÈRE UNIQUEMENT LA RÉPONSE OFFICIELLE.`
                    },
                    {
                        role: 'user',
                        content: `Génère une réponse officielle pour la réclamation suivante :
                        - Code Suivi: ${reclamation.trackingCode}
                        - Citoyen: ${reclamation.user?.prenom} ${reclamation.user?.nom}
                        - Secteur: ${reclamation.secteur}
                        - Opérateur: ${reclamation.operateur || 'Non spécifié'}
                        - Type: ${reclamation.type}
                        - Motif/Grief: ${reclamation.natures?.join(', ') || 'Général'}
                        - Description du citoyen: "${reclamation.description}"`
                    }
                ],
                stream: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorDetail = {};
            try { errorDetail = JSON.parse(errorText); } catch (e) { errorDetail = { raw: errorText }; }
            console.error('OpenRouter Copilot Error:', errorDetail);
            return res.status(response.status).json({ msg: 'Erreur API OpenRouter (Copilot)', detail: errorDetail });
        }

        // Set headers for SSE only AFTER we are sure the AI is responding
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const decoder = new TextDecoder();
        let buffer = '';

        for await (const chunk of response.body) {
            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('data: ')) {
                    const data = trimmedLine.slice(6);
                    if (data === '[DONE]') {
                        res.end();
                        return;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        if (content) {
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                        }
                    } catch (e) {
                        // Ignore partial JSON
                    }
                }
            }
        }

        res.end();

    } catch (err) {
        console.error('Copilot Streaming Error:', err.message);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
    }
});

// @route   POST api/chatbot/admin
// @desc    Admin Chatbot with access to system stats
// @access  Private (Admin)
router.post('/admin', [auth, adminAuth], async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ msg: 'Please provide a message' });
    }

    // Admin processing...

    try {
        console.log(`[AdminChat] Processing request for ${req.user.id}`);
        // Fetch real-time stats for the AI
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const totalReclamations = await Reclamation.countDocuments();
        const reclamationsByStatus = await Reclamation.aggregate([
            { $group: { _id: '$statut', count: { $sum: 1 } } }
        ]);

        const statusMap = reclamationsByStatus.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        // Fetch most active user (by reclamation count)
        const activeUserList = await Reclamation.aggregate([
            { $group: { _id: '$user', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDetails' } }
        ]);
        const topUser = activeUserList.length > 0 ? activeUserList[0]?.userDetails[0] : null;
        const topUserText = topUser ? `${topUser.prenom} ${topUser.nom} (${activeUserList[0].count} réclamations)` : 'N/A';

        const statsContext = `
        CONTEXTE SYSTÈME (STATISTIQUES RÉELLES) :
        - Nombre total d'utilisateurs : ${totalUsers}
        - Utilisateurs actifs : ${activeUsers}
        - Total des réclamations : ${totalReclamations}
        - Distribution par statut :
          * Déposées : ${statusMap['deposee'] || 0}
          * En cours : ${statusMap['en_cours'] || 0}
          * Résolues : ${statusMap['resolue'] || 0}
          * Rejetées : ${statusMap['rejete'] || 0}
        - Utilisateur le plus actif : ${topUserText}
        `;

        const systemPrompt = `Tu es le Copilote IA de l'Administration OTIC. 
        Ton rôle est d'assister les administrateurs en répondant à leurs questions sur le fonctionnement du site et sur les données statistiques.
        Tu as accès aux données suivantes en temps réel :
        ${statsContext}
        Réponds de manière professionnelle, précise et directe. Si on te demande des statistiques, utilise les chiffres fournis ci-dessus.`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:4300',
                'X-Title': 'OTIC Admin Analytics Copilot'
            },
            body: JSON.stringify({
                model: 'openrouter/auto',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                stream: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorDetail = {};
            try { errorDetail = JSON.parse(errorText); } catch (e) { errorDetail = { raw: errorText }; }
            console.error('OpenRouter Admin Error:', errorDetail);
            return res.status(response.status).json({ msg: 'Erreur API OpenRouter (Admin)', detail: errorDetail });
        }

        // Set headers for SSE only AFTER we are sure the AI is responding
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        const decoder = new TextDecoder();
        let buffer = '';

        for await (const chunk of response.body) {
            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('data: ')) {
                    const data = trimmedLine.slice(6);
                    if (data === '[DONE]') {
                        res.end();
                        return;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        if (content) {
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                        }
                    } catch (e) {
                        // Ignore partial JSON
                    }
                }
            }
        }
        res.end();

    } catch (err) {
        console.error('Admin Chat Streaming Error:', err.message);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
    }
});

module.exports = router;
