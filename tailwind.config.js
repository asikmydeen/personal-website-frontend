/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
        playful: {
          'page-background': 'hsl(var(--playful-page-background))',
          'content-text-color': 'hsl(var(--playful-content-text-color))',
          'header-background': 'hsl(var(--playful-header-background))',
          'header-text-color': 'hsl(var(--playful-header-text-color))',
          'sider-background': 'hsl(var(--playful-sider-background))',
          'sider-text-color': 'hsl(var(--playful-sider-text-color))',
          'sider-logo-background': 'hsl(var(--playful-sider-logo-background))',
          'sider-logo-text-color': 'hsl(var(--playful-sider-logo-text-color))',
          'menu-item-hover-background': 'hsl(var(--playful-menu-item-hover-background))',
          'menu-item-hover-text-color': 'hsl(var(--playful-menu-item-hover-text-color))',
          'menu-item-selected-background': 'hsl(var(--playful-menu-item-selected-background))',
          'menu-item-selected-text-color': 'hsl(var(--playful-menu-item-selected-text-color))',
          'card-background': 'hsl(var(--playful-card-background))',
          'card-border-color': 'hsl(var(--playful-card-border-color))',
          'button-primary-background': 'hsl(var(--playful-button-primary-background))',
          'button-primary-text-color': 'hsl(var(--playful-button-primary-text-color))',
          'button-primary-hover-background': 'hsl(var(--playful-button-primary-hover-background))',
          'link-text-color': 'hsl(var(--playful-link-text-color))',
          'link-hover-text-color': 'hsl(var(--playful-link-hover-text-color))',
          'focus-ring-color': 'hsl(var(--playful-focus-ring-color))',
          'input-background': 'hsl(var(--playful-input-background))',
          'input-placeholder-color': 'hsl(var(--playful-input-placeholder-color))',
        }
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
