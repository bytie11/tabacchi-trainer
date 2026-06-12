const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// --- Percorsi ---
const ROOT_DIR = path.resolve(__dirname, '..');
const PRODUCTS_TS_PATH = path.join(ROOT_DIR, 'src/data/products.ts');
const IMAGES_DIR = path.join(ROOT_DIR, 'public/images/products');
const PROCESSED_DIR = path.join(IMAGES_DIR, 'processed');
const REPORT_PATH = path.join(ROOT_DIR, 'IMAGE_MATCH_REPORT.md');

// --- Helper Normalizzazione ---
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD') // Decompone i caratteri accentati (es. è -> e + `)
    .replace(/[\u0300-\u036f]/g, '') // Rimuove i segni di accento
    .replace(/[^a-z0-9]/g, ''); // Rimuove caratteri speciali, spazi, trattini
}

// --- Funzioni Utility per i file ---
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Scansiona i file nella cartella immagini
function scanImagesFolder(folderPath) {
  if (!fs.existsSync(folderPath)) return [];
  return fs.readdirSync(folderPath).filter((file) => {
    const stat = fs.statSync(path.join(folderPath, file));
    if (stat.isDirectory()) return false;
    if (file.startsWith('.')) return false; // Salta file nascosti come .DS_Store
    
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext);
  });
}

// --- Algoritmo di Matching con Confidence Score ---
function getMatchScore(product, filename) {
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext);
  
  const normFile = normalizeString(nameWithoutExt);
  const normId = normalizeString(product.id);
  const normExpected = product.expectedImageFileName ? normalizeString(product.expectedImageFileName) : '';

  // 1. Corrispondenza esatta con ID o expectedImageFileName (Punteggio: 1.0)
  if (normFile === normId || (normExpected && normFile === normExpected)) {
    return { score: 1.0, reason: 'ID o Nome File Atteso corrispondono esattamente' };
  }

  // 2. Corrispondenza esatta con fullName (Punteggio: 0.95)
  const normFullName = normalizeString(product.fullName);
  if (normFile === normFullName) {
    return { score: 0.95, reason: 'Nome completo corrisponde esattamente' };
  }

  // 3. Corrispondenza esatta con productName (Punteggio: 0.90)
  const normProductName = normalizeString(product.productName);
  if (normFile === normProductName) {
    return { score: 0.9, reason: 'Nome prodotto corrisponde esattamente' };
  }

  // 4. Corrispondenza con gli aliases (Punteggio: 0.85)
  if (product.aliases && product.aliases.length > 0) {
    for (const alias of product.aliases) {
      if (normalizeString(alias) === normFile) {
        return { score: 0.85, reason: 'Alias corrisponde esattamente' };
      }
    }
  }

  // 5. Contenimento: il file contiene sia il brand che il productName (Punteggio: 0.80)
  const normBrand = normalizeString(product.brand);
  if (normBrand && normProductName && normFile.includes(normBrand) && normFile.includes(normProductName)) {
    return { score: 0.8, reason: 'Il file contiene sia la marca che il nome del prodotto' };
  }

  // 6. Contenimento parziale dell'ID (Punteggio: 0.70)
  if (normFile.includes(normId) || normId.includes(normFile)) {
    return { score: 0.7, reason: 'Corrispondenza parziale con ID' };
  }

  return { score: 0.0, reason: 'Nessun match trovato' };
}

// --- Lettura / Scrittura delle Proprietà dei Prodotti ---
function replaceOrInsertProperty(block, key, value, isString = true) {
  const propRegex = new RegExp(`(${key}:\\s*)(.*?),?\\n`);
  const formattedValue = isString ? `'${value}'` : value;

  if (propRegex.test(block)) {
    return block.replace(propRegex, `$1${formattedValue},\n`);
  } else {
    // Inserisci subito dopo l'ID per convenzione
    return block.replace(/(id:\s*'[^']+',?\n)/, `$1    ${key}: ${formattedValue},\n`);
  }
}

function removeProperty(block, key) {
  const propRegex = new RegExp(`\\s*${key}:\\s*.*?,?\\n`, 'g');
  return block.replace(propRegex, '\n');
}

// --- COMANDO: PROCESS ---
// Converte le immagini in .webp ottimizzato (max width 800px) usando sips (macOS native)
function processImages() {
  console.log('=== OTTIMIZZAZIONE E CONVERSIONE IMMAGINI ===');
  
  const originalFiles = scanImagesFolder(IMAGES_DIR);
  if (originalFiles.length === 0) {
    console.log(`Nessuna immagine trovata in ${IMAGES_DIR}. Carica i file prima di procedere.`);
    return;
  }

  ensureDirectoryExists(PROCESSED_DIR);
  console.log(`Trovate ${originalFiles.length} immagini originali. Elaborazione in corso...`);
  
  let processedCount = 0;
  let failedCount = 0;

  for (const file of originalFiles) {
    const ext = path.extname(file);
    const nameWithoutExt = path.basename(file, ext);
    const kebabName = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const inputPath = path.join(IMAGES_DIR, file);
    const outWebpName = `${kebabName}.webp`;
    const outputPath = path.join(PROCESSED_DIR, outWebpName);

    console.log(`\nElaborazione di: ${file} -> ${outWebpName}`);

    try {
      // Uso sips per convertire in webp e ridimensionare a max 800px mantenendo proporzioni
      execSync(`sips -s format webp -Z 800 "${inputPath}" --out "${outputPath}"`, { stdio: 'ignore' });
      console.log(`✓ Ottimizzato con successo.`);
      processedCount++;
    } catch (err) {
      console.warn(`⚠️ sips fallito per questo formato. Copio il file originale come fallback.`);
      try {
        const fallbackPath = path.join(PROCESSED_DIR, `${kebabName}${ext}`);
        fs.copyFileSync(inputPath, fallbackPath);
        console.log(`✓ Copiato senza modifiche (${kebabName}${ext}).`);
        processedCount++;
      } catch (copyErr) {
        console.error(`✗ Errore copia fallback per ${file}:`, copyErr.message);
        failedCount++;
      }
    }
  }

  console.log(`\nProcesso completato: ${processedCount} immagini elaborate con successo, ${failedCount} fallite.`);
}

// --- COMANDO: MATCH ---
// Abbina le immagini elaborate ai prodotti nel file products.ts e genera REPORT
function matchImages() {
  console.log('=== ABBINAMENTO IMMAGINI AI PRODOTTI ===');

  if (!fs.existsSync(PRODUCTS_TS_PATH)) {
    console.error(`Errore: File ${PRODUCTS_TS_PATH} non trovato.`);
    return;
  }

  // Leggi le immagini elaborate in processed (se vuoto, usa le originali)
  let scanDir = PROCESSED_DIR;
  let isUsingProcessed = true;
  
  if (!fs.existsSync(PROCESSED_DIR) || scanImagesFolder(PROCESSED_DIR).length === 0) {
    console.log('Processed non trovato o vuoto, uso le immagini originali...');
    scanDir = IMAGES_DIR;
    isUsingProcessed = false;
  }

  const imageFiles = scanImagesFolder(scanDir);
  console.log(`Cartella immagini utilizzata: ${scanDir} (${imageFiles.length} immagini trovate)`);

  let fileContent = fs.readFileSync(PRODUCTS_TS_PATH, 'utf8');
  
  // Regex per catturare ogni singolo blocco di prodotto
  const productBlockRegex = /(\{\s*id:\s*'([^']+)'[\s\S]*?\})/g;
  
  // Liste per generare il report finale
  const matchedList = [];
  const uncertainList = [];
  const unmatchedImages = [...imageFiles];
  const missingImagesProducts = [];

  const updatedContent = fileContent.replace(productBlockRegex, (fullBlock, blockContent, id) => {
    // Estrai info utili dal blocco usando regex veloci
    const brandMatch = blockContent.match(/brand:\s*'([^']+)'/);
    const productNameMatch = blockContent.match(/productName:\s*'([^']+)'/);
    const fullNameMatch = blockContent.match(/fullName:\s*'([^']+)'/);
    
    // Gestione alias
    const aliasesMatch = blockContent.match(/aliases:\s*\[([\s\S]*?)\]/);
    let aliases = [];
    if (aliasesMatch && aliasesMatch[1]) {
      aliases = aliasesMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    }

    // Gestione expectedImageFileName
    const expectedMatch = blockContent.match(/expectedImageFileName:\s*'([^']+)'/);
    const expectedImageFileName = expectedMatch ? expectedMatch[1] : null;

    const product = { id, brand: brandMatch ? brandMatch[1] : '', productName: productNameMatch ? productNameMatch[1] : '', fullName: fullNameMatch ? fullNameMatch[1] : '', aliases, expectedImageFileName };

    // Trova il miglior match
    let bestMatch = null;
    let bestScore = 0.0;
    let bestReason = '';

    for (const imageFile of imageFiles) {
      const { score, reason } = getMatchScore(product, imageFile);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = imageFile;
        bestReason = reason;
      }
    }

    const MATCH_THRESHOLD = 0.65;
    let updatedBlock = blockContent;

    if (bestMatch && bestScore >= MATCH_THRESHOLD) {
      // Trovato! Aggiorna il blocco
      const imagePath = isUsingProcessed 
        ? `/images/products/processed/${bestMatch}`
        : `/images/products/${bestMatch}`;
      
      updatedBlock = replaceOrInsertProperty(updatedBlock, 'imageUrl', imagePath, true);
      updatedBlock = replaceOrInsertProperty(updatedBlock, 'imageStatus', 'available', true);
      updatedBlock = replaceOrInsertProperty(updatedBlock, 'imageSource', 'manual_upload', true);
      
      // Salva nei match corretti
      matchedList.push({
        productId: id,
        fullName: product.fullName,
        filename: bestMatch,
        score: bestScore,
        reason: bestReason
      });

      // Rimuovi dalle immagini non abbinate
      const idx = unmatchedImages.indexOf(bestMatch);
      if (idx !== -1) unmatchedImages.splice(idx, 1);
    } else {
      // Nessun abbinamento solido: imposta placeholder
      updatedBlock = replaceOrInsertProperty(updatedBlock, 'imageUrl', 'PLACEHOLDER_IMAGE', false);
      updatedBlock = replaceOrInsertProperty(updatedBlock, 'imageStatus', 'placeholder', true);
      updatedBlock = removeProperty(updatedBlock, 'imageSource');

      missingImagesProducts.push({
        productId: id,
        fullName: product.fullName,
        expected: `${id}.webp`
      });
    }

    return updatedBlock;
  });

  // Salva il file products.ts aggiornato
  fs.writeFileSync(PRODUCTS_TS_PATH, updatedContent, 'utf8');
  console.log(`\nDataset products.ts aggiornato con successo.`);
  console.log(`- Prodotti abbinati: ${matchedList.length}`);
  console.log(`- Prodotti rimasti con placeholder: ${missingImagesProducts.length}`);

  // Scrivi REPORT in IMAGE_MATCH_REPORT.md
  generateReport(imageFiles, matchedList, uncertainList, unmatchedImages, missingImagesProducts);
}

// --- Generazione file Markdown del Report ---
function generateReport(allImages, matched, uncertain, unmatched, missing) {
  let md = `# Report Abbinamento Immagini - Tabacchi Trainer\n\n`;
  md += `Report generato il: ${new Date().toLocaleString('it-IT')}\n\n`;

  // Sezione statistiche
  md += `## Riepilogo Statistiche\n`;
  md += `- **Immagini totali scansionate**: ${allImages.length}\n`;
  md += `- **Prodotti abbinati**: ${matched.length}\n`;
  md += `- **Prodotti senza immagine (con placeholder)**: ${missing.length}\n`;
  md += `- **Immagini orfane (non abbinate)**: ${unmatched.length}\n\n`;

  // A. Immagini scansionate
  md += `## A. Immagini trovate nella cartella\n`;
  if (allImages.length === 0) {
    md += `Nessuna immagine trovata.\n\n`;
  } else {
    md += `| Nome File | Formato | Dimensione File |\n`;
    md += `| :--- | :--- | :--- |\n`;
    for (const file of allImages) {
      const ext = path.extname(file).toLowerCase();
      let sizeText = 'N/D';
      try {
        const stats = fs.statSync(path.join(PROCESSED_DIR, file));
        sizeText = `${(stats.size / 1024).toFixed(1)} KB`;
      } catch {
        try {
          const stats = fs.statSync(path.join(IMAGES_DIR, file));
          sizeText = `${(stats.size / 1024).toFixed(1)} KB`;
        } catch {}
      }
      md += `| \`${file}\` | \`${ext}\` | ${sizeText} |\n`;
    }
    md += `\n`;
  }

  // B. Immagini abbinate correttamente
  md += `## B. Immagini abbinate correttamente\n`;
  if (matched.length === 0) {
    md += `Nessun abbinamento effettuato.\n\n`;
  } else {
    md += `| ID Prodotto | Nome Prodotto | File Immagine | Confidenza | Dettagli Match |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    for (const item of matched) {
      md += `| \`${item.productId}\` | ${item.fullName} | \`${item.filename}\` | ${(item.score * 100).toFixed(0)}% | ${item.reason} |\n`;
    }
    md += `\n`;
  }

  // C. Match incerti (Punteggi medi o multipli)
  md += `## C. Match incerti\n`;
  if (uncertain.length === 0) {
    md += `Nessun match incerto rilevato con la soglia attuale.\n\n`;
  } else {
    md += `| Nome File | Possibili Candidati | Motivo |\n`;
    md += `| :--- | :--- | :--- |\n`;
    for (const item of uncertain) {
      md += `| \`${item.filename}\` | ${item.candidates.join(', ')} | ${item.reason} |\n`;
    }
    md += `\n`;
  }

  // D. Immagini non abbinate (Orfane)
  md += `## D. Immagini non abbinate (Orfane)\n`;
  if (unmatched.length === 0) {
    md += `Nessuna immagine orfana. Tutte le immagini sono state associate a prodotti del dataset!\n\n`;
  } else {
    md += `Queste immagini sono presenti nella cartella ma non corrispondono a nessun prodotto.\n\n`;
    md += `| Nome File Orfano | Suggerimento Rinominazione |\n`;
    md += `| :--- | :--- |\n`;
    for (const file of unmatched) {
      md += `| \`${file}\` | Rinomina il file come \`ID_PRODOTTO.webp\` (es. \`marlboro-gold.webp\`) |\n`;
    }
    md += `\n`;
  }

  // E. Prodotti ancora senza immagine (Placeholder)
  md += `## E. Prodotti ancora senza immagine (Placeholder)\n`;
  if (missing.length === 0) {
    md += `Tutti i prodotti del catalogo hanno un'immagine associata! 🎉\n\n`;
  } else {
    md += `| ID Prodotto | Nome Prodotto | Nome File Atteso Consigliato |\n`;
    md += `| :--- | :--- | :--- |\n`;
    for (const item of missing) {
      md += `| \`${item.productId}\` | ${item.fullName} | \`${item.expected}\` |\n`;
    }
    md += `\n`;
  }

  fs.writeFileSync(REPORT_PATH, md, 'utf8');
  console.log(`Report generato in: ${REPORT_PATH}`);
}

// --- COMANDO: CHECK ---
// Controlla lo stato delle immagini nel dataset prodotti e visualizza riepilogo
function checkImages() {
  console.log('=== CHECK IMMAGINI E STATO DATASET ===');
  if (!fs.existsSync(PRODUCTS_TS_PATH)) {
    console.error(`Errore: File ${PRODUCTS_TS_PATH} non trovato.`);
    return;
  }

  const fileContent = fs.readFileSync(PRODUCTS_TS_PATH, 'utf8');
  const productBlockRegex = /(\{\s*id:\s*'([^']+)'[\s\S]*?\})/g;

  let totalProducts = 0;
  let availableCount = 0;
  let placeholderCount = 0;
  const missing = [];

  let match;
  while ((match = productBlockRegex.exec(fileContent)) !== null) {
    totalProducts++;
    const blockContent = match[1];
    const id = match[2];
    
    const fullNameMatch = blockContent.match(/fullName:\s*'([^']+)'/);
    const fullName = fullNameMatch ? fullNameMatch[1] : id;

    const statusMatch = blockContent.match(/imageStatus:\s*'([^']+)'/);
    const status = statusMatch ? statusMatch[1] : 'placeholder';

    if (status === 'available') {
      availableCount++;
    } else {
      placeholderCount++;
      missing.push({ id, fullName });
    }
  }

  console.log(`\n=== RIEPILOGO ===`);
  console.log(`Prodotti Totali: ${totalProducts}`);
  console.log(`Immagini Disponibili: ${availableCount} (${Math.round((availableCount/totalProducts)*100)}%)`);
  console.log(`Placeholder/Da Caricare: ${placeholderCount} (${Math.round((placeholderCount/totalProducts)*100)}%)`);

  if (placeholderCount > 0) {
    console.log(`\nElenco prodotti mancanti di foto:`);
    missing.forEach((item, idx) => {
      console.log(`${idx + 1}. [${item.id}] ${item.fullName}`);
    });
  } else {
    console.log(`\nComplimenti! Tutti i prodotti hanno un'immagine reale.`);
  }
}

// --- ENTRY POINT ---
const args = process.argv.slice(2);
const command = args[0] ? args[0].toLowerCase() : 'match';

switch (command) {
  case 'process':
    processImages();
    break;
  case 'match':
    matchImages();
    break;
  case 'check':
    checkImages();
    break;
  default:
    console.log(`Comando non riconosciuto: "${command}". Comandi disponibili: process, match, check`);
    process.exit(1);
}
