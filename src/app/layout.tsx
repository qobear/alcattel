import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
// import { StackProvider, StackTheme } from "@stackframe/stack"
// import { stackServerApp } from '@/lib/stack'
import { Providers } from '@/components/providers'
import { PWAInstaller } from '@/components/pwa-installer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AllCattle Farm Management',
  description: 'AI-powered cattle farm management system with advanced analytics and predictions',
  keywords: ['cattle', 'farm', 'management', 'analytics', 'agriculture', 'livestock'],
  authors: [{ name: 'AllCattle Team' }],
  creator: 'AllCattle',
  publisher: 'AllCattle',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AllCattle',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'AllCattle',
    'application-name': 'AllCattle',
    'msapplication-TileColor': '#3b82f6',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#3b82f6',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <PWAInstaller />
          {/* Temporarily disabled Stack Auth for deployment */}
          {children}
        </Providers>
      </body>
    </html>
  )
}
