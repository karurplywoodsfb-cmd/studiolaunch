import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink:        '#0A0A0A',
        linen:      '#F5F0E8',
        gold:       '#C8A96E',
        'gold-dark':'#A8854A',
        surface:    '#141414',
        muted:      '#6B6B6B',
        rule:       '#2A2A2A',
        // MaSpace brand palette (marketing site + onboarding)
        ivory:      '#F7F5F0',
        stone:      '#D9D2C4',
        graphite:   '#1A1A1A',
        bronze:     '#B38B59',
        sage:       '#A8ADA1',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
