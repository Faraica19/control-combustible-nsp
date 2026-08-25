import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto mt-16 w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-nsp.png" alt="NSP Sun Power S.A." className="h-16 w-auto" />
        <h1 className="text-lg font-semibold text-zinc-900">
          Control de Combustible
        </h1>
      </div>
      <LoginForm />
    </div>
  );
}
