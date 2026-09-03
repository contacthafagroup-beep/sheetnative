import type { Metadata, Viewport } from "next";
import { AuthModal } from "@/components/auth";
import "./globals.css";

const siteUrl = (value: string | undefined, fallback: string) =>
  value && value.trim() ? value.trim() : fallback;

export const metadata: Metadata = {
  metadataBase: new URL(
    siteUrl(process.env.NEXT_PUBLIC_SITE_URL, "https://sheetnative.vercel.app")
  ),
  title: "SheetNative — AI Business Operating System",
  description:
    "Upload an Excel workbook. AI understands your business and generates a full application stack — web, mobile, desktop, PostgreSQL database, APIs, dashboards and AI employees.",
  openGraph: {
    title: "SheetNative — AI Business Operating System",
    description:
      "Upload an Excel workbook. AI understands your business and generates a full application stack — web, mobile, desktop, PostgreSQL database, APIs, dashboards and AI employees.",
    url: "https://sheetnative.vercel.app",
    siteName: "SheetNative",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SheetNative — AI Business Operating System",
    description:
      "Upload an Excel workbook. AI understands your business and generates a full application stack.",
  },
};

export const viewport: Viewport = {
  themeColor: "#07090f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AuthModal />
      </body>
    </html>
  );
}
