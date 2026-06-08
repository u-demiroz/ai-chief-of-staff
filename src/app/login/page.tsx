import { login, signup } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string, error?: string }> }) {
  const { message, error } = await searchParams;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 text-zinc-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-zinc-900 p-8 shadow-2xl border border-zinc-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">AI Chief of Staff</h2>
          <p className="mt-2 text-sm text-zinc-400">Yönetim paneline giriş yapın veya kayıt olun.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-md text-sm ${error === 'true' ? 'bg-red-950/50 text-red-400 border border-red-900' : 'bg-green-950/50 text-green-400 border border-green-900'}`}>
            {message}
          </div>
        )}

        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                E-posta Adresi
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="ornek@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              formAction={login}
              className="group relative flex w-full justify-center rounded-md bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-100"
            >
              Giriş Yap
            </button>
            <button
              formAction={signup}
              className="group relative flex w-full justify-center rounded-md border border-zinc-700 bg-transparent px-3 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-700"
            >
              Kayıt Ol
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
