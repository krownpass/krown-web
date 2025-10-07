import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import localFont from "next/font/local";
const bebasNeue = localFont({
    src: "../../public/fonts/BebasNeue-Regular.ttf",
    display: "swap",
});
const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Krown",
    description: "Your passport to the best cafés",
    icons: {
        icon: "/krown.png",
        shortcut: "/krown.png",
        apple: "/krown.png",
    },
};
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${geistMono.variable}`}>
                {children}
            </body>
        </html>
    );
}
export { bebasNeue };
