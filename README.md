# Tabacchi Trainer 🎓

Applicazione web privata di formazione interna per operatori di tabaccheria.
Permette di apprendere il riconoscimento visivo dei prodotti tramite flashcards e quiz.

> ⚠️ **Nota compliance**: Questa applicazione è destinata esclusivamente a formazione interna di operatori adulti del settore. Non promuove né incentiva il consumo di tabacco.

## Installazione

```bash
npm install
npm run dev
```

L'app sarà disponibile su `http://localhost:5173`

## Funzionalità

- **Quiz**: Modalità multiple choice con filtri e livelli di difficoltà
- **Learning**: Flashcards interattive con tracking dell'apprendimento
- **Catalogo**: Consultazione completa del database prodotti
- **Statistiche**: Monitoraggio progressi e aree da migliorare

## Come Aggiungere un Nuovo Prodotto

1. Apri `/src/data/products.ts`
2. Aggiungi un nuovo oggetto all'array `products`
3. Segui il formato degli altri prodotti
4. Aggiungi la foto in `/public/images/products/` (formato: `brand-nome.jpg`)
5. Imposta `imageStatus: 'available'` se la foto è verificata

## Come Sostituire Immagini Placeholder

1. Scatta una foto frontale del pacchetto
2. Salva in `/public/images/products/` con nome pulito (es: `marlboro-gold.jpg`)
3. In `products.ts`, aggiorna il campo `imageUrl` del prodotto
4. Cambia `imageStatus` da `'placeholder'` a `'available'`

## Come Aggiornare il Dataset da Fonti ADM

1. Visita https://www.adm.gov.it > Accise > I prezzi dei Tabacchi
2. Scarica i PDF/Excel per categoria
3. Confronta con i prodotti esistenti in `products.ts`
4. Aggiungi/modifica i record necessari
5. Segnala i prodotti non verificati con note appropriate

## Deploy e Pubblicazione su GitHub Pages

L'applicazione è configurata per il deploy automatico su **GitHub Pages** tramite GitHub Actions.

- **URL Pubblico**: [https://bytie11.github.io/tabacchi-trainer/](https://bytie11.github.io/tabacchi-trainer/)
- **Accesso**: Diretto e pubblico, senza password o autenticazione.

### Configurazione per GitHub Pages
1. **Base Path**: Configurato in `vite.config.ts` come `base: '/tabacchi-trainer/'`.
2. **SPA Routing**: Utilizza `HashRouter` per prevenire errori 404 sui refresh delle sottopagine.
3. **Workflow Actions**: Il file `.github/workflows/deploy.yml` gestisce la compilazione e il deploy automatico ad ogni push sul branch `main`.

### Come attivare il deploy automatico
1. Carica il codice su GitHub.
2. Vai su GitHub nella pagina della repository.
3. Clicca su **Settings** > **Pages**.
4. Sotto **Build and deployment**, imposta la **Source** su **GitHub Actions** (invece di *Deploy from a branch*).
5. Il workflow partirà automaticamente e pubblicherà il sito all'indirizzo sopra indicato.

## Stack Tecnico

- React 18 + TypeScript
- Vite
- React Router v6
- CSS Modules + Custom Properties
- localStorage per persistenza dati

## Struttura Progetto

```
/src
  /components    → Componenti UI riutilizzabili
  /pages         → Pagine principali
  /data          → Dataset prodotti
  /types         → Definizioni TypeScript  
  /hooks         → Custom React hooks
  /utils         → Funzioni utilità
  /styles        → CSS globale e design system
/public
  /images/products → Immagini prodotti
  robots.txt       → Blocco indicizzazione
```

## Immagini oscurate per il Quiz

Per rendere il quiz più difficile, l'applicazione supporta l'utilizzo di immagini con il logo oscurato (darkened).

### Posizionamento e Nomenclatura
1. Inserisci le nuove immagini oscurate nella cartella `public/images/products darkened`.
2. I nomi dei file devono corrispondere a quelli delle immagini originali (o contenere l'ID del prodotto o brand e nome, es. `marlboro-gold.jpg` o `terea-amber.png`).

### Comandi per il Matching
Esegui questi comandi in sequenza per elaborare le immagini oscurate e abbinarle al dataset:

```bash
# 1. Copia, normalizza i nomi e ottimizza le immagini oscurate
npm run images:process-darkened

# 2. Collega le immagini oscurate al campo quizImageUrl in src/data/products.ts
npm run images:match-darkened
```

### Funzionamento del Fallback
1. Se il prodotto ha un'immagine oscurata abbinata (`quizImageUrl`), il Quiz la utilizzerà automaticamente.
2. Se il prodotto non ha un'immagine oscurata, il Quiz farà fallback all'immagine originale (`imageUrl`).
3. Se manca anche l'immagine originale, verrà mostrato il placeholder grafico standard.

### Gestione nelle Impostazioni del Quiz
Nella schermata di configurazione del Quiz sono disponibili due opzioni dedicate:
- **"Usa immagini oscurate, se disponibili (più difficile)"** (Toggle, abilitato di default, salvato in `localStorage`): se disattivato, il Quiz utilizzerà solo le immagini originali non oscurate.
- **"Solo prodotti con immagine oscurata"** (Checkbox): se attivo, il pool di domande includerà esclusivamente i prodotti che possiedono una foto oscurata disponibile.

## Licenza

Uso interno. Non per distribuzione pubblica.
