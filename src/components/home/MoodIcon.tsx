import type { Mood } from '@/lib/animal-mood';
import { Image } from 'expo-image';

const MOOD_IMAGES: Record<Mood, number> = {
  happy: require('../../../assets/misc/mood_happy.png'),
  okay: require('../../../assets/misc/mood_okay.png'),
  sad: require('../../../assets/misc/mood_sad.png'),
};

export type MoodIconProps = {
  mood: Mood;
  size?: number;
};

export function MoodIcon({ mood, size = 64 }: MoodIconProps) {
  return (
    <Image
      accessible={false}
      contentFit="contain"
      source={MOOD_IMAGES[mood]}
      style={{ width: size, height: size }}
      transition={0}
    />
  );
}
