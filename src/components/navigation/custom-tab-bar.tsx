import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimalsIcon } from './icons/animals-icon';
import { FriendsIcon } from './icons/friends-icon';
import { HomeIcon } from './icons/home-icon';
import { MapIcon } from './icons/map-icon';
import { NavbarBackground } from './navbar-background';

type TabsProps = ComponentProps<typeof Tabs>;
type CustomTabBarProps = Parameters<NonNullable<TabsProps['tabBar']>>[0];

const TAB_CONFIG = {
  friendScreen: {
    label: 'Friends',
    color: '#16C91A',
    Icon: FriendsIcon,
    circleSize: 64,
    iconSize: 37,
    offsetTop: 8,
  },
  index: {
    label: 'Home',
    color: '#F20BC5',
    Icon: HomeIcon,
    circleSize: 72,
    iconSize: 42,
    offsetTop: 0,
  },
  mapScreen: {
    label: 'Map',
    color: '#FF1717',
    Icon: MapIcon,
    circleSize: 72,
    iconSize: 42,
    offsetTop: 0,
  },
  animalScreen: {
    label: 'Animals',
    color: '#459DE2',
    Icon: AnimalsIcon,
    circleSize: 64,
    iconSize: 37,
    offsetTop: 8,
  },
} as const;

export const CUSTOM_TAB_BAR_HEIGHT = 112;

export function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { height: CUSTOM_TAB_BAR_HEIGHT + insets.bottom }]}>
      <NavbarBackground />

      <View style={[styles.tabRow, { paddingBottom: insets.bottom }]}>
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG[route.name as keyof typeof TAB_CONFIG];

          if (!config) {
            return null;
          }

          const isFocused = state.index === index;
          const { Icon } = config;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={
                descriptors[route.key].options.tabBarAccessibilityLabel ?? config.label
              }
              accessibilityState={isFocused ? { selected: true } : {}}
              hitSlop={8}
              onLongPress={onLongPress}
              onPress={onPress}
              style={styles.tabButton}>
              {({ pressed }) => (
                <>
                  <View
                    style={[
                      styles.circle,
                      {
                        width: config.circleSize,
                        height: config.circleSize,
                        marginTop: config.offsetTop,
                        borderRadius: config.circleSize / 2,
                        backgroundColor: config.color,
                      },
                      isFocused && styles.focusedCircle,
                    ]}>
                    {pressed && <View pointerEvents="none" style={styles.pressedOverlay} />}
                    <Icon width={config.iconSize} height={config.iconSize} />
                  </View>

                  <Text style={[styles.label, isFocused && styles.focusedLabel]}>
                    {config.label}
                  </Text>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  tabRow: {
    zIndex: 1,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  tabButton: {
    flex: 1,
    minHeight: 90,
    alignItems: 'center',
  },
  circle: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  pressedOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    opacity: 0.2,
  },
  focusedCircle: {
    transform: [{ translateY: -7 }, { scale: 1.05 }],
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  label: {
    marginTop: 6,
    color: '#4A4A4A',
    fontSize: 15,
    fontWeight: '500',
  },
  focusedLabel: {
    color: '#202020',
    fontWeight: '700',
  },
});
