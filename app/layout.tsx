import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MyArchivio',
  description: 'Documenti e appuntamenti di famiglia',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
