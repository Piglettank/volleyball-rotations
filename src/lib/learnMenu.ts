export type LearnCategory = 'serve' | 'spike' | 'set' | 'receive' | 'rotations'

export interface LearnMenuItem {
  category: LearnCategory
  label: string
  routeName: string
  imagePath: string | null
  fallbackIcon: string
}

export const learnMenuItems: LearnMenuItem[] = [
  {
    category: 'serve',
    label: 'Serve',
    routeName: 'learn-serve',
    imagePath: '/menu-serve.png',
    fallbackIcon: 'fas fa-circle-dot',
  },
  {
    category: 'spike',
    label: 'Spike',
    routeName: 'learn-spike',
    imagePath: '/menu-spike.png',
    fallbackIcon: 'fas fa-bolt',
  },
  {
    category: 'set',
    label: 'Set',
    routeName: 'learn-set',
    imagePath: '/menu-set.png',
    fallbackIcon: 'fas fa-hands',
  },
  {
    category: 'receive',
    label: 'Receive',
    routeName: 'learn-receive',
    imagePath: '/menu-receive.png',
    fallbackIcon: 'fas fa-hand-fist',
  },
  {
    category: 'rotations',
    label: 'Rotations',
    routeName: 'learn-rotations',
    imagePath: '/menu-rotations.png',
    fallbackIcon: 'fas fa-rotate',
  },
]
