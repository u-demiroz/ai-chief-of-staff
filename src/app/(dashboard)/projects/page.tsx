import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase.from('projects').select('*').order('updated_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Projeler</h1>
        <Link href="/projects/new" className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors">
          Yeni Proje Ekle
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects && projects.length > 0 ? (
          projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="group flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:bg-zinc-800 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-zinc-100 group-hover:text-white">{project.title}</h3>
                  <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
                    {project.stage || 'Belirsiz'}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 line-clamp-3 mb-4">{project.description}</p>
              </div>
              
              <div className="flex items-center justify-between text-xs text-zinc-500 pt-4 border-t border-zinc-800/50">
                <span>Skor: {project.priority_score}</span>
                <span>{project.category}</span>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-zinc-500">Hiç proje bulunamadı.</p>
        )}
      </div>
    </div>
  )
}
