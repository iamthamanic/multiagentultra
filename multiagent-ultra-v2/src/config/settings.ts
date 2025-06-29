export const settings = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || "MultiAgent Ultra",
  siteDescription:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "CrewAI-powered Multi-Agent System Dashboard",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
  apiBase: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8888/api/v1",
  landingPage: process.env.NEXT_PUBLIC_LANDING_PAGE || "/",
  authPage: process.env.NEXT_PUBLIC_AUTH_PAGE || "/auth/login",
  accountPage: process.env.NEXT_PUBLIC_ACCOUNT_PAGE || "/account",
  dashboardPage: process.env.NEXT_PUBLIC_DASHBOARD_PAGE || "/authorized",
  adminPage: process.env.NEXT_PUBLIC_ADMIN_PAGE || "/admin",
  nextAuthSecret: process.env.AUTH_SECRET || "default-next-auth-secret",
  auth: {
    demoAccount: {
      email: "test@gmail.com",
      password: "123456789",
      name: "Test User",
      role: "admin",
    },
  },
};
