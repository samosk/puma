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
    distance: number | null;
    onClose: () => void;
    onDirections: () => void;
    onCollect: () => void;
    isCollecting: boolean;
};

export default function CandyInfoCard({
    candy,
    address,
    distance,
    onClose,
    onDirections,
    onCollect,
    isCollecting,
}: CandyCardProps) {
    const cardTranslateY = useRef(
        new Animated.Value(0)
    ).current;

    const canCollect =
        distance !== null &&
        distance <= 5 &&
        !isCollecting;

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

            {/* Close button */}
            <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons
                    name="close"
                    size={20}
                    color="#555"
                />
            </TouchableOpacity>

            {/* Candy icon */}
            <View style={styles.candyIconContainer}>
                <MaterialCommunityIcons
                    name="candy"
                    size={28}
                    color="magenta"
                />
            </View>

            {/* Candy information */}
            <View style={styles.candyInfo}>
                <Text style={styles.candyTitle}>
                    Candy nearby
                </Text>

                <Text
                    style={styles.candyAddress}
                    numberOfLines={1}
                >
                    {address}
                </Text>

                {distance !== null ? (
                    <Text style={styles.candyDistance}>
                        {distance < 10
                            ? `${distance.toFixed(1)} m away`
                            : `${Math.round(distance)} m away`}
                    </Text>
                ) : (
                    <Text style={styles.candyDistance}>
                        Finding distance...
                    </Text>
                )}
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
                {/* Collect */}
                <TouchableOpacity
                    style={[
                        styles.collectButton,
                        !canCollect &&
                            styles.collectButtonDisabled,
                    ]}
                    onPress={onCollect}
                    disabled={!canCollect}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons
                        name="candy"
                        size={19}
                        color={canCollect ? 'white' : '#999'}
                    />

                    <Text
                        style={[
                            styles.collectText,
                            !canCollect &&
                                styles.collectTextDisabled,
                        ]}
                    >
                        {isCollecting
                            ? 'Collecting...'
                            : distance !== null &&
                                distance <= 5
                            ? 'Collect'
                            : 'Too far'}
                    </Text>
                </TouchableOpacity>

                {/* Directions */}
                <TouchableOpacity
                    style={styles.directionsButton}
                    onPress={onDirections}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons
                        name="navigation"
                        size={19}
                        color="white"
                    />

                    <Text style={styles.directionsText}>
                        Directions
                    </Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    candyCard: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 160,
        backgroundColor: 'white',
        borderRadius: 18,
        padding: 12,

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
        width: 34,
        height: 4,
        borderRadius: 3,
        backgroundColor: '#D0D0D0',
        marginBottom: 7,
    },

    candyIconContainer: {
        position: 'absolute',
        left: 12,
        top: 27,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fce4f7',
        alignItems: 'center',
        justifyContent: 'center',
    },

    candyInfo: {
        marginLeft: 56,
        marginRight: 28,
        minHeight: 44,
    },

    candyTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 2,
    },

    candyAddress: {
        fontSize: 13,
        color: '#444',
        marginBottom: 2,
    },

    candyDistance: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555',
    },

    closeButton: {
        position: 'absolute',
        right: 7,
        top: 7,
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },

    buttonRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
    },

    collectButton: {
        flex: 1,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'magenta',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },

    collectButtonDisabled: {
        backgroundColor: '#E0E0E0',
    },

    collectText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },

    collectTextDisabled: {
        color: '#999',
    },

    directionsButton: {
        flex: 1,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },

    directionsText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
});