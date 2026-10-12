import { Image } from "expo-image";
import { Link, type Href } from "expo-router";
import type { ComponentType } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SvgProps } from "react-native-svg";

import { ChallengesIcon } from "./icons/challenges-icon";
import { SettingsIcon } from "./icons/settings-icon";
import { StatsIcon } from "./icons/stats-icon";

const CANDY_IMAGE = require("../../../assets/images/candy.png");
const COIN_IMAGE = require("../../../assets/images/coin.png");

export type HomeTopBarProps = {
  candies: number | null;
  coins: number | null;
  loading?: boolean;
};

type BalanceBoxProps = {
  imageSource: number;
  value: number | null;
  accessibilityLabel: string;
  loading: boolean;
};

type NavigationButtonProps = {
  href: Href;
  Icon: ComponentType<SvgProps>;
  accessibilityLabel: string;
};

export function HomeTopBar({
  candies,
  coins,
  loading = false,
}: HomeTopBarProps) {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.balanceGroup}>
        <BalanceBox
          imageSource={CANDY_IMAGE}
          value={candies}
          accessibilityLabel="Candies"
          loading={loading}
        />
        <BalanceBox
          imageSource={COIN_IMAGE}
          value={coins}
          accessibilityLabel="Coins"
          loading={loading}
        />
      </View>

      <View style={styles.navigationGroup}>
        <NavigationButton
          href="/statScreen"
          Icon={StatsIcon}
          accessibilityLabel="Open stats"
        />
        <NavigationButton
          href="/challengeScreen"
          Icon={ChallengesIcon}
          accessibilityLabel="Open challenges"
        />
        <NavigationButton
          href="/settingsScreen"
          Icon={SettingsIcon}
          accessibilityLabel="Open settings"
        />
      </View>
    </SafeAreaView>
  );
}

function BalanceBox({
  imageSource,
  value,
  accessibilityLabel,
  loading,
}: BalanceBoxProps) {
  const displayedValue = value === null ? "—" : value.toLocaleString();
  const spokenValue =
    value === null ? (loading ? "loading" : "unavailable") : displayedValue;

  return (
    <View
      accessible
      accessibilityLabel={`${accessibilityLabel}: ${spokenValue}`}
      accessibilityRole="text"
      style={styles.balanceBox}
    >
      <Image
        source={imageSource}
        contentFit="contain"
        style={styles.balanceImage}
      />
      <Text numberOfLines={1} style={styles.balanceValue}>
        {displayedValue}
      </Text>
    </View>
  );
}

function NavigationButton({
  href,
  Icon,
  accessibilityLabel,
}: NavigationButtonProps) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        hitSlop={4}
        style={({ pressed }) => [
          styles.navigationButton,
          pressed && styles.pressedButton,
        ]}
      >
        <Icon width={31} height={31} color="#494949" />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 16123,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 4,
  },
  balanceGroup: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  balanceBox: {
    minWidth: 0,
    height: 46,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 7,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#C9C9C9",
    borderRadius: 23,
  },
  balanceImage: {
    width: 32,
    height: 32,
    flexShrink: 0,
  },
  balanceValue: {
    minWidth: 0,
    flexShrink: 1,
    color: "#111111",
    fontSize: 19,
    fontWeight: "700",
  },
  navigationGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  navigationButton: {
    width: 42,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  pressedButton: {
    backgroundColor: "#EAEAEA",
    opacity: 0.75,
  },
});
