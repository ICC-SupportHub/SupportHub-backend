import './globals.css'
import { Inter } from 'next/font/google'
import { AppShell } from '@/components/app-shell'
import { AuthProvider } from '@/contexts/AuthContext'
import { DataSyncProvider } from '@/components/DataSyncProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'SupportHub',
  description: '마음을 나누는 AI 감정공감 대화 플랫폼',
  icons: {
    icon: '/placeholder-logo.png',
    apple: '/placeholder-logo.png',
  },
  openGraph: {
    type: 'website',
    title: 'SupportHub',
    siteName: 'SupportHub',
    description: '마음을 나누는 AI 감정공감 대화 플랫폼',
    images: ['/placeholder-logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SupportHub',
    description: '마음을 나누는 AI 감정공감 대화 플랫폼',
    images: ['/placeholder-logo.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider>
          <DataSyncProvider>
            <AppShell>{children}</AppShell>
          </DataSyncProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
