import Link from "next/link";

import { logoutAction } from "@/app/(auth)/actions";
import { requireSessionActor } from "@/server/dal/session";

// Session reads are request-bound; this private segment intentionally blocks.
export const instant = false;

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireSessionActor();
  const displayName = actor.name || actor.email;

  return (
    <div className="min-h-screen bg-stone-50 text-slate-950 lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-slate-200 bg-slate-950 p-5 text-white lg:flex lg:flex-col">
        <Link href="/app" className="px-3 text-xl font-bold">StudyHub</Link>
        <nav className="mt-10 space-y-2" aria-label="Navegação principal">
          <Link href="/app" aria-current="page" className="flex rounded-xl bg-white/10 px-3 py-3 font-medium">Visão geral</Link>
        </nav>
        <p className="mt-auto px-3 text-xs leading-5 text-slate-400">Novos recursos serão liberados por etapas, sem comprometer seus dados.</p>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <Link href="/app" className="font-bold lg:hidden">StudyHub</Link>
              <span className="hidden text-sm text-slate-500 sm:inline">Seu espaço de estudos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block"><p className="max-w-48 truncate text-sm font-semibold">{displayName}</p><p className="max-w-48 truncate text-xs text-slate-500">{actor.email}</p></div>
              <form action={logoutAction}><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Sair</button></form>
            </div>
          </div>
          <nav className="flex border-t border-slate-100 px-5 py-2 lg:hidden" aria-label="Navegação móvel"><Link href="/app" aria-current="page" className="rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">Visão geral</Link></nav>
        </header>
        <main className="px-5 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
