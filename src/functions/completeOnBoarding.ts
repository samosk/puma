import { supabase } from '@/lib/supabase';

type CompleteOnBoardingParams = {
    userId: string;
    animalName: string;
    speciesId: string;
};

export async function completeOnBoarding({
    userId,
    animalName,
    speciesId,
}: CompleteOnBoardingParams): Promise<void> {
    const name = animalName.trim();

    if (!name) {
        throw new Error('Please enter a name for your cat.');
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, candies, coins, onboarding_completed')
        .eq('id', userId)
        .single();

    if (profileError || !profile) {
        throw new Error('Could not load your profile. Please try again.');
    }

    if (profile.onboarding_completed) {
        return;
    }

    const { data: animal, error: animalError } = await supabase
        .from('animals')
        .insert({
            owner_id: userId,
            species_id: speciesId,
            name,
        })
        .select('id')
        .single();

    if (animalError || !animal) {
        throw new Error(
            animalError?.message ?? 'Could not create your cat.',
        );
    }

    const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
            active_animal_id: animal.id,
            candies: (profile.candies ?? 0) + 5,
            coins: (profile.coins ?? 0) + 100,
            onboarding_completed: true,
        })
        .eq('id', userId)
        .eq('onboarding_completed', false)
        .select('id')
        .maybeSingle();

    if (updateError || !updatedProfile) {
        throw new Error(
            updateError?.message ??
                'Onboarding could not be completed. Please try again.',
        );
    }
}