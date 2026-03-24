import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
    providedIn: 'root'
})
export class PdfService {

    constructor() { }

    async generateReclamationPdf(reclamation: any, user: any) {
        // Create the hidden template div
        const container = document.createElement('div');
        container.style.width = '210mm';
        container.style.padding = '15mm';
        container.style.background = 'white';
        container.style.fontFamily = "'Inter', 'Segoe UI', Roboto, sans-serif";
        container.style.color = '#1e293b';
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.zIndex = '-1';
        container.style.boxSizing = 'border-box';

        // Add Google Font for signature
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        const dateStr = new Date(reclamation.dateCreation).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const town = user?.adresse?.ville || reclamation.gouvernorat || 'Tunis';

        let proofsHtml = '';
        if (reclamation.preuves && reclamation.preuves.length > 0) {
            proofsHtml = `
                <div style="margin-top: 40px; page-break-before: auto;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
                        <span style="background: #3b82f6; color: white; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 12px;">ANNEXE</span>
                        <h3 style="font-size: 16px; margin: 0; color: #1e293b;">Pièces Jointes & Preuves</h3>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        ${reclamation.preuves.map((file: string) => {
                const isImg = file.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i);
                const url = file.startsWith('http') ? file : `http://localhost:5000/uploads/${file}`;
                if (isImg) {
                    return `
                                    <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #f8fafc;">
                                        <div style="height: 45mm; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #eee;">
                                            <img src="${url}" crossorigin="anonymous" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                        </div>
                                        <div style="padding: 8px; font-size: 10px; color: #64748b; background: white; text-align: center; border-top: 1px solid #f1f5f9; font-family: monospace;">
                                            ${file}
                                        </div>
                                    </div>
                                `;
                } else {
                    return `
                                    <div style="border: 1px dashed #cbd5e1; border-radius: 12px; background: #f8fafc; padding: 15px; display: flex; align-items: center; gap: 15px;">
                                        <div style="background: #fff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">📄</div>
                                        <div style="overflow: hidden;">
                                            <p style="margin: 0; font-weight: 600; font-size: 12px; color: #1e293b; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${file}</p>
                                            <p style="margin: 0; font-size: 10px; color: #94a3b8;">Document justificatif</p>
                                        </div>
                                    </div>
                                `;
                }
            }).join('')}
                    </div>
                </div>
            `;
        }

        const isPro = reclamation.complainantType === 'professionnel';
        const emitterName = isPro ? reclamation.raison_sociale : `${user?.prenom} ${user?.nom}`;

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px;">
                <div>
                    <h1 style="font-size: 32px; font-weight: 900; color: #1e3a8a; margin: 0; letter-spacing: -1px;">OTIC</h1>
                    <p style="margin: 0; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">République Tunisienne</p>
                    <p style="margin: 0; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Protecteur du Consommateur</p>
                </div>
                <div style="text-align: right;">
                    <div style="background: #0f172a; color: white; padding: 10px 20px; border-radius: 10px; display: inline-block; text-align: left;">
                        <span style="font-size: 9px; text-transform: uppercase; color: #94a3b8; display: block; margin-bottom: 2px;">Identification Dossier</span>
                        <span style="font-size: 18px; font-weight: 800; font-family: 'Courier New', Courier, monospace;">#${reclamation.trackingCode}</span>
                    </div>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 40px; gap: 40px;">
                <div style="flex: 1; border-left: 4px solid #3b82f6; padding-left: 20px;">
                    <h3 style="font-size: 10px; text-transform: uppercase; color: #3b82f6; margin-bottom: 12px; letter-spacing: 1.5px;">ÉMETTEUR</h3>
                    <p style="margin: 4px 0; font-weight: 800; font-size: 16px; color: #0f172a;">${emitterName}</p>
                    <div style="font-size: 13px; color: #475569; line-height: 1.6;">
                        ${isPro ? `<span style="font-weight: 700; color: #1e3a8a;">MF: ${reclamation.matricule_fiscal || 'N/A'}</span><br>` : ''}
                        <span>📞 ${user?.telephone || 'Non spécifié'}</span><br>
                        <span>📧 ${user?.email || 'N/A'}</span><br>
                        <span>📍 ${user?.adresse?.ville || 'Tunis'}, ${user?.adresse?.region || ''}</span><br>
                        <span style="font-weight: 600;">CP: ${user?.adresse?.codePostal || ''}</span>
                        ${isPro ? `<br><span style="font-size: 11px; margin-top: 5px; display: block;">Représenté par: ${user?.prenom} ${user?.nom}</span>` : ''}
                    </div>
                </div>
                <div style="flex: 1; text-align: right;">
                    <h3 style="font-size: 10px; text-transform: uppercase; color: #64748b; margin-bottom: 12px; letter-spacing: 1.5px;">DESTINATAIRE</h3>
                    <p style="margin: 4px 0; font-weight: 800; font-size: 16px; color: #0f172a;">${reclamation.operateur || 'Entreprise Concernée'}</p>
                    <p style="margin: 2px 0; font-size: 13px; color: #64748b;">Service Après-Vente / Qualité</p>
                    <div style="margin-top: 25px;">
                        <p style="font-size: 13px; color: #334155;">Fait à <strong>${town}</strong>,</p>
                        <p style="font-size: 13px; color: #334155;">Le ${dateStr}</p>
                    </div>
                </div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px 25px; border-radius: 12px; margin-bottom: 35px; border-left: 6px solid #1e3a8a;">
                <h4 style="margin: 0; font-size: 14px; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px;">
                    Objet : Réclamation Formelle relative à un ${reclamation.type.toUpperCase()}
                </h4>
            </div>

            <div style="line-height: 1.8; font-size: 14px; text-align: justify; color: #334155;">
                <p>Madame, Monsieur,</p>

                <p>
                    Je souhaite attirer votre attention sur un incident survenu récemment concernant vos prestations de services 
                    dans le secteur de <strong>${reclamation.secteur}</strong>. Ce dossier est officiellement enregistré auprès 
                    de l'OTIC sous le numéro de suivi <strong>${reclamation.trackingCode}</strong>.
                </p>

                <div style="margin: 30px 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                    <div style="background: #f1f5f9; padding: 10px 20px; border-bottom: 1px solid #e2e8f0;">
                         <span style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">Synthèse de l'incident</span>
                    </div>
                    <div style="padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <span style="display: block; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Domaine spécifique</span>
                            <span style="font-weight: 600; color: #1e293b;">${reclamation.sous_secteur || 'Général'}</span>
                        </div>
                        <div>
                            <span style="display: block; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Nature du grief</span>
                            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                                ${(reclamation.natures || []).map((n: string) => `<span style="background: #3b82f6; color: #fff; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${n}</span>`).join('')}
                                ${reclamation.autre_nature ? `<span style="background: #64748b; color: #fff; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600;">Autre</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <p style="font-weight: 800; color: #0f172a; margin-bottom: 10px; text-decoration: underline;">DESCRIPTION DES FAITS :</p>
                <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; color: #1e293b; font-style: italic; min-height: 120px; font-size: 13.5px;">
                    ${reclamation.description || 'Description non détaillée.'}
                </div>

                <!-- Page 2 top spacer -->
                <div style="height: 25mm; display: block;"></div>

                <!-- Formal demand block -->
                <div style="margin-top: 0; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 14px; padding: 20px 24px; position: relative; overflow: hidden;">
                    <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: linear-gradient(180deg, #3b82f6, #1d4ed8); border-radius: 4px;"></div>
                    <p style="margin: 0 0 10px 12px; font-size: 13px; color: #1e3a8a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">📋 Demande formelle</p>
                    <p style="margin: 0 0 0 12px; font-size: 13px; color: #1e40af; line-height: 1.7;">
                        Je vous demande de bien vouloir examiner cette réclamation avec toute l'attention requise et de m'informer
                        des suites que vous comptez y donner dans un délai raisonnable. Je joins au présent envoi les pièces justificatives appuyant mes dires.
                    </p>
                </div>

                <!-- Formal closing -->
                <div style="margin-top: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 24px;">
                    <p style="margin: 0; font-size: 13px; color: #475569; font-style: italic; line-height: 1.7; text-align: center;">
                        Je reste dans l'attente de votre réponse et vous prie d'agréer, Madame, Monsieur,
                        l'assurance de mes <strong style="color: #1e293b;">salutations les plus distinguées</strong>.
                    </p>
                </div>
            </div>

            <!-- Premium Signature Zone -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; margin-bottom: 80px; gap: 30px;">
                <!-- Date & Location -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 22px; min-width: 50mm;">
                    <p style="font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: 800; letter-spacing: 1.5px; margin: 0 0 8px 0;">Lieu & Date</p>
                    <p style="font-size: 13px; font-weight: 700; color: #1e293b; margin: 0 0 2px 0;">📍 ${town}</p>
                    <p style="font-size: 12px; color: #475569; margin: 0;">🗓 ${dateStr}</p>
                </div>

                <!-- Signature Block -->
                <div style="flex: 1; max-width: 75mm;">
                    <div style="border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
                        <!-- Top label bar -->
                        <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 8px 16px;">
                            <span style="font-size: 9px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">Signature & Cachet du Déclarant</span>
                        </div>
                        <!-- Signature area -->
                        <div style="background: #fff; padding: 18px 20px; text-align: center; min-height: 55px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                            <p style="font-family: 'Dancing Script', cursive; font-size: 28px; font-weight: 700; color: #1e3a8a; margin: 0 0 4px 0;">${user?.prenom} ${user?.nom}</p>
                            ${isPro ? `<p style="font-size: 10px; font-weight: 800; color: #64748b; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;">Pour ${reclamation.raison_sociale}</p>` : ''}
                        </div>
                        <!-- Bottom stamp hint -->
                        <div style="background: #f8fafc; border-top: 1px dashed #e2e8f0; padding: 8px 16px; text-align: center;">
                            <span style="font-size: 9px; color: #94a3b8; font-style: italic;">Lu et approuvé — Original signé</span>
                        </div>
                    </div>
                </div>
            </div>

            ${proofsHtml}

            <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 18mm; background: #f8fafc; display: flex; align-items: center; justify-content: space-between; padding: 0 15mm; color: #64748b; font-size: 10px; border-top: 1px solid #e2e8f0;">
                 <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="background: #1e3a8a; color: white; width: 30px; height: 30px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px;">O</div>
                    <div>
                        <span style="font-weight: 800; display: block; color: #1e3a8a;">OTIC TUNISIE 2026</span>
                        <span>Plateforme de gestion centralisée</span>
                    </div>
                </div>
                <div style="text-align: right; line-height: 1.4;">
                    <span>Document généré via le portail officiel <strong>www.otic.tn</strong></span><br>
                    <span>Email: support@otic.tn | Tél: 71 000 000</span>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        try {
            // Pre-load images to ensure they appear in canvas
            const imgElements = container.getElementsByTagName('img');
            const imgPromises = Array.from(imgElements).map(img => {
                return new Promise((resolve) => {
                    if (img.complete) resolve(true);
                    else {
                        img.onload = () => resolve(true);
                        img.onerror = () => resolve(false);
                    }
                });
            });
            await Promise.all(imgPromises);

            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 794, // Approx A4 width in pixels at 96dpi
                windowHeight: container.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Handle multi-paging
            let heightLeft = imgHeight;
            let position = 0;
            const pageHeight = 297;

            while (heightLeft > 0) {
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
                heightLeft -= pageHeight;
                position -= pageHeight;
                if (heightLeft > 0) {
                    pdf.addPage();
                }
            }

            pdf.save(`Réclamation_OTIC_${reclamation.trackingCode}_Officielle.pdf`);
        } catch (error) {
            console.error('PdfService: Generation Error', error);
        } finally {
            document.body.removeChild(container);
        }
    }
}
