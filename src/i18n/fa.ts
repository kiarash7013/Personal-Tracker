export const fa = {
  app: {
    name: "هم‌مسیر",
    description: "سامانه شفاف ارزیابی عملکرد دوره‌ای",
  },
  auth: {
    pageTitle: "ورود به هم‌مسیر",
    heading: "خوش آمدید",
    intro: "برای مشاهده دوره‌های ارزیابی، وارد حساب کاربری خود شوید.",
    emailLabel: "ایمیل سازمانی",
    emailPlaceholder: "name@example.com",
    passwordLabel: "رمز عبور",
    passwordPlaceholder: "رمز عبور خود را وارد کنید",
    submit: "ورود به سامانه",
    submitting: "در حال ورود…",
    invalidCredentials: "ایمیل یا رمز عبور صحیح نیست.",
    unavailable: "ورود موقتاً در دسترس نیست. کمی بعد دوباره تلاش کنید.",
    secureSession: "نشست امن ۸ ساعته",
  },
  home: {
    greeting: "سلام",
    phaseTitle: "احراز هویت و کنترل دسترسی فعال شد",
    phaseDescription:
      "از این مرحله، هر درخواست ابتدا هویت کاربر و سپس دسترسی او در همان دوره ارزیابی را بررسی می‌کند.",
    contextualRoleTitle: "نقش وابسته به دوره",
    contextualRoleDescription:
      "یک کاربر می‌تواند در یک دوره کارمند و در دوره‌ای دیگر مدیرِ فقط‌خواندنی باشد.",
    protectedDataTitle: "داده محافظت‌شده",
    protectedDataDescription:
      "Role داخل مرورگر قابل اعتماد نیست و برای عملیات حساس مستقیماً از پایگاه داده خوانده می‌شود.",
    nextTitle: "گام بعدی",
    nextDescription: "ساخت و راه‌اندازی دوره ارزیابی",
    signOut: "خروج",
  },
} as const;
