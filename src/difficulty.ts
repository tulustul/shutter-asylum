interface DifficultyOptions {
  name: string;
  playerHealthMultiplier: number;
  enemyHealthMultiplier: number;
  visibilityLevel: number;
  aiReactionTime: number;
}

const DIFFICULTY_KEY = 'difficulty';

export const difficultyOptions: {[key: string]: DifficultyOptions} = {
  easy: {
    name: 'easy',
    playerHealthMultiplier: 2,
    enemyHealthMultiplier: 0.4,
    visibilityLevel: 90,
    aiReactionTime: 900,
  },
  normal: {
    name: 'normal',
    playerHealthMultiplier: 1,
    enemyHealthMultiplier: 0.8,
    visibilityLevel: 60,
    aiReactionTime: 300,
  },
  hard: {
    name: 'hard',
    playerHealthMultiplier: 0.6,
    enemyHealthMultiplier: 1.2,
    visibilityLevel: 40,
    aiReactionTime: 400,
  },
};

export let difficulty: DifficultyOptions =
  difficultyOptions[localStorage.getItem(DIFFICULTY_KEY) || 'normal'];

export function setNextDifficulty() {
  switch (difficulty.name) {
    case 'easy':
      difficulty = difficultyOptions.normal;
      break;
    case 'normal':
      difficulty = difficultyOptions.hard;
      break;
    case 'hard':
      difficulty = difficultyOptions.easy;
      break;
  }

  localStorage.setItem(DIFFICULTY_KEY, difficulty.name);

}
