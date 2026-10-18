export type Candy = {
    id: string;
    user_id: string | null;
    latitude: number;
    longitude: number;
    expires_at: string;
    collected_at: string | null;
};

type CandyMarkerProps = {
    candy: Candy;
    onPress: (candy: Candy) => void;
    isSelected: boolean;
    isAnyCandySelected: boolean;
};

export type User = {
    id: string;
    username: string;
    candies: number;
};
