import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Guess Player</h1>
          <p className="text-base-content/70">Créez votre compte</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
