import type { Metadata } from 'next'
import { Sora, DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const sora = Sora({
  variable: '--font-heading',
  subsets: ['latin'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'fabricXai — Investor Portal',
  description: 'AI-powered investor intelligence platform for fabricXai',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {children}
      </body>
    </html>
  )
}
