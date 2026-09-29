//Import från ett annat projekt för struktur och design.

import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import {
	Dimensions,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

const { width } = Dimensions.get("window");

type Props = {
	title?: string;
	showBack?: boolean;
};

// The top bar component for navigation back on step (back-arrow) for the map tab
export default function TopBar({
	title,
	showBack = true,
}: Props) {
	return (
		<View style={styles.box}>
			{showBack ? (
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<Ionicons
						name="arrow-back"
						size={24}
						color="#3E5F90"
					/>
				</TouchableOpacity>
			) : (
				<View style={styles.sideSpacer} />
			)}

			<Text
				numberOfLines={1}
				style={styles.title}
			>
				{title}
			</Text>

			<View style={styles.sideSpacer} />
		</View>
	);
}

const styles = StyleSheet.create({
	box: {
		width: width,
		height: 55,
		backgroundColor: "#F2F2F2",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#E3E3E3",
	},
	backButton: {
		width: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	sideSpacer: {
		width: 24,
	},
	title: {
		flex: 1,
		textAlign: "center",
		fontSize: 16,
		fontFamily: "NunitoSans_700Bold",
		color: "#3E5F90",
		paddingHorizontal: 12,
	},
});