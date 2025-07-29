document.addEventListener('DOMContentLoaded', () => {
    const xmlFileInput = document.getElementById('xmlFileInput');
    const convertBtn = document.getElementById('convertBtn');
    const resultArea = document.getElementById('resultArea');
    const statusMessage = document.getElementById('statusMessage');

    console.log('Script initialisé. Prêt à convertir.');

    convertBtn.addEventListener('click', () => {
        console.log('Bouton "Convertir" cliqué.');
        resultArea.innerHTML = '';
        statusMessage.textContent = '';

        if (!xmlFileInput.files || xmlFileInput.files.length === 0) {
            console.error('Aucun fichier sélectionné.');
            statusMessage.textContent = 'Veuillez d\'abord sélectionner un fichier XML.';
            return;
        }

        const file = xmlFileInput.files[0];
        const reader = new FileReader();
        console.log(`Lecture du fichier : ${file.name}`);

        reader.onload = (e) => {
            console.log('Fichier lu avec succès.');
            const xmlInputString = e.target.result;
            const originalFileName = file.name;

            try {
                console.log('Début de la conversion SEPA...');
                const transformedXml = convertSepaXml(xmlInputString);
                console.log('Conversion terminée avec succès.');

                const outputFileName = originalFileName.replace(/(\ .xml)$/i, '_pain00100103.xml')
                                                       .replace(/pain\.001\.001\.02/i, 'pain.001.001.03');

                displayDownloadLink(transformedXml, outputFileName);
                statusMessage.textContent = 'Conversion réussie !';
                statusMessage.style.color = '#2ecc71';
            } catch (error) {
                console.error('Une erreur est survenue pendant la conversion:', error);
                statusMessage.textContent = `Une erreur est survenue : ${error.message}`;
                statusMessage.style.color = '#e74c3c';
            }
        };

        reader.onerror = (error) => {
            console.error('Erreur de lecture du fichier:', error);
            statusMessage.textContent = 'Erreur lors de la lecture du fichier.';
            statusMessage.style.color = '#e74c3c';
        };

        reader.readAsText(file, 'UTF-8');
    });

    function convertSepaXml(xmlInputString) {
        let transformedXml = xmlInputString;

        // ... (le reste de la fonction de conversion reste identique)
        // 1. Changer la déclaration XML
        transformedXml = transformedXml.replace(
            /<\?xml version="1.0" encoding="utf-8"\?>/i,
            '<\?xml version="1.0" encoding="UTF-8" standalone="no" \?>'
        );
        if (!transformedXml.toLowerCase().startsWith('<\?xml')) {
            transformedXml = '<\?xml version="1.0" encoding="UTF-8" standalone="no" \?>\n' + transformedXml;
        } else if (transformedXml.toLowerCase().startsWith('<\?xml') && !transformedXml.includes('standalone="no"')) {
            transformedXml = transformedXml.replace(
                /<\?xml.*?\?>/i,
                '<\?xml version="1.0" encoding="UTF-8" standalone="no" \?>'
            );
        }

        // 2. Changer le namespace et la balise racine
        transformedXml = transformedXml.replace(
            'xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.02"',
            'xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03"'
        );
        transformedXml = transformedXml.replace(
            /<pain\.001\.001\.02>/g,
            '<CstmrCdtTrfInitn>'
        );
        transformedXml = transformedXml.replace(
            /<\/pain\.001\.001\.02>/g,
            '<\/CstmrCdtTrfInitn>'
        );

        // 3. Modifier <GrpHdr>
        transformedXml = transformedXml.replace(/<GrpHdr>([\s\S]*?)<\/GrpHdr>/s, (match, grpHdrContent) => {
            let modifiedGrpHdrContent = grpHdrContent;
            modifiedGrpHdrContent = modifiedGrpHdrContent.replace(/\s*<Grpg>.*?<\/Grpg>\s*/s, '\n');
            modifiedGrpHdrContent = modifiedGrpHdrContent.replace(
                /(<InitgPty>\s*<Nm>[\s\S]*?<\/Nm>)\s*<Id>[\s\S]*?<\/Id>(\s*<\/InitgPty>)/s,
                '$1$2'
            );
            return `<GrpHdr>${modifiedGrpHdrContent}<\/GrpHdr>`;
        });

        // 4. Modifier <PmtInf>
        transformedXml = transformedXml.replace(/<PmtInf>([\s\S]*?)<\/PmtInf>/gs, (match, pmtInfBlockContent) => {
            let modifiedPmtInfBlock = pmtInfBlockContent;
            const cdtTrfTxInfOccurrences = (pmtInfBlockContent.match(/<CdtTrfTxInf>/g) || []).length;
            const nbOfTxsValue = cdtTrfTxInfOccurrences > 0 ? cdtTrfTxInfOccurrences : 1;
            const pmtMtdMatch = modifiedPmtInfBlock.match(/^(\s*)<PmtMtd>/m);
            const indentation = pmtMtdMatch ? pmtMtdMatch[1] : '            ';
            const pmtMtdClosingTag = '<\/PmtMtd>';
            modifiedPmtInfBlock = modifiedPmtInfBlock.replace(
                pmtMtdClosingTag,
                `${pmtMtdClosingTag}\n${indentation}<NbOfTxs>${nbOfTxsValue}<\/NbOfTxs>`
            );
            return `<PmtInf>${modifiedPmtInfBlock}<\/PmtInf>`;
        });

        return transformedXml;
    }

    function displayDownloadLink(xmlString, fileName) {
        console.log(`Création du lien de téléchargement pour : ${fileName}`);
        const blob = new Blob([xmlString], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = fileName;
        downloadLink.textContent = `3. Télécharger ${fileName}`;

        resultArea.innerHTML = ''; // Clear previous links
        resultArea.appendChild(downloadLink);
        console.log('Lien de téléchargement affiché.');
    }
});