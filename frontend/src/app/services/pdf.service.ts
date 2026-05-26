import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as QRCode from 'qrcode';

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
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
                        <span style="background: #000; color: white; padding: 4px 10px; border-radius: 4px; font-weight: 800; font-size: 11px;">ANNEXE</span>
                        <h3 style="font-size: 16px; margin: 0; color: #000; text-transform: uppercase; letter-spacing: 1px;">Pièces Jointes & Preuves</h3>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        ${reclamation.preuves.map((file: string) => {
                const isImg = file.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i);
                const url = file.startsWith('http') ? file : `http://localhost:5000/uploads/${file}`;
                if (isImg) {
                    return `
                                    <div style="border: 1px solid #000; border-radius: 4px; overflow: hidden; background: #fff;">
                                        <div style="height: 45mm; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f8f8f8;">
                                            <img src="${url}" crossorigin="anonymous" style="max-width: 100%; max-height: 100%; object-fit: contain; filter: grayscale(100%);">
                                        </div>
                                        <div style="padding: 8px; font-size: 9px; color: #000; background: #f8f8f8; text-align: center; border-top: 1px solid #000; font-family: monospace; font-weight: 700;">
                                            ${file}
                                        </div>
                                    </div>
                                `;
                } else {
                    return `
                                    <div style="border: 1px dashed #000; border-radius: 4px; background: #fff; padding: 15px; display: flex; align-items: center; gap: 15px;">
                                        <div style="background: #000; width: 32px; height: 32px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: white;">📄</div>
                                        <div style="overflow: hidden;">
                                            <p style="margin: 0; font-weight: 700; font-size: 11px; color: #000; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; text-transform: uppercase;">${file}</p>
                                            <p style="margin: 0; font-size: 9px; color: #666;">DOCUMENT JUSTIFICATIF</p>
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
            <!-- HEADER -->
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 50px; border-bottom: 3px solid #000; padding-bottom: 20px;">
                <div>
                    <h1 style="font-size: 42px; font-weight: 900; color: #000; margin: 0; letter-spacing: -2px; line-height: 1;">OTIC</h1>
                    <p style="margin: 5px 0 0 0; font-size: 11px; color: #000; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Office du Thermalisme</p>
                    <p style="margin: 0; font-size: 11px; color: #000; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">et de l'Hydrothérapie</p>
                </div>
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="text-align: right;">
                        <span style="font-size: 10px; text-transform: uppercase; color: #666; font-weight: 800; display: block; letter-spacing: 1px;">Référence Dossier</span>
                        <span style="font-size: 22px; font-weight: 900; color: #000; font-family: monospace;">#${reclamation.trackingCode}</span>
                    </div>
                    ${reclamation.qrCode ? `
                        <div style="padding: 5px; background: white; border: 1px solid #000; border-radius: 4px;">
                            <img src="${reclamation.qrCode}" style="width: 60px; height: 60px;">
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- ADRESSES -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 50px; gap: 60px;">
                <div style="flex: 1;">
                    <h3 style="font-size: 11px; text-transform: uppercase; color: #fff; background: #000; padding: 4px 10px; margin-bottom: 15px; letter-spacing: 2px; display: inline-block;">ÉMETTEUR</h3>
                    <p style="margin: 5px 0; font-weight: 900; font-size: 18px; color: #000; text-transform: uppercase;">${emitterName}</p>
                    <div style="font-size: 13px; color: #000; line-height: 1.5; font-weight: 500;">
                        ${isPro ? `<span style="font-weight: 800;">MATRICULE FISCAL: ${reclamation.matricule_fiscal || 'N/A'}</span><br>` : ''}
                        <span>TEL: ${user?.telephone || 'Non spécifié'}</span><br>
                        <span>EMAIL: ${user?.email || 'N/A'}</span><br>
                        <span>ADRESSE: ${user?.adresse?.ville || 'Tunis'}, ${user?.adresse?.region || ''}</span><br>
                        <span>CODE POSTAL: ${user?.adresse?.codePostal || ''}</span>
                    </div>
                </div>
                <div style="flex: 1; text-align: right;">
                    <h3 style="font-size: 11px; text-transform: uppercase; color: #000; border: 1.5px solid #000; padding: 3px 10px; margin-bottom: 15px; letter-spacing: 2px; display: inline-block;">DESTINATAIRE</h3>
                    <p style="margin: 5px 0; font-weight: 900; font-size: 18px; color: #000; text-transform: uppercase;">${reclamation.operateur || 'Entreprise Concernée'}</p>
                    <p style="margin: 2px 0; font-size: 13px; color: #000; font-weight: 700;">Service Client / Direction Qualité</p>
                    <div style="margin-top: 30px;">
                        <p style="font-size: 13px; color: #000;">Fait à <strong>${town.toUpperCase()}</strong>,</p>
                        <p style="font-size: 13px; color: #000;">Le <strong>${dateStr.toUpperCase()}</strong></p>
                    </div>
                </div>
            </div>

            <!-- OBJET -->
            <div style="background: #000; color: #fff; padding: 12px 20px; margin-bottom: 40px; text-align: center;">
                <h4 style="margin: 0; font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">
                    Objet : Dossier de Réclamation Officiel — ${reclamation.type.toUpperCase()}
                </h4>
            </div>

            <!-- CORPS -->
            <div style="line-height: 1.6; font-size: 14px; text-align: justify; color: #000; font-weight: 500;">
                <p style="font-weight: 700;">Madame, Monsieur,</p>

                <p>
                    Par la présente, je porte officiellement à votre connaissance une réclamation concernant vos activités dans le secteur de 
                    <strong>${reclamation.secteur.toUpperCase()}</strong>. Cette démarche est enregistrée au niveau de la plateforme centrale 
                    de l'OTIC sous l'identifiant unique <strong>${reclamation.trackingCode}</strong>.
                </p>

                <div style="margin: 30px 0; border: 2px solid #000; background: #fff;">
                    <div style="background: #000; color: #fff; padding: 8px 15px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                        Résumé Technique du Dossier
                    </div>
                    <div style="padding: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <span style="display: block; font-size: 9px; color: #666; text-transform: uppercase; font-weight: 900; margin-bottom: 2px;">Sous-Secteur</span>
                            <span style="font-weight: 800; color: #000; text-transform: uppercase;">${reclamation.sous_secteur || 'GÉNÉRAL'}</span>
                        </div>
                        <div>
                            <span style="display: block; font-size: 9px; color: #666; text-transform: uppercase; font-weight: 900; margin-bottom: 2px;">Natures du Grief</span>
                            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                                ${(reclamation.natures || []).map((n: string) => `<span style="border: 1px solid #000; color: #000; font-size: 9px; padding: 2px 6px; font-weight: 800; text-transform: uppercase;">${n}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <p style="font-weight: 900; color: #000; margin-bottom: 10px; border-bottom: 1.5px solid #000; display: inline-block;">EXPOSÉ DES FAITS :</p>
                <div style="background: #f9f9f9; border-left: 5px solid #000; padding: 20px; color: #000; font-style: normal; min-height: 100px; font-size: 13px; line-height: 1.8;">
                    ${reclamation.description || 'Description non détaillée.'}
                </div>

                <div style="margin-top: 30px; border: 1.5px solid #000; padding: 20px; background: #fff;">
                    <p style="margin: 0; font-size: 13px; color: #000; line-height: 1.6;">
                        Je vous invite à procéder à une analyse rigoureuse des faits exposés et à me tenir informé des mesures correctives 
                        que vous comptez mettre en œuvre. À défaut d'une réponse satisfaisante, je me réserve le droit de solliciter 
                        l'intervention directe des autorités compétentes de l'Office du Thermalisme.
                    </p>
                </div>

                <p style="margin-top: 30px; font-size: 13px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                    Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.
                </p>
            </div>

            <!-- SIGNATURE -->
            <div style="display: flex; justify-content: flex-end; margin-top: 50px; margin-bottom: 60px;">
                <div style="width: 80mm; border: 2px solid #000; background: #fff; text-align: center;">
                    <div style="background: #000; color: #fff; padding: 5px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                        Signature & Cachet
                    </div>
                    <div style="padding: 20px; min-height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <p style="font-family: 'Dancing Script', cursive; font-size: 32px; font-weight: 900; color: #000; margin: 0;">${user?.prenom} ${user?.nom}</p>
                        ${isPro ? `<p style="font-size: 10px; font-weight: 900; color: #000; margin-top: 5px; text-transform: uppercase;">POUR ${reclamation.raison_sociale.toUpperCase()}</p>` : ''}
                    </div>
                    <div style="border-top: 1px dashed #000; padding: 5px; font-size: 8px; color: #666; font-style: italic;">
                        Document certifié conforme par OTIC
                    </div>
                </div>
            </div>

            ${proofsHtml}

            <!-- FOOTER -->
            <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 15mm; border-top: 2px solid #000; display: flex; align-items: center; justify-content: space-between; padding: 0 15mm; color: #000; font-size: 9px; font-weight: 800;">
                 <div style="text-transform: uppercase; letter-spacing: 1px;">
                    OTIC TUNISIE — PORTAIL OFFICIEL
                </div>
                <div style="text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">
                    ID DOCUMENT: ${reclamation._id.toUpperCase()} | WWW.OTIC.TN
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
                scale: 2.5,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 794,
                windowHeight: container.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

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

            pdf.save(`Réclamation_OTIC_${reclamation.trackingCode}_PRO.pdf`);
        } catch (error) {
            console.error('PdfService: Generation Error', error);
        } finally {
            document.body.removeChild(container);
        }
    }
}
