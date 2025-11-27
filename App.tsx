import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { generateLevel } from './services/geminiService';
import { LevelData, CANVAS_WIDTH, CANVAS_HEIGHT } from './types';
import { Sparkles, Loader2, Gamepad2, AlertCircle, Palette } from 'lucide-react';

const INITIAL_LEVEL: LevelData = {
  title: "Sweet Start World",
  description: "A cute beginner level. Reach the green block!",
  backgroundColor: "#E0F2F1", // Mint cream
  playerStart: { x: 50, y: 300 },
  blocks: [
    { x: 0, y: 400, w: 200, h: 40, type: 'solid', color: '#F48FB1' }, // Pink
    { x: 250, y: 350, w: 100, h: 20, type: 'solid', color: '#CE93D8' }, // Lavender
    { x: 400, y: 300, w: 100, h: 20, type: 'bounce', color: '#FFCC80' }, // Peach
    { x: 550, y: 150, w: 200, h: 40, type: 'solid', color: '#90CAF9' }, // Blue
    { x: 650, y: 110, w: 40, h: 40, type: 'goal', color: '#69F0AE' }, // Green accent
    { x: 0, y: 580, w: 800, h: 20, type: 'hazard', color: '#EF9A9A' } // Soft Red
  ]
};

function App() {
  const [prompt, setPrompt] = useState('');
  const [level, setLevel] = useState<LevelData>(INITIAL_LEVEL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const newLevel = await generateLevel(prompt);
      setLevel(newLevel);
    } catch (err) {
      setError("Failed to generate level. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 lg:p-8">
      
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-8 bg-white/60 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-pink-100">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-pink-400 to-purple-400 p-3 rounded-2xl shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
            <Gamepad2 size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-pixel tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 drop-shadow-sm">
              AI OBBY MAKER
            </h1>
            <p className="text-xs text-purple-400 font-bold tracking-wider">POWERED BY GEMINI 2.5</p>
          </div>
        </div>
        <div className="hidden sm:block">
            <Palette className="text-pink-300" size={32} />
        </div>
      </header>

      {/* Game Area */}
      <main className="w-full max-w-4xl">
        
        {/* Input Section */}
        <section className="mb-8 bg-white/80 backdrop-blur-md p-6 rounded-3xl border-2 border-white shadow-xl shadow-purple-100/50">
          <form onSubmit={handleGenerate} className="flex gap-4 flex-col md:flex-row items-stretch">
            <div className="flex-1">
              <label htmlFor="prompt" className="block text-sm font-bold text-slate-500 mb-2 ml-1">
                ✨ Design your dream level
              </label>
              <input
                id="prompt"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. ด่านขนมหวานที่มีโดนัท (Candy land with donuts)"
                className="w-full bg-pink-50/50 border-2 border-pink-100 rounded-2xl px-5 py-4 text-slate-700 placeholder-pink-300 focus:ring-4 focus:ring-pink-200 focus:border-pink-300 transition outline-none text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !prompt}
              className="md:self-end bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 hover:from-pink-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-purple-200/50 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 active:scale-95 text-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              <span>Generate!</span>
            </button>
          </form>
          
          {error && (
            <div className="mt-4 text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-xl border border-red-100">
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </section>

        {/* Canvas Wrapper */}
        <div className="flex flex-col items-center">
            <div className="w-full flex justify-between items-end mb-4 px-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                        <span className="text-2xl">🎨</span> {level.title}
                    </h2>
                    <p className="text-slate-400 text-sm font-medium ml-9">{level.description}</p>
                </div>
                <div className="px-3 py-1 bg-white rounded-full text-xs font-mono text-slate-400 border border-slate-100 shadow-sm">
                    {CANVAS_WIDTH}x{CANVAS_HEIGHT}
                </div>
            </div>
            
            <GameCanvas 
              levelData={level} 
              onWin={() => console.log("Win triggered in App")} 
            />
            
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center transition-transform hover:scale-105">
                  <div className="w-8 h-8 bg-blue-400 mb-2 rounded-lg shadow-md"></div>
                  <span className="text-sm font-bold text-slate-600">Player</span>
               </div>
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center transition-transform hover:scale-105">
                  <div className="w-8 h-8 bg-gray-300 mb-2 rounded-lg border-2 border-gray-200"></div>
                  <span className="text-sm font-bold text-slate-600">Platform</span>
               </div>
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center transition-transform hover:scale-105">
                  <div className="w-8 h-8 bg-red-300 mb-2 rounded-lg shadow-[0_0_15px_rgba(252,165,165,0.6)]"></div>
                  <span className="text-sm font-bold text-slate-600">Danger!</span>
               </div>
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center transition-transform hover:scale-105">
                  <div className="w-8 h-8 bg-green-300 mb-2 rounded-lg shadow-[0_0_15px_rgba(134,239,172,0.6)]"></div>
                  <span className="text-sm font-bold text-slate-600">Goal</span>
               </div>
            </div>
        </div>
      </main>

      <footer className="mt-12 text-center text-slate-400 text-sm">
        Generated with ❤️ by AI • Gemini 2.5
      </footer>
    </div>
  );
}

export default App;