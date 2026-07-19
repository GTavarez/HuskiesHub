// Single source of truth for role-gated navigation. `roles` is either
// "public" (no auth), "authenticated" (any logged-in user), or an array of
// specific roles allowed to see the link/route.
const routeConfig = [
  { path: "/", label: "Home", roles: "public" },
  { path: "/teams", label: "Teams", roles: "public" },
  { path: "/schedule", label: "Schedule", roles: "public" },
  { path: "/coaches", label: "Coaches", roles: "public", group: "more" },
  {
    path: "/collegecommits",
    label: "College Commits",
    roles: "public",
    group: "more",
  },
  { path: "/clinics", label: "Clinics", roles: "public", group: "more" },
  { path: "/contact", label: "Contact", roles: "public", group: "more" },
  {
    path: "/profile",
    label: "My Profile",
    roles: "authenticated",
    group: "profile",
  },
  {
    path: "/parent",
    label: "Parent Portal",
    roles: ["parent"],
    group: "profile",
  },
  {
    path: "/coach",
    label: "Coach Portal",
    roles: ["coach"],
    group: "profile",
  },
  {
    path: "/admin",
    label: "Admin Dashboard",
    roles: ["admin"],
    group: "profile",
  },
  {
    path: "/college-coach",
    label: "College Coach Portal",
    roles: ["college_coach"],
    group: "profile",
  },
];

export { routeConfig };
