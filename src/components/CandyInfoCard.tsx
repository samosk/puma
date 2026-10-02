/*
 * CandyInfoCard.tsx
 * A pop up "card" to show the adress of the candy and a button that dorect the user to 
 * apple maps for directions.
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRef } from 'react';
import {
	Animated,
	PanResponder,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

import type { Candy } from '../types/types';

type CandyCardProps = {
  candy: Candy;
  address: string;
  onClose: () => void;
  onDirections: () => void;
};

export default function CandyInfoCard({
  candy,
  address,
  onClose,
  onDirections,
}: CandyCardProps) {
  const cardTranslateY = useRef(
    new Animated.Value(0)
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dy) > 5 &&
          Math.abs(gestureState.dy) >
            Math.abs(gestureState.dx)
        );
      },

      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          cardTranslateY.setValue(gestureState.dy);
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(cardTranslateY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            cardTranslateY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(cardTranslateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.candyCard,
        {
          transform: [
            {
              translateY: cardTranslateY,
            },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Drag handle */}
      <View style={styles.dragHandle} />

      {/* Candy icon */}
      <View style={styles.candyIconContainer}>
        <MaterialCommunityIcons
          name="candy"
          size={34}
          color="magenta"
        />
      </View>

      {/* Candy information */}
      <View style={styles.candyInfo}>
        <Text style={styles.candyTitle}>
          Candy nearby
        </Text>

        <Text style={styles.candyAddress}>
          {address}
        </Text>

        <Text style={styles.candyCoordinates}>
          {candy.latitude.toFixed(5)},{' '}
          {candy.longitude.toFixed(5)}
        </Text>
      </View>

      {/* Close button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="close"
          size={22}
          color="#555"
        />
      </TouchableOpacity>

      {/* Directions button */}
      <TouchableOpacity
        style={styles.directionsButton}
        onPress={onDirections}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="navigation"
          size={21}
          color="white"
        />

        <Text style={styles.directionsText}>
          Directions
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  candyCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 110,
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,

    elevation: 8,
  },

  dragHandle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D0D0D0',
    marginBottom: 12,
  },

  candyIconContainer: {
    position: 'absolute',
    left: 16,
    top: 32,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fce4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  candyInfo: {
    marginLeft: 68,
    marginRight: 30,
    minHeight: 55,
  },

  candyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

  candyAddress: {
    fontSize: 14,
    color: '#444',
    marginBottom: 3,
  },

  candyCoordinates: {
    fontSize: 11,
    color: '#888',
  },

  closeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  directionsButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  directionsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});