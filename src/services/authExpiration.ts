let onTokenExpired: (() => void) | null = null;

export const registerTokenExpiredHandler = (
  handler: () => void
) => {
  onTokenExpired = handler;
};

export const redirectToLogin = () => {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  // Get the current route, including query parameters and hash.
  let returnTo =
    window.location.pathname +
    window.location.search +
    window.location.hash;

  // Remove the application base path because React Router
  // automatically handles it through basename.
  if (basePath && returnTo.startsWith(`${basePath}/`)) {
    returnTo = returnTo.substring(basePath.length);
  } else if (basePath && returnTo === basePath) {
    returnTo = "/";
  }

  const loginUrl = `${import.meta.env.BASE_URL}login?redirect=${encodeURIComponent(returnTo)}`;

  window.location.assign(loginUrl);
};

export const handleTokenExpired = () => {
  if (onTokenExpired) {
    onTokenExpired();
  } else {
    // Fallback if AuthProvider has not registered yet
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    redirectToLogin();
  }
};