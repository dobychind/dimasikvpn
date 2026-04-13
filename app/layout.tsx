import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DimasikVPN — Быстрый и безопасный VPN',
  description: 'VPN на базе VLESS + Reality. Не определяется DPI, работает там, где другие не могут.',
  openGraph: {
    title: 'DimasikVPN — Интернет без границ',
    description: 'Быстрый VPN на базе VLESS + Reality. Настройка за 2 минуты.',
    type: 'website',
    url: 'https://dimasikvpn.ru',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Onest:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
