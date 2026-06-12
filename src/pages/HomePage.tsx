import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { getQuizStats, getLearningProgress } from '../utils/storage';
import { calculateAccuracy } from '../utils/quiz';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import './HomePage.css';

interface NavCard {
  icon: string;
  title: string;
  description: string;
  path: string;
}

const NAV_CARDS: NavCard[] = [
  {
    icon: '🎯',
    title: 'Quiz',
    description: 'Metti alla prova la tua conoscenza',
    path: '/quiz',
  },
  {
    icon: '📚',
    title: 'Learning',
    description: 'Studia i prodotti con le flashcards',
    path: '/learning',
  },
  {
    icon: '📋',
    title: 'Catalogo',
    description: 'Consulta tutti i prodotti',
    path: '/catalogo',
  },
  {
    icon: '📊',
    title: 'Statistiche',
    description: 'Monitora i tuoi progressi',
    path: '/statistiche',
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const quizStats = getQuizStats();
    const learningProgress = getLearningProgress();
    const accuracy =
      quizStats.totalQuestions > 0
        ? calculateAccuracy(quizStats.correctAnswers, quizStats.totalQuestions)
        : null;

    return {
      totalProducts: products.length,
      learnedCount: learningProgress.learned.length,
      accuracy,
    };
  }, []);

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <h1 className="home-header__title">Tabacchi Trainer</h1>
        <p className="home-header__subtitle">
          Allenamento privato per riconoscere prodotti da tabaccheria
        </p>
      </header>

      {/* Quick Stats */}
      <div className="home-stats">
        <div className="home-stats__item">
          <span className="home-stats__value home-stats__value--accent">
            {stats.totalProducts}
          </span>
          <span className="home-stats__label">Prodotti</span>
        </div>
        <div className="home-stats__item">
          <span className="home-stats__value home-stats__value--success">
            {stats.learnedCount}
          </span>
          <span className="home-stats__label">Imparati</span>
        </div>
        {stats.accuracy !== null && (
          <div className="home-stats__item">
            <span className="home-stats__value home-stats__value--accent">
              {stats.accuracy}%
            </span>
            <span className="home-stats__label">Precisione</span>
          </div>
        )}
      </div>

      {/* Navigation Cards */}
      <nav className="home-nav-grid" aria-label="Navigazione principale">
        {NAV_CARDS.map((card) => (
          <div
            key={card.path}
            className="home-nav-card"
            onClick={() => navigate(card.path)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(card.path);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`${card.title} — ${card.description}`}
          >
            <span className="home-nav-card__icon" aria-hidden="true">
              {card.icon}
            </span>
            <h2 className="home-nav-card__title">{card.title}</h2>
            <p className="home-nav-card__description">{card.description}</p>
          </div>
        ))}
      </nav>

      {/* Disclaimer */}
      <div className="home-disclaimer">
        <DisclaimerBanner compact />
      </div>
    </div>
  );
};

export default HomePage;
