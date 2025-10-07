import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-base-200">
      <div className="hero min-h-screen">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-6xl font-bold mb-4">
              Guess Player
            </h1>
            <p className="text-xl mb-8">
              Devinez les joueurs de football en mode tour par tour avec vos amis !
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/login" className="btn btn-primary btn-lg">
                Connexion
              </Link>
              <Link href="/register" className="btn btn-secondary btn-lg">
                Inscription
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

