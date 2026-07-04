import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  Gamepad2,
  Trophy,
  Clock,
  Target,
  Zap,
  Star,
  BookOpen,
  Users,
  RefreshCw,
  Search,
  Brain,
  Check,
} from 'lucide-react';

// ---------- COMPOSANT QUIZ DU JOUR (QCM) ----------
function DailyQuiz({ game, onFinish }: any) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  const questions = game?.questions || [];

  if (game?.completed) return <p className="text-green-600">✅ Quiz du jour terminé !</p>;

  const q = questions[index];
  if (!q) {
    onFinish({ score, total: questions.length, type: 'daily' });
    return null;
  }

  const handleChoice = (choice: string) => {
    if (answered) return;
    setAnswered(true);
    setSelectedChoice(choice);
    const isCorrect = choice === q.answer;
    if (isCorrect) setScore((s) => s + 1);
    setTimeout(() => {
      setAnswered(false);
      setSelectedChoice(null);
      if (index < questions.length - 1) {
        setIndex((i) => i + 1);
      } else {
        onFinish({ score: score + (isCorrect ? 1 : 0), total: questions.length, type: 'daily' });
      }
    }, 1200);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-500">
        <span>Question {index + 1}/{questions.length}</span>
        <span>⭐ {game.xp || 100} XP</span>
      </div>
      <p className="text-lg font-medium">{q.text}</p>
      <p className="text-sm text-gray-400">{q.reference}</p>
      <div className="grid grid-cols-1 gap-2 mt-4">
        {q.choices?.map((choice: string, idx: number) => {
          const isCorrect = choice === q.answer;
          let bgClass = 'border-gray-200 hover:bg-gray-50';
          if (answered) {
            if (isCorrect) bgClass = 'border-green-500 bg-green-50';
            else if (selectedChoice === choice && !isCorrect) bgClass = 'border-red-500 bg-red-50';
          }
          return (
            <button
              key={idx}
              onClick={() => handleChoice(choice)}
              disabled={answered}
              className={`p-3 border-2 rounded-xl text-left transition ${bgClass}`}
            >
              {choice}
              {answered && isCorrect && <span className="ml-2 text-green-600">✅</span>}
              {answered && selectedChoice === choice && !isCorrect && <span className="ml-2 text-red-600">❌</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- COMPOSANT COURSE CONTRE LA MONTRE ----------
function SpeedGame({ game, onFinish }: any) {
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(game?.timeLimit || 30);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');

  const questions = game?.questions || [];

  useEffect(() => {
    if (!started || timeLeft === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          onFinish({ score, total: questions.length, type: 'speed' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft, questions.length, score]);

  const handleSubmit = () => {
    const q = questions[index];
    if (!q) return;
    const isCorrect = userAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase();
    if (isCorrect) setScore((s) => s + 1);
    setUserAnswer('');
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onFinish({ score: score + (isCorrect ? 1 : 0), total: questions.length, type: 'speed' });
    }
  };

  if (!started) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-lg font-bold text-church-navy">⏱️ Course contre la montre</p>
        <p className="text-gray-500">Tu as {game.timeLimit || 30} secondes pour répondre à {questions.length} questions.</p>
        <Button onClick={() => setStarted(true)} className="bg-church-gold text-white">
          🚀 Commencer
        </Button>
      </div>
    );
  }

  if (timeLeft === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-2xl font-bold text-church-navy">⏰ Temps écoulé !</p>
        <p className="text-lg">Score : {score}/{questions.length}</p>
      </div>
    );
  }

  const q = questions[index];
  if (!q) return <p className="text-red-500">❌ Erreur : question introuvable</p>;

  const questionText = q.text || q.question || 'Question non disponible';
  const reference = q.reference || '';

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-500">
        <span>Question {index + 1}/{questions.length}</span>
        <span>⏱️ {timeLeft}s</span>
      </div>
      <p className="text-lg font-medium">{questionText}</p>
      {reference && <p className="text-sm text-gray-400">{reference}</p>}
      <div className="flex flex-col gap-2">
        <Input
          placeholder="Tape ta réponse..."
          className="h-12"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && userAnswer.trim() && handleSubmit()}
        />
        <Button
          onClick={handleSubmit}
          disabled={!userAnswer.trim()}
          className="bg-church-gold text-white"
        >
          Valider
        </Button>
      </div>
    </div>
  );
}

// ---------- COMPOSANT QCM GÉNÉRIQUE (MODIFIÉ POUR SUPPRIMER LES INDICES DU JEU "book") ----------
function QcmGame({ game, onAnswer, onNext, showResult, selectedAnswer }: any) {
  if (!game || typeof game !== 'object') {
    return <p className="text-red-500">⚠️ Erreur : données du jeu invalides.</p>;
  }

  const isBookGame = game.type === 'book' || game.type === 'book_quiz';

  const renderContent = () => {
    // Si c'est un jeu "Dans quel livre", on n'affiche AUCUNE référence ni livre
    if (isBookGame) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-blue-600 font-semibold">{game.question || '📖 Dans quel livre ?'}</p>
          {game.text && <p className="text-lg font-medium">"{game.text}"</p>}
          {/* Pas d'affichage de game.reference ni de game.bookName */}
        </div>
      );
    }

    // Autres types (inchangés)
    if (game.type === 'who_said') {
      return (
        <div className="space-y-2">
          <p className="text-sm text-blue-600 font-semibold">{game.question || '🗣️ Qui a dit cette parole ?'}</p>
          <p className="text-lg font-medium">"{game.text}"</p>
          <p className="text-sm text-gray-400">{game.reference}</p>
        </div>
      );
    }
    if (game.type === 'chapter_quiz') {
      return (
        <div className="space-y-2">
          <p className="text-sm text-blue-600 font-semibold">{game.question}</p>
          <p className="text-lg font-medium">"{game.text}"</p>
          {game.bookName && <p className="text-sm text-gray-400">📖 Livre : {game.bookName}</p>}
        </div>
      );
    }
    if (game.type === 'completion' || game.type === 'fill') {
      return (
        <div className="space-y-2">
          <p className="text-sm text-blue-600 font-semibold">{game.question || '🧩 Complète le verset'}</p>
          <p className="text-lg font-medium">{game.text}</p>
          <p className="text-sm text-gray-400">{game.reference}</p>
        </div>
      );
    }
    if (game.type === 'whoami') {
      return (
        <div className="space-y-2">
          <p className="text-sm text-blue-600 font-semibold">{game.question}</p>
          {game.clues?.map((clue: string, idx: number) => (
            <div key={idx} className="p-2 bg-gray-50 rounded-lg text-sm">
              🔹 {clue}
            </div>
          ))}
        </div>
      );
    }
    if (game.type === 'memory') {
      return (
        <div className="space-y-2">
          <p className="text-sm text-blue-600 font-semibold">{game.question}</p>
          <div className="p-4 bg-church-cream rounded-lg border border-church-gold/20">
            <p className="text-lg italic text-church-navy">"{game.text}"</p>
          </div>
          <p className="text-sm text-gray-500">Parmi ces versets, lequel était affiché ?</p>
        </div>
      );
    }
    if (game.type === 'associate') {
      return (
        <div className="space-y-2">
          <p className="text-sm text-blue-600 font-semibold">{game.question}</p>
          <p className="text-lg font-medium">"{game.text}"</p>
          <p className="text-sm text-gray-400">{game.reference}</p>
        </div>
      );
    }
    if (game.type === 'find') {
      return (
        <div className="space-y-2">
          <p className="text-sm text-blue-600 font-semibold">{game.question}</p>
          <p className="text-sm text-gray-500">Choisis le bon verset :</p>
        </div>
      );
    }
    if (game.type === 'truefalse') {
      return (
        <div className="space-y-2">
          <p className="text-sm text-blue-600 font-semibold">{game.question}</p>
          <p className="text-lg font-medium">{game.statement}</p>
        </div>
      );
    }
    // Fallback pour les autres types (on masque aussi la référence si c'est un jeu de livre)
    return (
      <div className="space-y-2">
        <p className="text-sm text-blue-600 font-semibold">{game.question || '📖 Choisis la bonne réponse'}</p>
        {game.text && <p className="text-lg font-medium">{game.text}</p>}
        {game.reference && !isBookGame && <p className="text-sm text-gray-400">{game.reference}</p>}
      </div>
    );
  };

  const choices = game.choices || [];

  if (choices.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">Aucun choix disponible pour ce jeu.</p>
        <Button onClick={onNext} className="mt-3 bg-church-navy text-white">
          Rejouer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderContent()}
      <div className="grid grid-cols-1 gap-2">
        {choices.map((choice: string, idx: number) => {
          const isCorrect = choice === game.answer;
          let bgClass = 'border-gray-200 hover:bg-gray-50';
          if (showResult) {
            if (isCorrect) bgClass = 'border-green-500 bg-green-50';
            else if (selectedAnswer === choice && !isCorrect) bgClass = 'border-red-500 bg-red-50';
          }
          return (
            <button
              key={idx}
              onClick={() => onAnswer(choice)}
              disabled={showResult}
              className={`p-3 border-2 rounded-xl text-left transition ${bgClass}`}
            >
              {choice}
              {showResult && isCorrect && <span className="ml-2 text-green-600">✅</span>}
              {showResult && selectedAnswer === choice && !isCorrect && <span className="ml-2 text-red-600">❌</span>}
            </button>
          );
        })}
      </div>
      {showResult && (
        <div className="mt-4">
          <p className={selectedAnswer === game.answer ? 'text-green-600' : 'text-red-600'}>
            {selectedAnswer === game.answer ? '✅ Bonne réponse !' : `❌ Mauvaise réponse. La bonne était : ${game.answer}`}
          </p>
          <Button onClick={onNext} className="mt-2 bg-church-navy text-white">
            {game.questions && game.questions.length > 1 ? 'Question suivante' : 'Voir le résultat'}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------- COMPOSANT PRINCIPAL ----------
export default function Games() {
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [gameType, setGameType] = useState('');
  const [gameResult, setGameResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/games/stats');
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const startGame = async (type: string) => {
    setLoading(true);
    setError(null);
    setGameType(type);
    setGameResult(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuestionIndex(0);
    setStarted(false);
    setTimeLeft(30);

    try {
      const endpointMap: Record<string, string> = {
        daily: '/games/daily',
        speed: '/games/speed',
        fill: '/games/fill?difficulty=1',
        associate: '/games/associate',
        find: '/games/find',
        truefalse: '/games/truefalse',
        order: '/games/order',
        memory: '/games/memory',
        whoami: '/games/whoami',
        random: '/games/random',
        guess: '/games/guess',
        completion: '/games/completion',
        'who-said': '/games/who-said',
        book: '/games/book',
        chapter: '/games/chapter',
      };
      const endpoint = endpointMap[type] || '/games/random';
      const res = await api.get(endpoint);
      const gameData = res.data;

      // Éviter les répétitions
      if (gameData.text) {
        const questionKey = `${gameData.text.substring(0, 50)}-${gameData.reference || ''}`;
        if (askedQuestions.includes(questionKey)) {
          let attempts = 0;
          let found = false;
          while (attempts < 5 && !found) {
            const newRes = await api.get(endpoint);
            const newData = newRes.data;
            if (newData.text) {
              const newKey = `${newData.text.substring(0, 50)}-${newData.reference || ''}`;
              if (!askedQuestions.includes(newKey)) {
                setCurrentGame(newData);
                setAskedQuestions((prev) => [...prev, newKey]);
                found = true;
                break;
              }
            }
            attempts++;
          }
          if (!found) {
            setCurrentGame(gameData);
            setAskedQuestions((prev) => [...prev, questionKey]);
          }
        } else {
          setCurrentGame(gameData);
          setAskedQuestions((prev) => [...prev, questionKey]);
        }
      } else {
        setCurrentGame(gameData);
      }

      if (type === 'speed') {
        setTimeLeft(gameData.timeLimit || 30);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: any) => {
    setSelectedAnswer(answer);
    const isCorrect = JSON.stringify(answer) === JSON.stringify(currentGame?.answer);
    if (isCorrect) {
      // Gestion du score si besoin
    }
    setShowResult(true);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setGameResult({ score: 1, total: 1, type: gameType });
  };

  const handleFinish = (result: any) => {
    setGameResult(result);
    api.post('/games/attempt', result).catch(console.error);
    fetchStats();
  };

  const resetGame = () => {
    setCurrentGame(null);
    setGameResult(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuestionIndex(0);
    setStarted(false);
    setTimeLeft(30);
    setAskedQuestions([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-cream">
        <Loader2 className="animate-spin text-church-gold" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-church-cream flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl max-w-md text-center">
          <p className="text-red-600 text-xl font-bold">⚠️ Erreur</p>
          <p className="text-red-500 mt-2">{error}</p>
          <Button onClick={() => setError(null)} className="mt-4 bg-church-gold text-white">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (currentGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-6 md:p-10">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => {
              resetGame();
            }}
            className="text-sm text-gray-500 hover:text-church-navy transition mb-6"
          >
            ← Retour aux jeux
          </button>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-church-navy text-xl flex items-center gap-2">
                <Gamepad2 className="text-church-gold" size={24} />
                {gameType.charAt(0).toUpperCase() + gameType.slice(1).replace('-', ' ')}
              </CardTitle>
              <CardDescription>
                {currentGame.xp && `🏆 ${currentGame.xp} XP`}
                {currentGame.difficulty && ` • Niveau ${currentGame.difficulty}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gameResult ? (
                <div className="text-center py-8">
                  <Trophy className="mx-auto text-church-gold" size={64} />
                  <p className="text-2xl font-bold text-church-navy mt-4">Terminé !</p>
                  <p className="text-lg">Score : {gameResult.score}/{gameResult.total}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {gameResult.score === gameResult.total
                      ? '🌟 Parfait ! Continue comme ça !'
                      : gameResult.score >= gameResult.total / 2
                      ? '👏 Bien joué !'
                      : '💪 Continue de t\'entraîner !'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                    <Button
                      onClick={() => {
                        setGameResult(null);
                        setSelectedAnswer(null);
                        setShowResult(false);
                        setQuestionIndex(0);
                        setAskedQuestions([]);
                        startGame(gameType);
                      }}
                      className="bg-church-gold hover:bg-church-gold/80 text-white"
                    >
                      <RefreshCw size={18} className="mr-2" /> Rejouer
                    </Button>
                    <Button
                      onClick={() => {
                        resetGame();
                      }}
                      variant="outline"
                      className="border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      Retour aux jeux
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {gameType === 'daily' && <DailyQuiz game={currentGame} onFinish={handleFinish} />}
                  {gameType === 'speed' && <SpeedGame game={currentGame} onFinish={handleFinish} />}
                  {!['daily', 'speed'].includes(gameType) && (
                    <QcmGame
                      game={currentGame}
                      onAnswer={handleAnswer}
                      onNext={handleNext}
                      showResult={showResult}
                      selectedAnswer={selectedAnswer}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ---------- MENU PRINCIPAL ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-church-cream via-white to-church-cream p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-church-gold/10 rounded-full">
            <Gamepad2 className="text-church-gold" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-church-navy">Jeux bibliques</h1>
            <p className="text-gray-500">Apprends la Bible en t'amusant !</p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-church-navy">{stats.totalGames}</p>
              <p className="text-sm text-gray-500">Parties jouées</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-church-navy">{stats.totalScore}</p>
              <p className="text-sm text-gray-500">Points totaux</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-church-navy">{stats.averageScore}</p>
              <p className="text-sm text-gray-500">Moyenne/partie</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
              <p className="text-sm text-gray-500">Taux de réussite</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button onClick={() => startGame('daily')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-left">
            <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-church-gold/10 rounded-full"><Star className="text-church-gold" size={20} /></div><h3 className="font-semibold text-church-navy">Quiz du jour</h3></div>
            <p className="text-sm text-gray-500">5 questions QCM quotidiennes</p><p className="text-xs text-gray-400 mt-2">⭐ 100 XP</p>
          </button>

          <button onClick={() => startGame('speed')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-left">
            <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-red-50 rounded-full"><Clock className="text-red-500" size={20} /></div><h3 className="font-semibold text-church-navy">Course contre la montre</h3></div>
            <p className="text-sm text-gray-500">10 questions en 30s</p><p className="text-xs text-gray-400 mt-2">⭐ 50-150 XP</p>
          </button>

          <button onClick={() => startGame('who-said')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-left">
            <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-blue-50 rounded-full"><Users className="text-blue-500" size={20} /></div><h3 className="font-semibold text-church-navy">Qui a dit ?</h3></div>
            <p className="text-sm text-gray-500">Devine le personnage</p><p className="text-xs text-gray-400 mt-2">⭐ 100 XP</p>
          </button>

          <button onClick={() => startGame('book')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-left">
            <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-green-50 rounded-full"><BookOpen className="text-green-500" size={20} /></div><h3 className="font-semibold text-church-navy">Dans quel livre ?</h3></div>
            <p className="text-sm text-gray-500">Identifie le livre</p><p className="text-xs text-gray-400 mt-2">⭐ 80 XP</p>
          </button>

          <button onClick={() => startGame('chapter')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-left">
            <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-purple-50 rounded-full"><Target className="text-purple-500" size={20} /></div><h3 className="font-semibold text-church-navy">Dans quel chapitre ?</h3></div>
            <p className="text-sm text-gray-500">Trouve le chapitre</p><p className="text-xs text-gray-400 mt-2">⭐ 100 XP</p>
          </button>

          <button onClick={() => startGame('completion')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-left">
            <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-yellow-50 rounded-full"><Zap className="text-yellow-500" size={20} /></div><h3 className="font-semibold text-church-navy">Complète la phrase</h3></div>
            <p className="text-sm text-gray-500">Trouve le mot manquant</p><p className="text-xs text-gray-400 mt-2">⭐ 60 XP</p>
          </button>

          <button onClick={() => startGame('whoami')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-left">
            <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-pink-50 rounded-full"><Users className="text-pink-500" size={20} /></div><h3 className="font-semibold text-church-navy">Qui suis-je ?</h3></div>
            <p className="text-sm text-gray-500">Devine le personnage</p><p className="text-xs text-gray-400 mt-2">⭐ 150 XP</p>
          </button>

          <button onClick={() => startGame('guess')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-left">
            <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-indigo-50 rounded-full"><Brain className="text-indigo-500" size={20} /></div><h3 className="font-semibold text-church-navy">Devine</h3></div>
            <p className="text-sm text-gray-500">Jeu aléatoire</p><p className="text-xs text-gray-400 mt-2">⭐ 50 XP</p>
          </button>

          <button onClick={() => startGame('random')} className="bg-church-gold text-white p-6 rounded-xl shadow-sm border border-church-gold hover:shadow-md transition text-left col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-white/20 rounded-full"><RefreshCw className="text-white" size={20} /></div><h3 className="font-semibold">🔀 Jeu aléatoire</h3></div>
            <p className="text-sm text-white/80">La surprise à chaque fois !</p><p className="text-xs text-white/60 mt-2">⭐ XP variable</p>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">Tu peux aussi lancer des jeux via l'<a href="/ia" className="text-church-gold font-semibold ml-1 hover:underline">Assistant IA</a></p>
        </div>
      </div>
    </div>
  );
}