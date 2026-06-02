import './globals.css'

export const metadata = {
  title: 'Node.js Notes',
  description: 'Конспекты по изучению Node.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  )
}
