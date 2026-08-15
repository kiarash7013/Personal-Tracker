import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const defaultPractices = [
  { name: "تحلیل", description: "تحلیل مسئله، نیاز و محدودیت‌های راه‌حل" },
  { name: "User Flow", description: "طراحی و اعتبارسنجی جریان کاربر" },
  { name: "تکمیل تسک", description: "تحویل خروجی نهایی مورد انتظار تسک" },
  { name: "مستندسازی", description: "ثبت تصمیم‌ها، خروجی‌ها و زمینه اجرایی" },
  { name: "Prototype", description: "ساخت نمونه تعاملی برای بررسی راه‌حل" },
] as const;

async function main() {
  const employee = await prisma.user.upsert({
    where: { email: "employee@example.test" },
    update: { name: "کارمند نمونه", active: true },
    create: {
      email: "employee@example.test",
      name: "کارمند نمونه",
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@example.test" },
    update: { name: "مدیر نمونه", active: true },
    create: {
      email: "manager@example.test",
      name: "مدیر نمونه",
    },
  });

  for (const practice of defaultPractices) {
    await prisma.workPractice.upsert({
      where: {
        ownerId_name: {
          ownerId: employee.id,
          name: practice.name,
        },
      },
      update: {
        description: practice.description,
        active: true,
        archivedAt: null,
      },
      create: {
        ownerId: employee.id,
        ...practice,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
