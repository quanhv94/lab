import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import ActivityTracker from "@/components/ActivityTracker";
import ApiWakeGate from "@/components/ApiWakeGate";
import { AuthProvider } from "@/lib/auth";
import QueryProvider from "@/providers/QueryProvider";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quang Học Ảo",
  description: "Thí nghiệm quang học ảo tương tác cho học sinh",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${beVietnam.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <QueryProvider>
          <ApiWakeGate>
            <AuthProvider>
              <ActivityTracker />
              {children}
            </AuthProvider>
          </ApiWakeGate>
        </QueryProvider>
      </body>
    </html>
  );
}
