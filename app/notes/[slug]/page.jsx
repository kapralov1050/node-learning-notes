import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllNotes, getNoteBySlug } from '@/lib/notes'
import MarkdownRenderer from '@/components/MarkdownRenderer'

export function generateStaticParams() {
  return getAllNotes().map((note) => ({ slug: note.slug }))
}

export function generateMetadata({ params }) {
  const note = getNoteBySlug(params.slug)
  if (!note) return {}
  return { title: `${note.title} — Node.js Notes` }
}

export default function NotePage({ params }) {
  const note = getNoteBySlug(params.slug)
  if (!note) notFound()

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 mb-8 transition-colors"
        >
          ← Все заметки
        </Link>
        <article className="prose prose-invert prose-gray max-w-none
          prose-headings:text-white
          prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-6
          prose-h2:text-xl prose-h2:font-semibold prose-h2:border-b prose-h2:border-gray-800 prose-h2:pb-2 prose-h2:mt-10
          prose-h3:text-lg prose-h3:font-semibold
          prose-p:text-gray-300 prose-p:leading-relaxed
          prose-li:text-gray-300
          prose-strong:text-white
          prose-code:text-blue-300 prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800 prose-pre:rounded-xl prose-pre:overflow-x-auto
          prose-blockquote:border-blue-500 prose-blockquote:text-gray-400 prose-blockquote:bg-gray-900 prose-blockquote:rounded-r-lg prose-blockquote:py-1
          prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
          prose-hr:border-gray-800
          prose-table:text-sm prose-th:text-gray-300 prose-td:text-gray-400
        ">
          <MarkdownRenderer content={note.body} />
        </article>
      </div>
    </main>
  )
}
