export type Mood = 'sad' | 'okay' | 'happy';

export type MoodResult = {
  mood: Mood;
  percentage: number;
  actualProgress: number;
  expectedProgress: number;
};

type CalculateMoodInput = {
  animalSteps: number;
  dailyStepGoal: number;
  now?: Date;
};

type ActivityCheckpoint = {
  minutes: number;
  progress: number;
};

const ACTIVITY_CURVE: ActivityCheckpoint[] = [
  { minutes: 7 * 60, progress: 0 },
  { minutes: 10 * 60, progress: 0.1 },
  { minutes: 14 * 60, progress: 0.35 },
  { minutes: 18 * 60, progress: 0.65 },
  { minutes: 22 * 60, progress: 1 },
];

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getExpectedActivityProgress(now: Date = new Date()) {
  if (!Number.isFinite(now.getTime())) {
    return 0;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const firstCheckpoint = ACTIVITY_CURVE[0];
  const lastCheckpoint = ACTIVITY_CURVE[ACTIVITY_CURVE.length - 1];

  if (currentMinutes <= firstCheckpoint.minutes) {
    return firstCheckpoint.progress;
  }

  if (currentMinutes >= lastCheckpoint.minutes) {
    return lastCheckpoint.progress;
  }

  for (let index = 1; index < ACTIVITY_CURVE.length; index += 1) {
    const nextCheckpoint = ACTIVITY_CURVE[index];

    if (currentMinutes <= nextCheckpoint.minutes) {
      const previousCheckpoint = ACTIVITY_CURVE[index - 1];
      const intervalMinutes =
        nextCheckpoint.minutes - previousCheckpoint.minutes;
      const elapsedMinutes = currentMinutes - previousCheckpoint.minutes;
      const intervalProgress = elapsedMinutes / intervalMinutes;

      return (
        previousCheckpoint.progress +
        (nextCheckpoint.progress - previousCheckpoint.progress) *
          intervalProgress
      );
    }
  }

  return lastCheckpoint.progress;
}

export function calculateMood({
  animalSteps,
  dailyStepGoal,
  now = new Date(),
}: CalculateMoodInput): MoodResult {
  const expectedProgress = getExpectedActivityProgress(now);

  if (!Number.isFinite(dailyStepGoal) || dailyStepGoal <= 0) {
    return {
      mood: 'okay',
      percentage: 50,
      actualProgress: 0,
      expectedProgress,
    };
  }

  const safeAnimalSteps = Number.isFinite(animalSteps)
    ? Math.max(0, animalSteps)
    : 0;
  const actualProgress = clamp(safeAnimalSteps / dailyStepGoal, 0, 1);
  const percentage = clamp(
    50 + 150 * actualProgress - 100 * expectedProgress,
    0,
    100,
  );

  const mood: Mood =
    percentage >= 66 ? 'happy' : percentage >= 33 ? 'okay' : 'sad';

  return {
    mood,
    percentage,
    actualProgress,
    expectedProgress,
  };
}
