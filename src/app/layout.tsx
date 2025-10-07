import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { GameProvider } from '@/contexts/GameContext'
import MainLayout from '@/components/layout/MainLayout'

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
      <body>
        <AuthProvider>
          <GameProvider>
            <MainLayout>
              {children}
            </MainLayout>
          </GameProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

