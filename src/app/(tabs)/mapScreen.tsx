import { Platform, ScrollView, View } from "react-native";
import TopBar from "../../components/ui/topBar";

const topPadding = Platform.OS === "ios" ? 50 : 60;



export default function mapScreen() {

	return (
		<View style={{ flex: 1 }}>
			<ScrollView style={{ paddingTop: topPadding }}>
				<TopBar />
				
			</ScrollView>

		</View>
	);

	


}
