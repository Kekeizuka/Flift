import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RepLog — lift. log. repeat.",
  description: "A fast, offline, single-user strength-training log. All data stays on your device.",
  applicationName: "RepLog",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "RepLog", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

/**
 * Applies the persisted theme/accent before first paint to avoid a flash.
 * Mirrors `ACCENTS` in lib/training.ts and the settings store key.
 */
const themeBootstrap = `
(function(){try{
  var raw=localStorage.getItem('replog-settings');
  var st=raw?JSON.parse(raw).state:null;
  var theme=(st&&st.theme)||'dark';
  var resolved=theme==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):theme;
  var el=document.documentElement;
  el.setAttribute('data-theme',resolved);
  el.setAttribute('data-animations',(st&&st.animationsEnabled===false)?'off':'on');
  var A={crimson:['#f23557','#c01c8e'],ember:['#ff6a3d','#f23557'],violet:['#8b5cf6','#d946ef'],ocean:['#3b82f6','#06b6d4'],forest:['#22c55e','#10b981'],gold:['#f59e0b','#ef4444']};
  var a=A[(st&&st.accentColor)||'crimson']||A.crimson;
  el.style.setProperty('--color-crimson',a[0]);
  el.style.setProperty('--color-magenta',a[1]);
}catch(e){}})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
