import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';


export type ChallengeType = 'steps' | 'candies';
export type ChallengeDuration = '24h' | '7d';

export type ChallengeChoice = {
	type: ChallengeType;
	goal: number;
	duration: ChallengeDuration;
};

const GOALS: Record<ChallengeType, number[]> = {
	steps: [1000, 5000, 10000],
	candies: [10, 50, 100],
};

const TYPE_LABELS: Record<ChallengeType, string> = {
	steps: 'Steps',
	candies: 'Candies',
};

const DURATION_LABELS: Record<ChallengeDuration, string> = {
	'24h': '24 Hours',
	'7d': '7 Days',
};

// Popup card
export default function ChallengeFriendPopup({
	visible,
	friendName,
	onClose,
	onConfirm,
}: {
	visible: boolean;
	friendName: string;
	onClose: () => void;
	onConfirm: (choice: ChallengeChoice) => void;
}) {
	const [step, setStep] = useState(0);
	const [type, setType] = useState<ChallengeType | null>(null);
	const [goal, setGoal] = useState<number | null>(null);
	const [duration, setDuration] = useState<ChallengeDuration | null>(null);

	useEffect(() => {
		if (visible) {
			setStep(0);
			setType(null);
			setGoal(null);
			setDuration(null);
		}
	}, [visible]);

	function chooseType(t: ChallengeType) {
		if (t !== type) setGoal(null);
		setType(t);
	}

	const canGoNext = (step === 0 && type !== null) || (step === 1 && goal !== null) || (step === 2 && duration !== null);

	function confirm() {
		if (type && goal !== null && duration) {
			onConfirm({ type, goal, duration });
		}
	}

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.backdrop}>
				<View style={styles.box}>
					{/* Header */}
					<View style={styles.header}>
						<Text style={styles.headerText}> You challenge: {friendName}</Text>
						<Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
							<Text style={styles.close}>✕</Text>
						</Pressable>
					</View>

					{/* Challenge type (steps or candies)*/}
					{step === 0 && (
						<>
							<Text style={styles.question}>Choose type</Text>
							<View style={styles.options}>
								{(Object.keys(GOALS) as ChallengeType[]).map((t) => (
									<Option key={t} label={TYPE_LABELS[t]} active={type === t} onPress={() => chooseType(t)} />
								))}
							</View>
						</>
					)}

					{/* Challenge amount */}
					{step === 1 && type && (
						<>
							<Text style={styles.question}>Choose amount</Text>
							<View style={styles.options}>
								{GOALS[type].map((g) => (
									<Option key={g} label={String(g)} active={goal === g} onPress={() => setGoal(g)} />
								))}
							</View>
						</>
					)}

					{/* Challenge duration */}
					{step === 2 && (
						<>
							<Text style={styles.question}>Choose duration</Text>
							<View style={styles.options}>
								{(Object.keys(DURATION_LABELS) as ChallengeDuration[]).map((d) => (
									<Option key={d} label={DURATION_LABELS[d]} active={duration === d} onPress={() => setDuration(d)} />
								))}
							</View>
						</>
					)}

					{/* Summary list */}
					{step === 3 && type && goal !== null && duration && (
						<View style={styles.summary}>
							<SummaryRow label="Type" value={TYPE_LABELS[type]} />
							<SummaryRow label="Goal" value={String(goal)} />
							<SummaryRow label="Duration" value={DURATION_LABELS[duration]} />
						</View>
					)}

					{/* Buttons */}
					{/*Back button*/}
					<View style={styles.buttons}>
						{step > 0 && (
							<Pressable style={[styles.button, styles.backButton]} onPress={() => setStep(step - 1)}>
								<Text style={styles.buttonText}>Back</Text>
							</Pressable>
						)}

						{/*Next/challenge buttons*/}
						{step < 3 ? (
							<Pressable
								style={[styles.button, styles.nextButton, !canGoNext && styles.disabled]}
								disabled={!canGoNext}
								onPress={() => setStep(step + 1)}
							>
								<Text style={styles.buttonText}>Next</Text>
							</Pressable>
						) : (
							<Pressable style={[styles.button, styles.nextButton]} onPress={confirm}>
								<Text style={styles.buttonText}>Challenge!</Text>
							</Pressable>
						)}
					</View>
				</View>
			</View>
		</Modal>
	);
}

// Selecteble option button
function Option({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
	return (
		<Pressable onPress={onPress} style={[styles.option, active && styles.optionActive]}>
			<Text style={styles.optionText}>{label}</Text>
		</Pressable>
	);
}

// Row in the summary
function SummaryRow({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.summaryRow}>
			<Text style={styles.summaryLabel}>{label}</Text>
			<Text style={styles.summaryValue}>{value}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		padding: 24,
	},
	box: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, gap: 16 },
	header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	headerText: { fontSize: 15, color: '#8A8A8A' },
	close: { fontSize: 22, color: '#8A8A8A' },
	question: { fontSize: 16, fontWeight: '600', textAlign: 'center', color: '#111111' },
	options: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 10 },
	option: {
		backgroundColor: '#EDEDED',
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderWidth: 2,
		borderColor: 'transparent',
	},
	optionActive: { borderColor: '#111111' },
	optionText: { fontSize: 15, color: '#111111' },
	summary: { gap: 10, paddingHorizontal: 12 },
	summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
	summaryLabel: { fontSize: 15, color: '#111111' },
	summaryValue: { fontSize: 15, fontWeight: '600', color: '#111111' },
	buttons: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
	button: { borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10 },
	backButton: { backgroundColor: '#E5161B' },
	nextButton: { backgroundColor: '#2FC81A' },
	disabled: { opacity: 0.4 },
	buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});



