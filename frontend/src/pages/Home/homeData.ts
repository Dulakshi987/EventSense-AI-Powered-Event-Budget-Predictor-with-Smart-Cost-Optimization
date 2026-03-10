// ====== homeData ======
/**
 * Static demo data consumed by the Home page selection panel.
 * Defines the three entry-point modes available on initial load.
 */

export interface SelectionCard {
    id: string
    label: string
    description: string
    route: string
    iconKey: 'login' | 'register' | 'guest'
}

export const selectionCards: SelectionCard[] = [
    {
        id: 'login',
        label: 'Login',
        description: 'Access your Event Sense account and manage your events.',
        route: '/login',
        iconKey: 'login',
    },
    {
        id: 'register',
        label: 'Register',
        description: 'Create a new account and start building your events today.',
        route: '/register',
        iconKey: 'register',
    },
    {
        id: 'guest',
        label: 'Guest Mode',
        description: 'Explore Event Sense without an account. Limited access.',
        route: '/dashboard',
        iconKey: 'guest',
    },
]

export const homeBrandTagline: string = 'Craft moments that matter.'
