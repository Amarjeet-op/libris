import { Libre_Baskerville, Inter } from "next/font/google";
import { LibraryProvider } from "@/context/LibraryContext";
import "./globals.css";

const reading = Libre_Baskerville({
  variable: "--font-reading",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const ui = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Libris — Read it. Hear it. Live inside it.",
  description:
    "Libris turns your PDFs into a beautiful reading and listening experience — entirely on your device. No uploads, no accounts, no subscriptions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${reading.variable} ${ui.variable} font-sans antialiased`}>
        <LibraryProvider>{children}</LibraryProvider>
      </body>
    </html>
  );
}
