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
        <div className="min-h-screen bg-background">
          <nav className="border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <h1 className="text-xl font-bold">
                      Alma Creator Outreach
                    </h1>
                  </div>
                  <nav className="ml-10 flex space-x-8">
                    <a
                      href="/"
                      className="text-foreground hover:text-muted-foreground px-3 py-2 text-sm font-medium"
                    >
                      Dashboard
                    </a>
                    <a
                      href="/discovery"
                      className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium"
                    >
                      Discovery
                    </a>
                    <a
                      href="/creators"
                      className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium"
                    >
                      Creators
                    </a>
                    <a
                      href="/conversations"
                      className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium"
                    >
                      Conversations
                    </a>
                  </nav>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </nav>
          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}