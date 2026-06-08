'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, CalendarDays, LogOut } from 'lucide-react'
import { logout } from '@/app/login/actions'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projeler', href: '/projects', icon: FolderKanban },
  { name: 'Takvim', href: '/calendar', icon: CalendarDays },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-950 px-4 py-6">
      <div className="flex items-center gap-2 px-2 pb-6">
        <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center">
          <span className="text-zinc-950 font-bold">AI</span>
        </div>
        <span className="text-lg font-semibold tracking-tight">Chief of Staff</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-zinc-50'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-50'
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="pt-6 border-t border-zinc-800">
        <form action={logout}>
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-50 transition-colors">
            <LogOut className="h-5 w-5 flex-shrink-0" />
            Çıkış Yap
          </button>
        </form>
      </div>
    </div>
  )
}
