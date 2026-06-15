import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StudioLaunch — Websites for Architects & Interior Designers',
  description: 'Launch a premium, SEO-optimised website for your architecture or interior design studio in minutes.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://studiolaunch.in'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0A0A0A] text-[#F5F0E8] antialiased" style={{fontFamily:"Inter,system-ui,sans-serif"}}>
        {children}
      </body>
    </html>
  )
}
