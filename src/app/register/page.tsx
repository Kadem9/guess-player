import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Guess Player</h1>
          <p className="text-base-content/70">Créez votre compte</p>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}
