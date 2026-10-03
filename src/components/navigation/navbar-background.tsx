import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export function NavbarBackground() {
  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      viewBox="0 0 390 120"
      preserveAspectRatio="none">
      <Path d="M0 38 Q195 10 390 38 V120 H0 Z" fill="#FFFFFF" />
    </Svg>
  );
}
