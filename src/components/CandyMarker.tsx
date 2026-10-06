/**
 * CandyMarker.tsx
 * Candy marker on the map
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Marker } from 'react-native-maps';

import type { Candy } from '../types/types';

type CandyMarkerProps = {
  candy: Candy;
  onPress: (candy: Candy) => void;
};

export default function CandyMarker({
  candy,
  onPress,
}: CandyMarkerProps) {
  return (
    <Marker
      coordinate={{
        latitude: candy.latitude,
        longitude: candy.longitude,
      }}
      onPress={() => onPress(candy)}
    >
      <MaterialCommunityIcons
        name="candy"
        size={50}
        color="magenta"
      />
    </Marker>
  );
}