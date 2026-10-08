/**
 * CenterMapButton.tsx
 * Button to center the user on the map
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

type CenterMapButtonProps = {
    onPress: () => void;
    bottom?: number;
};

export default function CenterMapButton({
    onPress,
    bottom = 130,
}: CenterMapButtonProps) {
    return (
        <TouchableOpacity
            style={[styles.locationButton, { bottom }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <MaterialCommunityIcons
                name="crosshairs-gps"
                size={25}
                color="#222"
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    locationButton: {
        position: 'absolute',
        right: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,

        elevation: 5,
    },
});