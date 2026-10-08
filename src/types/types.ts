export type Candy = {
    id: string;
    user_id: string | null;
    latitude: number;
    longitude: number;
    expires_at: string;
    collected_at: string | null;
};

export type User = {
    id: string;
    username: string;
    candies: number;
};
