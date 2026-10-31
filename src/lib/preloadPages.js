const pageLoaders = {
  home: () => import("../pages/Home"),
  dating: () => import("../pages/Dating"),
  chat: () => import("../pages/Chat"),
  memories: () => import("../pages/Memories"),
  goals: () => import("../pages/Goals"),
  nightIn: () => import("../pages/NightIn"),
};

const pendingLoads = new Map();

export function preloadPage(name) {
  const loader = pageLoaders[name];

  if (!loader) {
    return Promise.resolve();
  }

  if (!pendingLoads.has(name)) {
    const promise = loader().catch((error) => {
      pendingLoads.delete(name);
      console.warn(`Preload failed: ${name}`, error);
    });

    pendingLoads.set(name, promise);
  }

  return pendingLoads.get(name);
}

export async function preloadHome() {
  await preloadPage("home");
}

export function preloadOtherPages() {
  return Promise.all([
    preloadPage("dating"),
    preloadPage("chat"),
    preloadPage("memories"),
    preloadPage("goals"),
    preloadPage("nightIn"),
  ]);
}