import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

const vercelOrigins = [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL]
  .filter((hostname): hostname is string => Boolean(hostname))
  .map((hostname) => `https://${hostname}`);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: vercelOrigins,
  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      role: {
        type: ["USER", "ADMIN"],
        required: false,
        defaultValue: "USER",
        input: false,
      },
    },
  },
});
