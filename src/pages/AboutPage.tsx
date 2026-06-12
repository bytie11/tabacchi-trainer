import React from 'react';
import { products } from '../data/products';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import './AboutPage.css';

export const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      <h1 className="about-page__title">Informazioni</h1>

      {/* ── Disclaimer Banner ── */}
      <DisclaimerBanner />

      {/* ── App Info Card ── */}
      <div className="about-card">
        <h2 className="about-card__title">
          <span className="about-card__title-icon">🎓</span>
          Informazioni App
        </h2>
        <table className="about-info-table">
          <tbody>
            <tr>
              <td>Nome</td>
              <td>Tabacchi Trainer</td>
            </tr>
            <tr>
              <td>Versione</td>
              <td>1.0.0</td>
            </tr>
            <tr>
              <td>Tipo</td>
              <td>App privata di formazione interna</td>
            </tr>
            <tr>
              <td>Stack</td>
              <td>React + TypeScript + Vite</td>
            </tr>
            <tr>
              <td>Prodotti nel database</td>
              <td>{products.length}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Disclaimer Card ── */}
      <div className="about-disclaimer">
        <span className="about-disclaimer__icon">⚖️</span>
        <h3 className="about-disclaimer__title">Avviso Legale</h3>
        <p className="about-disclaimer__text">
          Questa applicazione è destinata esclusivamente a formazione interna di
          operatori adulti del settore tabaccheria. Non promuove, non
          pubblicizza e non incentiva il consumo di tabacco o di alcun prodotto.
          I dati dei prodotti sono indicativi e da verificare con fonti ufficiali
          (ADM). Le immagini, quando presenti, sono per solo uso formativo
          interno.
        </p>
      </div>

      {/* ── Fonti dati ── */}
      <section className="about-section">
        <h2 className="about-section__title">Fonti dati</h2>
        <div className="about-links">
          <a
            href="https://www.adm.gov.it"
            target="_blank"
            rel="noopener noreferrer"
            className="about-link"
          >
            <span className="about-link__icon">🌐</span>
            <div className="about-link__content">
              <span className="about-link__title">ADM — Agenzia delle Dogane e dei Monopoli</span>
              <span className="about-link__description">
                Fonte ufficiale per prezzi e listini dei tabacchi lavorati in Italia.
              </span>
            </div>
          </a>
          <div className="about-note">
            <span className="about-note__icon">⚠️</span>
            <span>
              I dati presenti nell'app sono indicativi. Verificare sempre con le
              fonti ufficiali ADM per confermare prezzi, disponibilità e
              denominazioni aggiornate.
            </span>
          </div>
        </div>
      </section>

      {/* ── Protezione accesso ── */}
      <section className="about-section">
        <h2 className="about-section__title">Protezione accesso</h2>
        <div className="about-note">
          <span className="about-note__icon">🔒</span>
          <span>
            In una versione futura sarà possibile abilitare la protezione con
            password. La variabile di configurazione <code>ENABLE_AUTH</code>{' '}
            verrà utilizzata per attivare questa funzionalità.
          </span>
        </div>
      </section>

      {/* ── Come aggiornare i dati ── */}
      <section className="about-section">
        <h2 className="about-section__title">Come aggiornare i dati</h2>

        <h3 className="about-card__title" style={{ marginBottom: 'var(--space-3)' }}>
          <span className="about-card__title-icon">📝</span>
          Aggiornare il dataset prodotti
        </h3>
        <div className="about-steps" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="about-step">
            <span className="about-step__text">
              Consultare il sito ADM per i listini aggiornati dei tabacchi lavorati
            </span>
          </div>
          <div className="about-step">
            <span className="about-step__text">
              Aprire il file <code>src/data/products.ts</code> nel progetto
            </span>
          </div>
          <div className="about-step">
            <span className="about-step__text">
              Aggiungere o modificare i record seguendo il formato esistente. Ogni prodotto deve avere un <code>id</code> unico
            </span>
          </div>
          <div className="about-step">
            <span className="about-step__text">
              Verificare che la categoria (<code>category</code>) corrisponda a una delle categorie definite in <code>src/types/product.ts</code>
            </span>
          </div>
          <div className="about-step">
            <span className="about-step__text">
              Salvare il file e ricompilare l'applicazione con <code>npm run build</code>
            </span>
          </div>
        </div>

        <h3 className="about-card__title" style={{ marginBottom: 'var(--space-3)' }}>
          <span className="about-card__title-icon">🖼️</span>
          Aggiungere immagini
        </h3>
        <div className="about-steps">
          <div className="about-step">
            <span className="about-step__text">
              Salvare l'immagine in <code>public/images/products/</code> con un nome descrittivo (es. <code>marlboro-gold.webp</code>)
            </span>
          </div>
          <div className="about-step">
            <span className="about-step__text">
              Aggiornare il campo <code>imageUrl</code> del prodotto nel file <code>products.ts</code>
            </span>
          </div>
          <div className="about-step">
            <span className="about-step__text">
              Impostare <code>imageStatus</code> su <code>"available"</code> dopo aver verificato che l'immagine sia corretta
            </span>
          </div>
          <div className="about-step">
            <span className="about-step__text">
              Utilizzare formato WebP o PNG, dimensione consigliata: 400×400px
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <div className="about-footer">
        <p className="about-footer__text">
          Tabacchi Trainer v1.0.0 — App privata di formazione interna
          <br />
          Non promuove né incentiva il consumo di tabacco.
        </p>
      </div>
    </div>
  );
};
