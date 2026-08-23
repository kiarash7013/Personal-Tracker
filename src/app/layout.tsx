import localFont from "next/font/local";
import "bootstrap/dist/css/bootstrap.rtl.min.css";
import "./styles.css";

const iranSansX = localFont({
  src: [
    { path: "./fonts/IRANSansX-Thin.woff2", weight: "100", style: "normal" },
    { path: "./fonts/IRANSansX-UltraLight.woff2", weight: "200", style: "normal" },
    { path: "./fonts/IRANSansX-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/IRANSansX-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IRANSansX-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/IRANSansX-DemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/IRANSansX-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/IRANSansX-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "./fonts/IRANSansX-Black.woff2", weight: "900", style: "normal" },
  ],
  display: "swap",
  variable: "--font-iran-sans-x",
});

export const metadata = {
  title: "سامانه ارزیابی عملکرد",
  description: "سامانه شفاف و داده‌محور بررسی عملکرد دوره‌ای",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={iranSansX.variable}>
        <a className="skip-link" href="#main-content">
          رفتن به محتوای اصلی
        </a>
        {children}
      </body>
    </html>
  );
}
