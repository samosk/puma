import type { LevelProgress } from '@/lib/animal-level';
import type { Mood, MoodResult } from '@/lib/animal-mood';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { MoodIcon } from './MoodIcon';

const ARC_RADIUS = 55;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;
const ARC_LENGTH = ARC_CIRCUMFERENCE * 0.75;
const MOOD_ICON_SIZE = 70;

const MOOD_PRESENTATION: Record<Mood, { color: string; label: string }> = {
  sad: { color: '#F04438', label: 'Sad' },
  okay: { color: '#F5B700', label: 'Okay' },
  happy: { color: '#16C91A', label: 'Happy' },
};

export type HomeAnimalStatusProps = {
  animalName: string;
  level: LevelProgress;
  mood: MoodResult;
  style?: StyleProp<ViewStyle>;
};

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function HomeAnimalStatus({
  animalName,
  level,
  mood,
  style,
}: HomeAnimalStatusProps) {
  const moodPresentation = MOOD_PRESENTATION[mood.mood];
  const moodPercentage = clampPercentage(mood.percentage);
  const xpPercentage = clampPercentage(level.percentage);
  const filledArcLength = ARC_LENGTH * (moodPercentage / 100);
  const xpPerLevel = level.xpIntoLevel + level.xpForNextLevel;

  return (
    <View
      accessible
      accessibilityLabel={`${animalName}. Level ${level.level}, ${level.xpIntoLevel} of ${xpPerLevel} XP. Mood ${moodPresentation.label}, ${Math.round(moodPercentage)} percent.`}
      accessibilityRole="text"
      style={[styles.container, style]}
    >
      <View style={styles.levelSection}>
        <Text numberOfLines={1} style={styles.animalName}>
          {animalName}
        </Text>

        <View style={styles.levelRow}>
          <Text style={styles.levelLabel}>Level</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelNumber}>{level.level}</Text>
          </View>
        </View>

        <View style={styles.xpTrack}>
          <View style={[styles.xpFill, { width: `${xpPercentage}%` }]} />
        </View>
      </View>

      <View style={styles.moodSection}>
        <Svg
          height="100%"
          pointerEvents="none"
          viewBox="0 0 150 150"
          width="100%"
        >
          <Circle
            cx="75"
            cy="75"
            fill="none"
            r={ARC_RADIUS}
            stroke="#B8B8B8"
            strokeDasharray={[
              ARC_LENGTH,
              ARC_CIRCUMFERENCE - ARC_LENGTH,
            ]}
            strokeLinecap="butt"
            strokeWidth="18"
            transform="rotate(135 75 75)"
          />
          {filledArcLength > 0 ? (
            <Circle
              cx="75"
              cy="75"
              fill="none"
              r={ARC_RADIUS}
              stroke={moodPresentation.color}
              strokeDasharray={[
                filledArcLength,
                ARC_CIRCUMFERENCE - filledArcLength,
              ]}
              strokeLinecap="butt"
              strokeWidth="18"
              transform="rotate(135 75 75)"
            />
          ) : null}
        </Svg>

        <View style={styles.moodIcon}>
          <MoodIcon mood={mood.mood} size={MOOD_ICON_SIZE} />
        </View>
        <Text style={styles.moodLabel}>{moodPresentation.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 370,
    aspectRatio: 370 / 150,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    borderTopRightRadius: 75,
    borderBottomRightRadius: 75,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 5,
  },
  levelSection: {
    width: '62%',
    height: '100%',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingRight: 18,
    paddingLeft: 20,
  },
  animalName: {
    color: '#111111',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelLabel: {
    color: '#111111',
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  levelBadge: {
    minWidth: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    backgroundColor: '#F2F2F2',
    borderWidth: 2,
    borderColor: '#B8B8B8',
    borderRadius: 10,
  },
  levelNumber: {
    color: '#111111',
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 27,
  },
  xpTrack: {
    height: 14,
    overflow: 'hidden',
    backgroundColor: '#AFAFAF',
    borderRadius: 7,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#F5B700',
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
  },
  moodSection: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '40%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -(MOOD_ICON_SIZE / 2) },
      { translateY: -(MOOD_ICON_SIZE / 2) },
    ],
  },
  moodLabel: {
    position: 'absolute',
    bottom: 9,
    color: '#111111',
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
