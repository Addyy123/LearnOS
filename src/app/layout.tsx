import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LearnOS",
  description: "Adaptive AI Learning Operating System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "LearnOS",
    statusBarStyle: "black-translucent"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Blocking script — runs before paint to prevent flash of wrong theme */}
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('learnos-theme');
                  var resolved = t === 'light' || t === 'dark' ? t
                    : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.setAttribute('data-theme', resolved);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
