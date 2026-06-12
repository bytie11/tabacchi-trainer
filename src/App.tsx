import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { HomePage } from './pages/HomePage';
import { QuizPage } from './pages/QuizPage';
import { LearningPage } from './pages/LearningPage';
import { CatalogoPage } from './pages/CatalogoPage';
import { StatsPage } from './pages/StatsPage';
import { AboutPage } from './pages/AboutPage';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/catalogo" element={<CatalogoPage />} />
        <Route path="/statistiche" element={<StatsPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}

export default App;
