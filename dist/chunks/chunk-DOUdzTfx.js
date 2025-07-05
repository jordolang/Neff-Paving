const BASE_URL = "/Neff-Paving/";
const DEPLOY_MODE = "github";
const BUILD_TIMESTAMP = "2025-07-05T13:28:14.000Z";
const DEPLOY_TIME = 1751722094e3;
const ASSET_CONFIG = {
  vercel: {
    useRelativePaths: false,
    assetPrefix: "",
    cdnEnabled: true,
    cacheStrategy: "aggressive"
  },
  github: {
    useRelativePaths: true,
    assetPrefix: "/Neff-Paving",
    cdnEnabled: false,
    cacheStrategy: "moderate"
  },
  development: {
    useRelativePaths: false,
    assetPrefix: "",
    cdnEnabled: false,
    cacheStrategy: "none"
  }
};
function getEnvironmentConfig() {
  return ASSET_CONFIG[DEPLOY_MODE] || ASSET_CONFIG.github;
}
function getAssetPath(assetPath, options = {}) {
  const config = getEnvironmentConfig();
  const {
    useRelative = config.useRelativePaths,
    addCacheBusting = true,
    forceAbsolute = false
  } = options;
  let resolvedPath = assetPath;
  if (assetPath.startsWith("http://") || assetPath.startsWith("https://")) {
    return assetPath;
  }
  const cleanPath = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
  if (forceAbsolute || DEPLOY_MODE === "vercel") {
    resolvedPath = "/" + cleanPath;
  } else if (useRelative && DEPLOY_MODE === "github") {
    const baseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
    resolvedPath = baseUrl + "/" + cleanPath;
  } else {
    resolvedPath = "/" + cleanPath;
  }
  if (addCacheBusting && config.cacheStrategy !== "none") {
    const separator = resolvedPath.includes("?") ? "&" : "?";
    const timestamp = config.cacheStrategy === "aggressive" ? DEPLOY_TIME : BUILD_TIMESTAMP;
    resolvedPath += `${separator}v=${timestamp}`;
  }
  return resolvedPath;
}
function preloadCriticalAssets(assets = []) {
  if (typeof document === "undefined") return;
  const defaultCriticalAssets = [
    { type: "style", href: "/assets/main.css", as: "style" },
    { type: "script", href: "/src/main.js", as: "script" },
    { type: "font", href: "https://fonts.gstatic.com/s/oswald/v49/TK3IWkUHHAIjg75cFRf3bXL8LICs1_Fw.woff2", as: "font", crossorigin: true },
    { type: "image", href: "/assets/images/logo.png", as: "image" }
  ];
  const allAssets = [...defaultCriticalAssets, ...assets];
  allAssets.forEach((asset) => {
    const existingLink = document.querySelector(`link[href="${asset.href}"]`);
    if (existingLink) return;
    const link = document.createElement("link");
    link.rel = asset.type === "font" ? "preload" : "prefetch";
    link.href = getAssetPath(asset.href, { addCacheBusting: false });
    link.as = asset.as;
    if (asset.crossorigin) {
      link.crossOrigin = "anonymous";
    }
    if (asset.type === "font") {
      link.type = "font/woff2";
    }
    document.head.appendChild(link);
  });
}
function updateAssetPaths() {
  if (typeof document === "undefined") return;
  const selectors = [
    'a[href^="/"]:not([href^="//"])',
    'img[src^="/"]:not([src^="//"])',
    'link[href^="/"]:not([href^="//"])',
    'script[src^="/"]:not([src^="//"])',
    'source[src^="/"]:not([src^="//"])',
    'video[src^="/"]:not([src^="//"])',
    'audio[src^="/"]:not([src^="//"])',
    '[style*="url(/"]'
  ];
  const elements = document.querySelectorAll(selectors.join(", "));
  elements.forEach((element) => {
    try {
      const tagName = element.tagName.toLowerCase();
      let attr, currentPath;
      if (tagName === "a" || tagName === "link") {
        attr = "href";
      } else if (["img", "script", "source", "video", "audio"].includes(tagName)) {
        attr = "src";
      } else if (element.hasAttribute("style")) {
        const style = element.getAttribute("style");
        const urlMatches = style.match(/url\(([^)]+)\)/g);
        if (urlMatches) {
          let updatedStyle = style;
          urlMatches.forEach((match) => {
            const url = match.replace(/url\(['"]?([^'"]+)['"]?\)/, "$1");
            if (url.startsWith("/") && !url.startsWith("//")) {
              const newUrl = getAssetPath(url);
              updatedStyle = updatedStyle.replace(match, `url(${newUrl})`);
            }
          });
          element.setAttribute("style", updatedStyle);
        }
        return;
      }
      if (attr) {
        currentPath = element.getAttribute(attr);
        if (currentPath && currentPath.startsWith("/") && !currentPath.startsWith("//") && !currentPath.startsWith(BASE_URL) && !currentPath.startsWith("http")) {
          const newPath = getAssetPath(currentPath, {
            addCacheBusting: !element.hasAttribute("data-no-cache-bust")
          });
          element.setAttribute(attr, newPath);
        }
      }
    } catch (error) {
      console.warn("Failed to update asset path for element:", element, error);
    }
  });
}
function initializeAssetOptimization() {
  if (typeof document === "undefined") return;
  preloadCriticalAssets();
  updateAssetPaths();
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = getAssetPath(img.dataset.src);
            img.removeAttribute("data-src");
            observer.unobserve(img);
          }
        }
      });
    });
    document.querySelectorAll("img[data-src]").forEach((img) => {
      imageObserver.observe(img);
    });
  }
}
if (typeof document !== "undefined" && document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeAssetOptimization);
} else if (typeof document !== "undefined") {
  initializeAssetOptimization();
}
export {
  getAssetPath as g,
  initializeAssetOptimization as i
};
//# sourceMappingURL=chunk-DOUdzTfx.js.map
