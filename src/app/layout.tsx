import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Alma Creator Outreach',
  description: 'Automated creator discovery and outreach platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <h1 className="text-xl font-bold text-gray-900">
                      Alma Creator Outreach
                    </h1>
                  </div>
                  <nav className="ml-10 flex space-x-8">
                    <a
                      href="/"
                      className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                    >
                      Dashboard
                    </a>
                    <a
                      href="/discovery"
                      className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                    >
                      Discovery
                    </a>
                    <a
                      href="/creators"
                      className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                    >
                      Creators
                    </a>
                    <a
                      href="/conversations"
                      className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                    >
                      Conversations
                    </a>
                  </nav>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}