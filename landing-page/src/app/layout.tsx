import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
})

const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
})

const jetbrains = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains',
})

export const metadata: Metadata = {
    title: 'Three Three - Rewolucyjna Aplikacja Mobilna do Analizy Osobistej',
    description: 'Three Three to rewolucyjna aplikacja mobilna łącząca nagrywanie snu, analizy AI i kompleksową korelację stylu życia. Przekształć swoje dane osobiste w inteligentne analizy.',
    keywords: ['three three', 'aplikacja mobilna', 'analiza snu', 'AI insights', 'monitoring stylu życia', 'aplikacja zdrowotna', 'korelacja danych', 'optymalizacja wydajności'],
    authors: [{ name: 'Three Three Team' }],
    metadataBase: new URL('https://three-three.app'),
    openGraph: {
        title: 'Three Three - Rewolucyjna Aplikacja Mobilna',
        description: 'Three Three to rewolucyjna aplikacja mobilna łącząca nagrywanie snu, analizy AI i kompleksową korelację stylu życia.',
        url: 'https://three-three.app',
        siteName: 'Three Three',
        locale: 'pl_PL',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Three Three - Rewolucyjna Aplikacja Mobilna',
        description: 'Three Three to rewolucyjna aplikacja mobilna łącząca nagrywanie snu, analizy AI i kompleksową korelację stylu życia.',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: 'your-google-verification-code',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark bg-violet-950">
            <body className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} font-sans antialiased`}>
                <div className="relative min-h-screen">
                    {children}
                </div>
            </body>
        </html>
    )
}