import type { ComponentType } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { SvgProps } from "react-native-svg";

import { ShopIcon } from "./icons/shop-icon";
import { WardrobeIcon } from "./icons/wardrobe-icon";

export type HomeFloatingActionsProps = {
  onShopPress?: () => void;
  onWardrobePress?: () => void;
  style?: StyleProp<ViewStyle>;
};

type FloatingActionButtonProps = {
  accessibilityLabel: string;
  backgroundColor: string;
  borderColor: string;
  Icon: ComponentType<SvgProps>;
  iconHeight: number;
  iconWidth: number;
  onPress?: () => void;
};

export function HomeFloatingActions({
  onShopPress,
  onWardrobePress,
  style,
}: HomeFloatingActionsProps) {
  return (
    <View style={[styles.container, style]}>
      <FloatingActionButton
        accessibilityLabel="Open shop"
        backgroundColor="#FFAC1C"
        borderColor="#FFD28B"
        Icon={ShopIcon}
        iconHeight={29}
        iconWidth={30}
        onPress={onShopPress}
      />
      <FloatingActionButton
        accessibilityLabel="Open wardrobe"
        backgroundColor="#FF6500"
        borderColor="#FFB27D"
        Icon={WardrobeIcon}
        iconHeight={27}
        iconWidth={30}
        onPress={onWardrobePress}
      />
    </View>
  );
}

function FloatingActionButton({
  accessibilityLabel,
  backgroundColor,
  borderColor,
  Icon,
  iconHeight,
  iconWidth,
  onPress,
}: FloatingActionButtonProps) {
  const disabled = onPress === undefined;

  return (
    <Pressable
      accessibilityHint={disabled ? "Coming soon" : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor },
        pressed && styles.pressedButton,
      ]}
    >
      <Icon color="#FFFFFF" height={iconHeight} width={iconWidth} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 67,
    padding: 8,
    gap: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 34,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2.5 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 4,
  },
  button: {
    width: 51,
    height: 51,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.6,
    borderRadius: 25.5,
  },
  pressedButton: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
  },
});
