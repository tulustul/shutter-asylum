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
    visibilityLevel: 100,
    aiReactionTime: 1000,
  },
  normal: {
    name: 'normal',
    playerHealthMultiplier: 1,
    enemyHealthMultiplier: 1,
    visibilityLevel: 70,
    aiReactionTime: 500,
  },
  hard: {
    name: 'hard',
    playerHealthMultiplier: 0.5,
    enemyHealthMultiplier: 2,
    visibilityLevel: 40,
    aiReactionTime: 250,
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
