import { Inter } from 'next/font/google'
import './globals.css'
import RootLayoutClient from '@/components/RootLayoutClient'
import { Metadata } from 'next'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MicroCart',
  description: 'Premium Microservices Ecommerce Platform',
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'en,ur,ar,fr,es',
                autoDisplay: false
              }, 'google_translate_element');
            }

            // Fix React DOM errors with Google Translate modifying text nodes
            if (typeof Node === 'function' && Node.prototype) {
              const originalRemoveChild = Node.prototype.removeChild;
              Node.prototype.removeChild = function(child) {
                if (child.parentNode !== this) {
                  if (console) console.warn('Cannot remove a child from a different parent', child, this);
                  return child;
                }
                return originalRemoveChild.apply(this, arguments);
              };
              
              const originalInsertBefore = Node.prototype.insertBefore;
              Node.prototype.insertBefore = function(newNode, referenceNode) {
                if (referenceNode && referenceNode.parentNode !== this) {
                  if (console) console.warn('Cannot insert before a reference node from a different parent', referenceNode, this);
                  return newNode;
                }
                return originalInsertBefore.apply(this, arguments);
              };
            }
          `}
        </Script>
        <Script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
        <style>{`
          iframe.goog-te-banner-frame { display: none !important; }
          iframe.skiptranslate { display: none !important; }
          .VIpgJd-ZVi9od-aZ2wEe-wOHMyf { display: none !important; }
          .VIpgJd-ZVi9od-ORHb-OEVmcd { display: none !important; }
          #goog-gt-tt { display: none !important; }
          body { top: 0px !important; position: static !important; }
          #google_translate_element { display: none !important; }
        `}</style>
      </head>
      <RootLayoutClient interClassName={inter.className}>
        <div id="google_translate_element" suppressHydrationWarning></div>
        {children}
      </RootLayoutClient>
    </html>
  )
}
