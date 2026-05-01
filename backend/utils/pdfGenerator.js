const PDFDocument = require('pdfkit');

/**
 * Generates a PDF buffer for a specific reclamation
 * @param {object} reclamation - The reclamation object from DB
 * @returns {Promise<Buffer>} - A promise that resolves to the PDF buffer
 */
const generateReclamationPDF = (reclamation) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        // --- Header ---
        doc.fillColor('#1e3a8a')
           .fontSize(20)
           .text('PLATAFORME OTIC', { align: 'center' })
           .fontSize(12)
           .text('Organisation Tunisienne pour l\'Information du Consommateur', { align: 'center' })
           .moveDown(1.5);

        doc.fillColor('#000000')
           .strokeColor('#e2e8f0')
           .lineWidth(1)
           .moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke()
           .moveDown(1.5);

        // --- Title ---
        doc.fontSize(16)
           .fillColor('#1e3a8a')
           .text(`Détails de la Réclamation: ${reclamation.trackingCode}`, { underline: true })
           .moveDown(1);

        // --- Content ---
        doc.fontSize(12).fillColor('#334155');

        const drawField = (label, value) => {
            doc.font('Helvetica-Bold').text(`${label}: `, { continued: true })
               .font('Helvetica').text(value || 'N/A')
               .moveDown(0.5);
        };

        drawField('Status', (reclamation.statut || '').replace(/_/g, ' ').toUpperCase());
        drawField('Type', reclamation.type);
        drawField('Secteur', reclamation.secteur);
        drawField('Gouvernorat', reclamation.gouvernorat);
        drawField('Opérateur', reclamation.operateur);
        drawField('Priorité', reclamation.priorite);
        drawField('Date de Création', new Date(reclamation.dateCreation).toLocaleDateString('fr-FR'));

        doc.moveDown(1);
        doc.font('Helvetica-Bold').text('Description:');
        doc.font('Helvetica').fontSize(11).text(reclamation.description || 'Aucune description fournie.', {
            align: 'justify',
            lineGap: 2
        });

        // --- Footer ---
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(10)
               .fillColor('#94a3b8')
               .text(
                   'Document généré par OTIC Digital Services - © 2026',
                   50,
                   doc.page.height - 50,
                   { align: 'center' }
               );
        }

        doc.end();
    });
};

module.exports = { generateReclamationPDF };
