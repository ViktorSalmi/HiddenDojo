import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (typeof process.loadEnvFile === "function") {
  if (existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  } else if (existsSync(".env")) {
    process.loadEnvFile(".env");
  }
}

const args = new Map();

for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];

  if (key?.startsWith("--") && value) {
    args.set(key.slice(2), value);
  }
}

const email = args.get("email");
const password = args.get("password");
const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !password) {
  console.error("Usage: npm run create:coach -- --email coach@example.com --password your-password");
  process.exit(1);
}

if (!url || !serviceRoleKey) {
  console.error(
    "Missing Supabase environment variables in .env.local. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: listData, error: listError } = await supabase.auth.admin.listUsers();

if (listError) {
  console.error(`Could not list auth users: ${listError.message}`);
  process.exit(1);
}

const existingUser = listData.users.find(
  (user) => user.email?.toLowerCase() === email.toLowerCase(),
);

if (existingUser) {
  const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
    password,
    email_confirm: true,
    user_metadata: {
      role: "coach",
    },
  });

  if (error) {
    console.error(`Could not update coach user: ${error.message}`);
    process.exit(1);
  }

  console.log(`Updated coach user for ${email}.`);
  process.exit(0);
}

const { error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: {
    role: "coach",
  },
});

if (createError) {
  console.error(`Could not create coach user: ${createError.message}`);
  process.exit(1);
}

console.log(`Created coach user for ${email}.`);
