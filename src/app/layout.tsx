import "bootstrap/dist/css/bootstrap.rtl.min.css";
import "./styles.css";

export const metadata = {
  title: "سامانه ارزیابی عملکرد",
  description: "سامانه شفاف و داده‌محور بررسی عملکرد دوره‌ای",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <a className="skip-link" href="#main-content">
          رفتن به محتوای اصلی
        </a>
        {children}
      </body>
    </html>
  );
}
