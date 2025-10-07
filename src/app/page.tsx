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
              Devinez les joueurs de football !
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <button className="btn btn-primary btn-lg">
                Connexion
              </button>
              <button className="btn btn-secondary btn-lg">
                Inscription
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

