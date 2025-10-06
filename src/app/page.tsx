export default function Home() {
  return (
    <main className="min-h-screen bg-base-200">
      <div className="hero min-h-screen">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-6xl font-bold mb-4">
              ⚽ Guess Player
            </h1>
            <p className="text-xl mb-8">
              Devinez les joueurs de football en mode tour par tour avec vos amis !
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <button className="btn btn-primary btn-lg">
                Connexion
              </button>
              <button className="btn btn-secondary btn-lg">
                Inscription
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">🎮 Multijoueur</h2>
                  <p>Jouez à plusieurs en temps réel</p>
                </div>
              </div>
              
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">Classement</h2>
                  <p>Suivez vos scores et performances</p>
                </div>
              </div>
              
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">Temps réel</h2>
                  <p>Parties synchronisées en direct</p>
                </div>
              </div>
              
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">Dark Mode</h2>
                  <p>Interface adaptée à vos préférences</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

