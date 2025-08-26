import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// import { StackProvider, StackTheme } from "@stackframe/stack"
// import { stackServerApp } from '@/lib/stack'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AllCattle Farm - Livestock Management System',
  description: 'Comprehensive livestock monitoring and management platform for modern farms',
  keywords: ['livestock', 'farm management', 'cattle', 'animal tracking'],
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
          {/* Temporarily disabled Stack Auth for deployment */}
          {children}
        </Providers>
      </body>
    </html>
  )
}
