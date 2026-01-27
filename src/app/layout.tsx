import type { Metadata } from "next";
import "./globals.css";
import { DiagnosisProvider } from "@/state/DiagnosisProvider";
import { Inter, Press_Start_2P, DotGothic16 } from "next/font/google";
import SfxGlobal from "@/components/SfxGlobal";


const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const pixelEn = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--font-pixel-en" });
const pixelJa = DotGothic16({
  weight: "400",
  subsets: ["latin"], // ← "japanese" は使わない
  variable: "--font-pixel-ja",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Astraia Diagnosis",
  description: "A bright classic fantasy diagnosis"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${pixelEn.variable} ${pixelJa.variable}`}>
      <body className="rpg-scan">
        <DiagnosisProvider>{children}</DiagnosisProvider>
      </body>
      <SfxGlobal />
    </html>
  );
}
