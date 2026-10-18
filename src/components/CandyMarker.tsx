
/**
 * CandyMarker.tsx
 * Candy marker on the map
 */

import { Image, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

import type { Candy } from '../types/types';

type CandyMarkerProps = {
    candy: Candy;
    onPress: (candy: Candy) => void;
    selectedCandyId: string | null;
};

const CANDY_SPRITE = require('../../assets/images/candy.png');

export default function CandyMarker({
    candy,
    onPress,
    selectedCandyId,
}: CandyMarkerProps) {
    const isSelected = selectedCandyId === candy.id;
    const shouldDim = selectedCandyId !== null && !isSelected;

    return (
        <Marker
            coordinate={{
                latitude: candy.latitude,
                longitude: candy.longitude,
            }}
            onPress={() => onPress(candy)}
            tracksViewChanges={false}
        >
            <Image
                source={CANDY_SPRITE}
                style={[
                    styles.candyImage,
                    shouldDim && styles.candyImageDimmed,
                ]}
                resizeMode="contain"
            />
        </Marker>
    );
}

const styles = StyleSheet.create({
    candyImage: {
        width: 44,
        height: 44,
        opacity: 1,
    },
    candyImageDimmed: {
        opacity: 0.35,
    },
});
