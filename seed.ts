import { db } from "./src/db";
import { users } from "./src/db/schema";
import { hash } from "bcryptjs";

async function seed() {
  console.log("Seeding database...");
  const password = await hash("admin123", 10);
  
  try {
    await db.insert(users).values({
      email: "banghasan@gmail.com",
      password: password,
      role: "admin",
      status: "active",
    });
    console.log("Admin user created: banghasan@gmail.com / admin123");
  } catch (e) {
    console.log("Admin user likely already exists or DB error:", e);
  }
  process.exit(0);
}

seed();
