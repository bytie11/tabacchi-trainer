const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// --- Percorsi ---
const ROOT_DIR = path.resolve(__dirname, '..');
const PRODUCTS_TS_PATH = path.join(ROOT_DIR, 'src/data/products.ts');
const IMAGES_DIR = path.join(ROOT_DIR, 'public/images/products');
const PROCESSED_DIR = path.join(IMAGES_DIR, 'processed');

// Percorsi per le immagini oscurate
const DARKENED_ORIGINAL_DIR = path.join(ROOT_DIR, 'public/images/products darkened');
const DARKENED_PROCESSED_DIR = path.join(ROOT_DIR, 'public/images/products-darkened');

// Report
const REPORT_PATH = path.join(ROOT_DIR, 'IMAGE_MATCH_REPORT.md');
const DARKENED_REPORT_PATH = path.join(ROOT_DIR, 'DARKENED_IMAGE_MATCH_REPORT.md');

// --- Helper Normalizzazione ---
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD') // Decompone i caratteri accentati
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
// Converte le immagini originali in .webp ottimizzato (max width 800px)
function processImages() {
  console.log('=== OTTIMIZZAZIONE E CONVERSIONE IMMAGINI ORIGINALI ===');
  
  const originalFiles = scanImagesFolder(IMAGES_DIR);
  if (originalFiles.length === 0) {
    console.log(`Nessuna immagine trovata in ${IMAGES_DIR}.`);
    return;
  }

  ensureDirectoryExists(PROCESSED_DIR);
  console.log(`Trovate ${originalFiles.length} immagini originali. Elaborazione...`);
  
  let processedCount = 0;
  let failedCount = 0;

  for (const file of originalFiles) {
    const ext = path.extname(file);
    const nameWithoutExt = path.basename(file, ext);
    const kebabName = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const inputPath = path.join(IMAGES_DIR, file);
    const outWebpName = `${kebabName}.webp`;
    const outputPath = path.join(PROCESSED_DIR, outWebpName);

    try {
      execSync(`sips -s format webp -Z 800 "${inputPath}" --out "${outputPath}"`, { stdio: 'ignore' });
      processedCount++;
    } catch (err) {
      try {
        const fallbackPath = path.join(PROCESSED_DIR, `${kebabName}${ext}`);
        fs.copyFileSync(inputPath, fallbackPath);
        processedCount++;
      } catch (copyErr) {
        failedCount++;
      }
    }
  }
  console.log(`Completato: ${processedCount} immagini elaborate, ${failedCount} fallite.`);
}

// --- COMANDO: PROCESS DARKENED ---
// Converte le immagini oscurate in .webp ottimizzato (max width 800px) e le copia in public/images/products-darkened/
function processDarkenedImages() {
  console.log('=== OTTIMIZZAZIONE E CONVERSIONE IMMAGINI OSCURATE ===');
  
  if (!fs.existsSync(DARKENED_ORIGINAL_DIR)) {
    console.log(`Cartella originale oscurata non trovata in: ${DARKENED_ORIGINAL_DIR}`);
    return;
  }

  const originalFiles = scanImagesFolder(DARKENED_ORIGINAL_DIR);
  if (originalFiles.length === 0) {
    console.log(`Nessuna immagine trovata in ${DARKENED_ORIGINAL_DIR}.`);
    return;
  }

  ensureDirectoryExists(DARKENED_PROCESSED_DIR);
  console.log(`Trovate ${originalFiles.length} immagini oscurate. Elaborazione...`);
  
  let processedCount = 0;
  let failedCount = 0;

  for (const file of originalFiles) {
    const ext = path.extname(file);
    const nameWithoutExt = path.basename(file, ext);
    const kebabName = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const inputPath = path.join(DARKENED_ORIGINAL_DIR, file);
    const outWebpName = `${kebabName}.webp`;
    const outputPath = path.join(DARKENED_PROCESSED_DIR, outWebpName);

    console.log(`Elaborazione: ${file} -> ${outWebpName}`);

    try {
      execSync(`sips -s format webp -Z 800 "${inputPath}" --out "${outputPath}"`, { stdio: 'ignore' });
      console.log(`✓ Ottimizzato con successo.`);
      processedCount++;
    } catch (err) {
      console.warn(`⚠️ sips fallito per questo formato. Copio il file originale come fallback.`);
      try {
        const fallbackPath = path.join(DARKENED_PROCESSED_DIR, `${kebabName}${ext}`);
        fs.copyFileSync(inputPath, fallbackPath);
        console.log(`✓ Copiato senza modifiche (${kebabName}${ext}).`);
        processedCount++;
      } catch (copyErr) {
        console.error(`✗ Errore copia fallback per ${file}:`, copyErr.message);
        failedCount++;
      }
    }
  }
  console.log(`Processo completato: ${processedCount} immagini oscurate elaborate, ${failedCount} fallite.`);
}

// --- COMANDO: MATCH ---
// Abbina le immagini elaborate ai prodotti nel file products.ts e genera REPORT
function matchImages() {
  console.log('=== ABBINAMENTO IMMAGINI ORIGINALI AI PRODOTTI ===');

  if (!fs.existsSync(PRODUCTS_TS_PATH)) {
    console.error(`Errore: File ${PRODUCTS_TS_PATH} non trovato.`);
    return;
  }

  let scanDir = PROCESSED_DIR;
  let isUsingProcessed = true;
  
  if (!fs.existsSync(PROCESSED_DIR) || scanImagesFolder(PROCESSED_DIR).length === 0) {
    scanDir = IMAGES_DIR;
    isUsingProcessed = false;
  }

  const imageFiles = scanImagesFolder(scanDir);
  let fileContent = fs.readFileSync(PRODUCTS_TS_PATH, 'utf8');
  
  const productBlockRegex = /(\{\s*id:\s*'([^']+)'[\s\S]*?\})/g;
  
  const matchedList = [];
  const uncertainList = [];
  const unmatchedImages = [...imageFiles];
  const missingImagesProducts = [];

  const updatedContent = fileContent.replace(productBlockRegex, (fullBlock, blockContent, id) => {
    const brandMatch = blockContent.match(/brand:\s*'([^']+)'/);
    const productNameMatch = blockContent.match(/productName:\s*'([^']+)'/);
    const fullNameMatch = blockContent.match(/fullName:\s*'([^']+)'/);
    
    const aliasesMatch = blockContent.match(/aliases:\s*\[([\s\S]*?)\]/);
    let aliases = [];
    if (aliasesMatch && aliasesMatch[1]) {
      aliases = aliasesMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    }

    const expectedMatch = blockContent.match(/expectedImageFileName:\s*'([^']+)'/);
    const expectedImageFileName = expectedMatch ? expectedMatch[1] : null;

    const product = { id, brand: brandMatch ? brandMatch[1] : '', productName: productNameMatch ? productNameMatch[1] : '', fullName: fullNameMatch ? fullNameMatch[1] : '', aliases, expectedImageFileName };

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
      const imagePath = isUsingProcessed 
        ? `/images/products/processed/${bestMatch}`
        : `/images/products/${bestMatch}`;
      
      updatedBlock = replaceOrInsertProperty(updatedBlock, 'imageUrl', imagePath, true);
      updatedBlock = replaceOrInsertProperty(updatedBlock, 'imageStatus', 'available', true);
      updatedBlock = replaceOrInsertProperty(updatedBlock, 'imageSource', 'manual_upload', true);
      
      matchedList.push({
        productId: id,
        fullName: product.fullName,
        filename: bestMatch,
        score: bestScore,
        reason: bestReason
      });

      const idx = unmatchedImages.indexOf(bestMatch);
      if (idx !== -1) unmatchedImages.splice(idx, 1);
    } else {
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

  fs.writeFileSync(PRODUCTS_TS_PATH, updatedContent, 'utf8');
  console.log(`Dataset products.ts aggiornato.`);
  generateReport(imageFiles, matchedList, uncertainList, unmatchedImages, missingImagesProducts);
}

// --- COMANDO: MATCH DARKENED ---
// Abbina le immagini oscurate (in public/images/products-darkened/) al campo quizImageUrl
function matchDarkenedImages() {
  console.log('=== ABBINAMENTO IMMAGINI OSCURATE AI PRODOTTI ===');

  if (!fs.existsSync(PRODUCTS_TS_PATH)) {
    console.error(`Errore: File ${PRODUCTS_TS_PATH} non trovato.`);
    return;
  }

  let scanDir = DARKENED_PROCESSED_DIR;
  let isUsingProcessed = true;

  if (!fs.existsSync(DARKENED_PROCESSED_DIR) || scanImagesFolder(DARKENED_PROCESSED_DIR).length === 0) {
    console.log('Processed oscurato non trovato o vuoto, uso le immagini oscurate originali...');
    scanDir = DARKENED_ORIGINAL_DIR;
    isUsingProcessed = false;
  }

  if (!fs.existsSync(scanDir)) {
    console.error(`Errore: Cartella immagini oscurate non trovata in ${scanDir}`);
    return;
  }

  const imageFiles = scanImagesFolder(scanDir);
  console.log(`Trovate ${imageFiles.length} immagini oscurate.`);

  let fileContent = fs.readFileSync(PRODUCTS_TS_PATH, 'utf8');
  const productBlockRegex = /(\{\s*id:\s*'([^']+)'[\s\S]*?\})/g;

  const matchedList = [];
  const uncertainList = [];
  const unmatchedImages = [...imageFiles];
  const missingImagesProducts = [];

  const updatedContent = fileContent.replace(productBlockRegex, (fullBlock, blockContent, id) => {
    const brandMatch = blockContent.match(/brand:\s*'([^']+)'/);
    const productNameMatch = blockContent.match(/productName:\s*'([^']+)'/);
    const fullNameMatch = blockContent.match(/fullName:\s*'([^']+)'/);
    const imageUrlMatch = blockContent.match(/imageUrl:\s*'([^']+)'/);
    
    const aliasesMatch = blockContent.match(/aliases:\s*\[([\s\S]*?)\]/);
    let aliases = [];
    if (aliasesMatch && aliasesMatch[1]) {
      aliases = aliasesMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    }

    const expectedMatch = blockContent.match(/expectedImageFileName:\s*'([^']+)'/);
    const expectedImageFileName = expectedMatch ? expectedMatch[1] : null;

    const product = { 
      id, 
      brand: brandMatch ? brandMatch[1] : '', 
      productName: productNameMatch ? productNameMatch[1] : '', 
      fullName: fullNameMatch ? fullNameMatch[1] : '', 
      imageUrl: imageUrlMatch ? imageUrlMatch[1] : '',
      aliases, 
      expectedImageFileName 
    };

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
      const imagePath = isUsingProcessed 
        ? `/images/products-darkened/${bestMatch}`
        : `/images/products darkened/${bestMatch}`; // Attenzione allo spazio nel fallback originale
      
      updatedBlock = replaceOrInsertProperty(updatedBlock, 'quizImageUrl', imagePath, true);
      
      matchedList.push({
        productId: id,
        fullName: product.fullName,
        filename: bestMatch,
        score: bestScore,
        reason: bestReason
      });

      const idx = unmatchedImages.indexOf(bestMatch);
      if (idx !== -1) unmatchedImages.splice(idx, 1);
    } else {
      // Se non c'è corrispondenza oscurata, togliamo quizImageUrl
      updatedBlock = removeProperty(updatedBlock, 'quizImageUrl');

      missingImagesProducts.push({
        productId: id,
        fullName: product.fullName,
        expected: `${id}.webp`
      });
    }

    return updatedBlock;
  });

  fs.writeFileSync(PRODUCTS_TS_PATH, updatedContent, 'utf8');
  console.log(`\nDataset products.ts aggiornato con quizImageUrl.`);
  console.log(`- Immagini oscurate abbinate: ${matchedList.length}`);
  console.log(`- Prodotti senza immagine oscurata: ${missingImagesProducts.length}`);

  // Genera Report Dedicato
  generateDarkenedReport(imageFiles, matchedList, uncertainList, unmatchedImages, missingImagesProducts);
}

// --- Generazione file Report Immagini Oscurate ---
function generateDarkenedReport(allImages, matched, uncertain, unmatched, missing) {
  let md = `# Report Abbinamento Immagini Oscurate (Quiz) - Tabacchi Trainer\n\n`;
  md += `Report generato il: ${new Date().toLocaleString('it-IT')}\n\n`;

  md += `## Riepilogo Statistiche\n`;
  md += `- **Immagini oscurate totali scansionate**: ${allImages.length}\n`;
  md += `- **Immagini oscurate abbinate correttamente**: ${matched.length}\n`;
  md += `- **Prodotti con \`quizImageUrl\` assegnato**: ${matched.length}\n`;
  md += `- **Immagini oscurate non abbinate (orfane)**: ${unmatched.length}\n`;
  md += `- **Prodotti senza immagine oscurata**: ${missing.length}\n\n`;

  // A. immagini oscurate trovate
  md += `## A. Immagini oscurate trovate\n`;
  if (allImages.length === 0) {
    md += `Nessuna immagine oscurata trovata.\n\n`;
  } else {
    md += `| Nome File | Formato | Dimensione File |\n`;
    md += `| :--- | :--- | :--- |\n`;
    for (const file of allImages) {
      const ext = path.extname(file).toLowerCase();
      let sizeText = 'N/D';
      try {
        const stats = fs.statSync(path.join(DARKENED_PROCESSED_DIR, file));
        sizeText = `${(stats.size / 1024).toFixed(1)} KB`;
      } catch {
        try {
          const stats = fs.statSync(path.join(DARKENED_ORIGINAL_DIR, file));
          sizeText = `${(stats.size / 1024).toFixed(1)} KB`;
        } catch {}
      }
      md += `| \`${file}\` | \`${ext}\` | ${sizeText} |\n`;
    }
    md += `\n`;
  }

  // B. immagini oscurate abbinate correttamente
  md += `## B. Immagini oscurate abbinate correttamente\n`;
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

  // C. prodotti con quizImageUrl assegnato
  md += `## C. Prodotti con quizImageUrl assegnato\n`;
  if (matched.length === 0) {
    md += `Nessun prodotto configurato con quizImageUrl.\n\n`;
  } else {
    md += `| ID Prodotto | Nome Prodotto | Path Assegnato |\n`;
    md += `| :--- | :--- | :--- |\n`;
    for (const item of matched) {
      md += `| \`${item.productId}\` | ${item.fullName} | \`/images/products-darkened/${item.filename}\` |\n`;
    }
    md += `\n`;
  }

  // D. immagini oscurate non abbinate
  md += `## D. Immagini oscurate non abbinate\n`;
  if (unmatched.length === 0) {
    md += `Nessuna immagine orfana. Tutte le immagini sono state associate correttamente! 🎉\n\n`;
  } else {
    md += `| Nome File Orfano | Suggerimento Rinominazione |\n`;
    md += `| :--- | :--- |\n`;
    for (const file of unmatched) {
      md += `| \`${file}\` | Rinomina il file come \`ID_PRODOTTO.webp\` (es. \`marlboro-gold.webp\`) |\n`;
    }
    md += `\n`;
  }

  // E. prodotti senza immagine oscurata
  md += `## E. Prodotti senza immagine oscurata\n`;
  if (missing.length === 0) {
    md += `Tutti i prodotti hanno una foto oscurata per il Quiz! 🎉\n\n`;
  } else {
    md += `Questi prodotti utilizzeranno l'immagine originale come fallback durante il Quiz.\n\n`;
    md += `| ID Prodotto | Nome Prodotto | expectedImageFileName consigliato |\n`;
    md += `| :--- | :--- | :--- |\n`;
    for (const item of missing) {
      md += `| \`${item.productId}\` | ${item.fullName} | \`${item.expected}\` |\n`;
    }
    md += `\n`;
  }

  // F. match incerti da verificare
  md += `## F. Match incerti da verificare\n`;
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

  // G. suggerimenti su come rinominare i file per migliorare il matching
  md += `## G. Suggerimenti per rinominare i file\n`;
  md += `1. **Usa gli ID prodotto**: Rinomina i file con lo stesso nome dell'ID prodotto (es. \`marlboro-gold.jpg\` -> \`marlboro-gold.webp\`).\n`;
  md += `2. **Nomi kebab-case**: Rinomina i file interamente in minuscolo sostituendo gli spazi con trattini (es. \`Terea Sienna.jpg\` -> \`terea-sienna.jpg\`).\n`;
  md += `3. **Evita caratteri speciali**: Rimuovi caratteri speciali come parentesi, virgole o accenti.\n`;

  fs.writeFileSync(DARKENED_REPORT_PATH, md, 'utf8');
  console.log(`Report oscurato generato in: ${DARKENED_REPORT_PATH}`);
}

// --- Generazione file Markdown del Report Originale ---
function generateReport(allImages, matched, uncertain, unmatched, missing) {
  let md = `# Report Abbinamento Immagini - Tabacchi Trainer\n\n`;
  md += `Report generato il: ${new Date().toLocaleString('it-IT')}\n\n`;

  md += `## Riepilogo Statistiche\n`;
  md += `- **Immagini totali scansionate**: ${allImages.length}\n`;
  md += `- **Prodotti abbinati**: ${matched.length}\n`;
  md += `- **Prodotti senza immagine (con placeholder)**: ${missing.length}\n`;
  md += `- **Immagini orfane (non abbinate)**: ${unmatched.length}\n\n`;

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

  md += `## C. Match incerti\n`;
  md += `Nessun match incerto rilevato.\n\n`;

  md += `## D. Immagini non abbinate (Orfane)\n`;
  if (unmatched.length === 0) {
    md += `Nessuna immagine orfana. Tutte le immagini sono state associate!\n\n`;
  } else {
    md += `| Nome File Orfano | Suggerimento |\n`;
    md += `| :--- | :--- |\n`;
    for (const file of unmatched) {
      md += `| \`${file}\` | Rinomina come \`ID_PRODOTTO.webp\` |\n`;
    }
    md += `\n`;
  }

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
  let quizDarkenedCount = 0;

  let match;
  while ((match = productBlockRegex.exec(fileContent)) !== null) {
    totalProducts++;
    const blockContent = match[1];
    const statusMatch = blockContent.match(/imageStatus:\s*'([^']+)'/);
    const status = statusMatch ? statusMatch[1] : 'placeholder';

    const hasQuizImage = blockContent.includes('quizImageUrl:');

    if (status === 'available') {
      availableCount++;
    } else {
      placeholderCount++;
    }

    if (hasQuizImage) {
      quizDarkenedCount++;
    }
  }

  console.log(`\n=== RIEPILOGO ===`);
  console.log(`Prodotti Totali: ${totalProducts}`);
  console.log(`Immagini Originali Disponibili: ${availableCount} su ${totalProducts} (${Math.round((availableCount/totalProducts)*100)}%)`);
  console.log(`Immagini Oscurate per Quiz Disponibili: ${quizDarkenedCount} su ${totalProducts} (${Math.round((quizDarkenedCount/totalProducts)*100)}%)`);
}

// --- ENTRY POINT ---
const args = process.argv.slice(2);
const command = args[0] ? args[0].toLowerCase() : 'match';

switch (command) {
  case 'process':
    processImages();
    break;
  case 'process-darkened':
    processDarkenedImages();
    break;
  case 'match':
    matchImages();
    break;
  case 'match-darkened':
    matchDarkenedImages();
    break;
  case 'check':
    checkImages();
    break;
  default:
    console.log(`Comando non riconosciuto: "${command}". Comandi disponibili: process, process-darkened, match, match-darkened, check`);
    process.exit(1);
}
