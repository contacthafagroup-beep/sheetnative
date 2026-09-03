import type { Metadata, Viewport } from "next";
import { AuthModal } from "@/components/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "SheetNative — AI Business Operating System",
  description:
    "Upload an Excel workbook. AI understands your business and generates a full application stack — web, mobile, desktop, PostgreSQL database, APIs, dashboards and AI employees.",
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
