import { createContext, useContext } from 'react';

// Lets the onboarding screen tell AuthGate (in src/app/_layout.tsx) that
// onboarding is done, so the protected routes switch over to the tabs.
type OnboardingContextValue = {
    markOnboardingCompleted: () => void;
};

export const OnboardingContext = createContext<OnboardingContextValue>({
    markOnboardingCompleted: () => {},
});

export function useOnboarding() {
    return useContext(OnboardingContext);
}
