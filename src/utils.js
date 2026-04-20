export function createPageUrl(pageName) {
  const routes = {
    Home: "/",
    Login: "/login",
    Chat: "/chat",
    Consent: "/consent",
    Dating: "/dating",
    Goals: "/goals",
    InvitePartner: "/invite-partner",
    Memories: "/memories",
    NightIn: "/nightin",
    Notifications: "/notifications",
    Onboarding: "/onboarding",
    Places: "/places",
    Privacy: "/privacy",
    Refunds: "/refunds",
    RelationshipInsights: "/relationship-insights",
    Settings: "/settings",
    Terms: "/terms",
    VerifyStatus: "/verifystatus",
  };

  return routes[pageName] || "/";
}