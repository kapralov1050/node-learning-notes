import fs from 'fs'
import path from 'path'

const notesDir = path.join(process.cwd(), 'notes')

function parseTitle(content) {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : 'Без названия'
}

function parsePreview(content) {
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (
      trimmed.length > 20 &&
      !trimmed.startsWith('#') &&
      !trimmed.startsWith('>') &&
      !trimmed.startsWith('---') &&
      !trimmed.startsWith('```') &&
      !trimmed.startsWith('!')
    ) {
      return trimmed.replace(/\*\*|__|\*|_|`/g, '').slice(0, 120)
    }
  }
  return ''
}

export function getAllNotes() {
  const files = fs.readdirSync(notesDir)
    .filter(f => f.endsWith('.md'))
    .sort()

  return files.map(filename => {
    const slug = filename.replace('.md', '')
    const content = fs.readFileSync(path.join(notesDir, filename), 'utf8')
    const firstPart = slug.split('-')[0]
    const number = /^\d+$/.test(firstPart) ? firstPart : null

    return {
      slug,
      number,
      title: parseTitle(content),
      preview: parsePreview(content),
    }
  })
}

export function getNoteBySlug(slug) {
  const filepath = path.join(notesDir, `${slug}.md`)
  try {
    const content = fs.readFileSync(filepath, 'utf8')
    return { slug, title: parseTitle(content), body: content }
  } catch {
    return null
  }
}
