import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/system/AppShell";
import "@fontsource/barlow-semi-condensed/600.css";
import "@fontsource/barlow-semi-condensed/700.css";
import "@fontsource/barlow-semi-condensed/800.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/fira-code/400.css";
import "@fontsource/fira-code/500.css";
import "@fontsource/fira-code/600.css";
import "@/styles/globals.css";

/**
 * Metadata for the Vane application.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Vane | Physics verified industrial carbon proofs",
    template: "%s | Vane",
  },
  description:
    "Vane cross-checks facility smart meters against live satellite weather, quarantines spoofed power on Ethereum Sepolia and proves EU CBAM compliance in the browser without exposing supplier pricing.",
  applicationName: "Vane",
  keywords: [
    "EU CBAM",
    "zero knowledge",
    "Noir",
    "UltraHonk",
    "Ethereum Sepolia",
    "smart meter",
    "PINN",
    "carbon accounting",
  ],
  openGraph: {
    title: "Vane | Physics verified industrial carbon proofs",
    description:
      "Verify embedded carbon by physics, not trust. Live satellite meter checks with zero-knowledge CBAM proofs on Ethereum Sepolia.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vane | Physics verified industrial carbon proofs",
    description:
      "Verify embedded carbon by physics, not trust. Live satellite meter checks with zero-knowledge CBAM proofs on Ethereum Sepolia.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Viewport configuration shared by every route.
 */
export const viewport: Viewport = {
  themeColor: "#0a0b0d",
  width: "device-width",
  initialScale: 1,
};

/**
 * Root layout for the Vane application.
 *
 * @param props Layout props.
 * @returns The document shell.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
