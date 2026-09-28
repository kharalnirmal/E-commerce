export const demoIdentities = {
  nirmal: {
    name: "Nirmal Kharal",
    email: "nirmal@demo.chauk.local",
    role: "ADMIN",
    description: "Administrator",
    destination: "/admin",
  },
  suraj: {
    name: "Suraj Shrestha",
    email: "suraj@demo.chauk.local",
    role: "USER",
    description: "Active shopper",
    destination: "/",
  },
  aadarsh: {
    name: "Aadarsh Rai",
    email: "aadarsh@demo.chauk.local",
    role: "USER",
    description: "New shopper",
    destination: "/",
  },
} as const;

export type DemoIdentity = keyof typeof demoIdentities;

export function isDemoEnabled(value = process.env.DEMO_MODE) {
  return value === "true";
}

export function isDemoIdentity(value: unknown): value is DemoIdentity {
  return typeof value === "string" && value in demoIdentities;
}

export function isResetConfirmation(value: unknown) {
  return value === "RESET";
}

export function canResetDemo(userEmail: string | null | undefined) {
  return userEmail === demoIdentities.nirmal.email;
}

export function getDemoPassword() {
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("DEMO_PASSWORD must contain at least eight characters.");
  }
  return password;
}
