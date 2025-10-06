import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Guess Player - Jeu de devinettes football',
  description: 'Devinez les joueurs de football en mode tour par tour',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}

