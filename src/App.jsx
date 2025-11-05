import { useState, useEffect, useCallback } from 'react';
import './App.css';

const SnakeGame = () => {
  const [gameOver, setGameOver] = useState(false);
  const [food, setFood] = useState({ x: 0, y: 0, type: 'normal' });
  const [snake, setSnake] = useState([{ x: 5, y: 5 }]);
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(150);
  const [specialFoodActive, setSpecialFoodActive] = useState(false);

  const GRID_SIZE = 30;

  // Initialize high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem("snake-high-score") || 0;
    setHighScore(parseInt(savedHighScore));
  }, []);

  // Generate random food position
  const updateFoodPosition = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE) + 1,
      y: Math.floor(Math.random() * GRID_SIZE) + 1,
      type: 'normal'
    };
    
    // 20% chance for special food when score > 0
    if (score > 0 && Math.random() < 0.2 && !specialFoodActive) {
      newFood.type = 'special';
      setSpecialFoodActive(true);
    }
    
    setFood(newFood);
  }, [score, specialFoodActive]);

  // Handle game over
  const handleGameOver = useCallback(() => {
    setGameOver(true);
    setTimeout(() => {
      alert(`Game Over! Your score: ${score}\nHigh Score: ${highScore}\nPress OK to play again!`);
      resetGame();
    }, 100);
  }, [score, highScore]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameOver(false);
    setSnake([{ x: 5, y: 5 }]);
    setVelocity({ x: 0, y: 0 });
    setScore(0);
    setGameSpeed(150);
    setIsPaused(false);
    setSpecialFoodActive(false);
    updateFoodPosition();
  }, [updateFoodPosition]);

  // Update game speed based on score
  useEffect(() => {
    if (score <= 5) {
      setGameSpeed(150); // Slow start
    } else if (score <= 10) {
      setGameSpeed(120); // Medium
    } else if (score <= 20) {
      setGameSpeed(100); // Fast
    } else if (score <= 30) {
      setGameSpeed(80); // Very fast
    } else {
      setGameSpeed(60); // Extreme
    }
  }, [score]);

  // Change direction
  const changeDirection = useCallback((e) => {
    if (gameOver) return;
    
    const key = e.key || e;
    
    // Space bar to pause/unpause
    if (key === " " || key === "Escape") {
      setIsPaused(prev => !prev);
      return;
    }

    if (isPaused) return;
    
    if ((key === "ArrowUp" || key === "w" || key === "W") && velocity.y !== 1) {
      setVelocity({ x: 0, y: -1 });
    } else if ((key === "ArrowDown" || key === "s" || key === "S") && velocity.y !== -1) {
      setVelocity({ x: 0, y: 1 });
    } else if ((key === "ArrowLeft" || key === "a" || key === "A") && velocity.x !== 1) {
      setVelocity({ x: -1, y: 0 });
    } else if ((key === "ArrowRight" || key === "d" || key === "D") && velocity.x !== -1) {
      setVelocity({ x: 1, y: 0 });
    }
  }, [velocity, isPaused, gameOver]);

  // Handle control button clicks
  const handleControlClick = (direction) => {
    changeDirection(direction);
  };

  // Game loop
  useEffect(() => {
    if (gameOver || isPaused) return;

    const gameLoop = setInterval(() => {
      setSnake(prevSnake => {
        const newSnake = [...prevSnake];
        const head = { ...newSnake[0] };

        // Move head
        head.x += velocity.x;
        head.y += velocity.y;

        // Check wall collision
        if (head.x <= 0 || head.x > GRID_SIZE || head.y <= 0 || head.y > GRID_SIZE) {
          handleGameOver();
          return prevSnake;
        }

        // Check self collision
        for (let i = 1; i < newSnake.length; i++) {
          if (head.x === newSnake[i].x && head.y === newSnake[i].y) {
            handleGameOver();
            return prevSnake;
          }
        }

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          let points = 1;
          
          if (food.type === 'special') {
            points = Math.random() < 0.5 ? 3 : 5; // 50% chance for 3 or 5 points
            setSpecialFoodActive(false);
          }
          
          // Add new segment and update score
          const newScore = score + points;
          setScore(newScore);
          
          if (newScore > highScore) {
            const newHighScore = newScore;
            setHighScore(newHighScore);
            localStorage.setItem("snake-high-score", newHighScore.toString());
          }
          
          updateFoodPosition();
          // Don't remove tail when eating food (snake grows)
          // Add multiple segments for special food
          const newSegments = food.type === 'special' ? [head, ...newSnake, ...newSnake.slice(-1)] : [head, ...newSnake];
          return newSegments;
        } else {
          // Move snake (remove tail)
          return [head, ...newSnake.slice(0, -1)];
        }
      });
    }, gameSpeed);

    return () => clearInterval(gameLoop);
  }, [velocity, food, gameOver, score, highScore, updateFoodPosition, handleGameOver, isPaused, gameSpeed]);

  // Initialize food position
  useEffect(() => {
    updateFoodPosition();
  }, [updateFoodPosition]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' ', 'Escape'].includes(e.key)) {
        e.preventDefault();
        changeDirection(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection]);

  // Render game board
  const renderBoard = () => {
    const board = [];

    // Add food
    board.push(
      <div 
        key="food" 
        className={`food ${food.type}`}
        style={{
          gridArea: `${food.y} / ${food.x}`
        }}
      />
    );

    // Add snake
    snake.forEach((segment, index) => {
      board.push(
        <div
          key={`snake-${index}`}
          className={index === 0 ? 'head' : 'body'}
          style={{
            gridArea: `${segment.y} / ${segment.x}`
          }}
        />
      );
    });

    return board;
  };

  const getSpeedDescription = () => {
    if (gameSpeed >= 140) return 'Slow';
    if (gameSpeed >= 110) return 'Medium';
    if (gameSpeed >= 90) return 'Fast';
    if (gameSpeed >= 70) return 'Very Fast';
    return 'Extreme';
  };

  return (
    <div className="snake-wrapper">
      <div className="snake-container">
        <div className="game-title">
          <h1>🐍 Snake Game</h1>
        </div>
        
        <div className="snake-game">
          <div className="snake-header">
            <div className="score-info">
              <span className="score">Score: {score}</span>
              <span className="high-score">High Score: {highScore}</span>
              <span className="speed">Speed: {getSpeedDescription()}</span>
            </div>
            <button 
              className="pause-btn"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
          </div>
          
          <div className="play-board">
            {isPaused && (
              <div className="paused-overlay">
                <div className="paused-text">PAUSED</div>
              </div>
            )}
            {renderBoard()}
          </div>
          
          <div className="game-instructions">
            <p><span className="snake-color">🟩 Green</span> = Snake • <span className="food-color">🟥 Red</span> = Food (+1) • <span className="special-food-color">🟨 Yellow</span> = Special (+3/+5)</p>
            <p>Use arrow keys or WASD to move • Space/Esc to pause</p>
            <p>Speed increases as you score more points!</p>
          </div>

          <div className="mobile-controls">
            <div className="controls-row">
              <button 
                className="control-btn" 
                onClick={() => handleControlClick('ArrowUp')}
              >
                ⬆️
              </button>
            </div>
            <div className="controls-row">
              <button 
                className="control-btn" 
                onClick={() => handleControlClick('ArrowLeft')}
              >
                ⬅️
              </button>
              <button 
                className="control-btn pause-mobile"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? '▶️' : '⏸️'}
              </button>
              <button 
                className="control-btn" 
                onClick={() => handleControlClick('ArrowRight')}
              >
                ➡️
              </button>
            </div>
            <div className="controls-row">
              <button 
                className="control-btn" 
                onClick={() => handleControlClick('ArrowDown')}
              >
                ⬇️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
