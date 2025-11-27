import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  LevelData, 
  PlayerState, 
  Block, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GRAVITY, 
  FRICTION, 
  MOVE_SPEED, 
  MAX_SPEED, 
  JUMP_FORCE, 
  BOUNCE_FORCE 
} from '../types';
import { RefreshCcw, Trophy, Frown } from 'lucide-react';

interface GameCanvasProps {
  levelData: LevelData;
  onWin: () => void;
}

const PLAYER_SIZE = 30;

export const GameCanvas: React.FC<GameCanvasProps> = ({ levelData, onWin }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'died'>('playing');
  
  // Game State Refs (using refs for mutable state in the game loop)
  const player = useRef<PlayerState>({
    x: levelData.playerStart.x,
    y: levelData.playerStart.y,
    vx: 0,
    vy: 0,
    isGrounded: false,
    color: '#60A5FA' // Pastel Blue
  });

  const keys = useRef<{ [key: string]: boolean }>({});
  const requestRef = useRef<number>(0);
  const frameCount = useRef<number>(0);

  // Reset player when level changes
  useEffect(() => {
    resetPlayer();
    setGameState('playing');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelData]);

  const resetPlayer = () => {
    player.current = {
      x: levelData.playerStart.x,
      y: levelData.playerStart.y,
      vx: 0,
      vy: 0,
      isGrounded: false,
      color: '#60A5FA'
    };
    setGameState('playing');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    keys.current[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keys.current[e.code] = false;
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const checkCollision = (p: PlayerState, b: Block) => {
    return (
      p.x < b.x + b.w &&
      p.x + PLAYER_SIZE > b.x &&
      p.y < b.y + b.h &&
      p.y + PLAYER_SIZE > b.y
    );
  };

  const update = useCallback(() => {
    if (gameState !== 'playing') {
       draw();
       requestRef.current = requestAnimationFrame(update);
       return;
    }

    const p = player.current;

    // --- Input Handling ---
    if (keys.current['ArrowLeft'] || keys.current['KeyA']) {
      if (p.vx > -MAX_SPEED) p.vx -= MOVE_SPEED;
    }
    if (keys.current['ArrowRight'] || keys.current['KeyD']) {
      if (p.vx < MAX_SPEED) p.vx += MOVE_SPEED;
    }
    if ((keys.current['ArrowUp'] || keys.current['Space'] || keys.current['KeyW']) && p.isGrounded) {
      p.vy = JUMP_FORCE;
      p.isGrounded = false;
    }

    // --- Physics ---
    p.vy += GRAVITY;
    p.vx *= FRICTION;
    p.x += p.vx;
    p.y += p.vy;
    p.isGrounded = false;

    // Floor bounds
    if (p.y + PLAYER_SIZE > CANVAS_HEIGHT) {
      setGameState('died');
    }

    // Level Blocks Collision
    for (const block of levelData.blocks) {
      if (checkCollision(p, block)) {
        if (block.type === 'goal') {
          setGameState('won');
          onWin();
          return;
        } else if (block.type === 'hazard') {
          setGameState('died');
          return;
        } else if (block.type === 'bounce') {
           if (p.vy > 0 && p.y + PLAYER_SIZE - p.vy <= block.y) {
              p.vy = BOUNCE_FORCE;
              p.y = block.y - PLAYER_SIZE;
           }
        }

        // Solid Block Collision Logic
        if (block.type === 'solid' || block.type === 'bounce') {
          const dx = (p.x + PLAYER_SIZE / 2) - (block.x + block.w / 2);
          const dy = (p.y + PLAYER_SIZE / 2) - (block.y + block.h / 2);
          const width = (PLAYER_SIZE + block.w) / 2;
          const height = (PLAYER_SIZE + block.h) / 2;
          const crossWidth = width * dy;
          const crossHeight = height * dx;

          if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
            if (crossWidth > crossHeight) {
              if (crossWidth > -crossHeight) {
                p.y = block.y + block.h;
                p.vy = 0;
              } else {
                p.x = block.x - PLAYER_SIZE;
                p.vx = 0;
              }
            } else {
              if (crossWidth > -crossHeight) {
                p.x = block.x + block.w;
                p.vx = 0;
              } else {
                if (p.vy > 0) {
                    p.y = block.y - PLAYER_SIZE;
                    p.vy = 0;
                    p.isGrounded = true;
                }
              }
            }
          }
        }
      }
    }

    if (p.x < 0) { p.x = 0; p.vx = 0; }
    if (p.x + PLAYER_SIZE > CANVAS_WIDTH) { p.x = CANVAS_WIDTH - PLAYER_SIZE; p.vx = 0; }

    draw();
    requestRef.current = requestAnimationFrame(update);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, levelData, onWin]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = levelData.backgroundColor || '#F3E5F5';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Cute Grid (Dots instead of lines)
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        for(let j=0; j<CANVAS_HEIGHT; j+= 40) {
            ctx.beginPath();
            ctx.arc(i, j, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw Blocks
    levelData.blocks.forEach(b => {
      // Rounded rectangles for blocks? Let's keep it simple for now but use nice colors
      ctx.fillStyle = b.color || '#DDD';
      
      if (b.type === 'hazard') {
        ctx.shadowBlur = 15;
        ctx.shadowColor = b.color || 'pink';
      } else if (b.type === 'goal') {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FDE68A'; // Soft yellow glow
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.shadowBlur = 0;

      // Soft Border
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      
      // Decoration
      if (b.type === 'hazard') {
        // Spikes pattern overlay
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for(let i = b.x; i < b.x + b.w; i+=10) {
             ctx.beginPath();
             ctx.moveTo(i, b.y + b.h);
             ctx.lineTo(i + 5, b.y);
             ctx.lineTo(i + 10, b.y + b.h);
             ctx.fill();
        }
      }
    });

    // Draw Player
    const p = player.current;
    ctx.fillStyle = p.color;
    // Draw rounded rect for player
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, PLAYER_SIZE, PLAYER_SIZE, 8);
    ctx.fill();
    
    // Player Eyes (Kawaii style)
    ctx.fillStyle = 'white';
    const lookDir = p.vx >= 0 ? 1 : -1;
    
    // Eyes
    ctx.beginPath();
    ctx.ellipse(p.x + (lookDir === 1 ? 20 : 6), p.y + 10, 3, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(p.x + (lookDir === 1 ? 26 : 12), p.y + 10, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blush
    ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
    ctx.beginPath();
    ctx.ellipse(p.x + (lookDir === 1 ? 24 : 10), p.y + 18, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    frameCount.current++;
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  return (
    <div className="relative group rounded-3xl overflow-hidden shadow-2xl shadow-purple-200 border-4 border-white bg-white">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="block w-full max-w-full h-auto"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Overlay for Death */}
      {gameState === 'died' && (
        <div className="absolute inset-0 bg-red-100/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
          <Frown size={64} className="text-red-400 mb-2" />
          <h2 className="text-4xl font-pixel text-red-500 mb-4 drop-shadow-sm">Oh no!</h2>
          <button 
            onClick={resetPlayer}
            className="flex items-center gap-2 px-8 py-3 bg-white text-red-500 font-bold rounded-2xl hover:bg-red-50 transition shadow-lg border border-red-100 transform hover:-translate-y-1"
          >
            <RefreshCcw size={20} /> Try Again
          </button>
        </div>
      )}

      {/* Overlay for Win */}
      {gameState === 'won' && (
        <div className="absolute inset-0 bg-green-100/70 backdrop-blur-sm flex flex-col items-center justify-center animate-in zoom-in duration-300">
          <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce drop-shadow-md" />
          <h2 className="text-4xl font-pixel text-green-600 mb-4 drop-shadow-sm">YAY! CLEARED!</h2>
          <button 
            onClick={resetPlayer}
            className="flex items-center gap-2 px-8 py-3 bg-white text-green-600 font-bold rounded-2xl hover:bg-green-50 transition shadow-lg border border-green-100 transform hover:-translate-y-1"
          >
            <RefreshCcw size={20} /> Replay
          </button>
        </div>
      )}

      {/* Controls Hint */}
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur text-slate-500 p-3 rounded-xl text-xs font-bold shadow-sm pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
        WASD / Arrows to Move • SPACE to Jump
      </div>
    </div>
  );
};