import Link from 'next/link'
import { getAllNotes } from '@/lib/notes'

export default function Home() {
  const notes = getAllNotes()

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">Node.js Notes</h1>
          <p className="text-gray-400 mt-2">Конспекты по изучению Node.js</p>
        </div>
        <div className="space-y-3">
          {notes.map((note) => (
            <Link
              key={note.slug}
              href={`/notes/${note.slug}`}
              className="flex items-start gap-4 p-5 rounded-xl bg-gray-900 hover:bg-gray-800 transition-colors border border-gray-800 hover:border-gray-700"
            >
              {note.number && (
                <span className="text-xs font-mono text-gray-500 mt-1 min-w-[2rem] shrink-0">
                  {note.number}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-100 text-lg leading-snug">
                  {note.title}
                </h2>
                {note.preview && (
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                    {note.preview}
                  </p>
                )}
              </div>
              <span className="text-gray-600 text-lg shrink-0">→</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
