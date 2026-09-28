import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { demoIdentities, isDemoEnabled, type DemoIdentity } from "@/lib/demo";
import { DevUI } from "@/app/components/dev-ui";
import { StorefrontFooter } from "@/app/components/storefront-footer";
import { StorefrontHeader } from "@/app/components/storefront-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CHAUK | Goods at the crossroads",
    template: "%s | CHAUK",
  },
  description:
    "A contemporary Nepal marketplace for useful, expressive goods from local makers and around the world.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();
  let activeIdentity: DemoIdentity | null = null;
  if (isDemoEnabled()) {
    const session = await auth.api.getSession({ headers: await headers() });
    activeIdentity = (Object.entries(demoIdentities) as [DemoIdentity, (typeof demoIdentities)[DemoIdentity]][])
      .find(([, identity]) => identity.email === session?.user.email)?.[0] ?? null;
  }

  return (
    <html lang="en" data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} min-h-full antialiased`}
      >
        <StorefrontHeader />
        <div className="site-content">{children}</div>
        <StorefrontFooter />
        {isDemoEnabled() && <DevUI activeIdentity={activeIdentity} />}
        <Script id="chauk-theme" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("chauk-theme");var d=t||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",d)}catch(e){}})()`}
        </Script>
      </body>
    </html>
  );
}
