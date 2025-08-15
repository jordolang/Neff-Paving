/* empty css                       */
import { r as requireAos, g as getDefaultExportFromCjs } from "../chunks/chunk-BzX1X3XA.js";
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
var aosExports = requireAos();
const AOS = /* @__PURE__ */ getDefaultExportFromCjs(aosExports);
class Lightbox {
  constructor() {
    this.currentIndex = 0;
    this.images = [];
    this.isOpen = false;
    this.init();
  }
  init() {
    this.createLightbox();
    this.bindEvents();
  }
  createLightbox() {
    const lightboxHTML = `
            <div id="lightbox" class="lightbox" aria-hidden="true" role="dialog" aria-labelledby="lightbox-title" aria-describedby="lightbox-description">
                <div class="lightbox-overlay"></div>
                <div class="lightbox-content">
                    <div class="lightbox-header">
                        <h2 id="lightbox-title" class="lightbox-title"></h2>
                        <button class="lightbox-close" aria-label="Close lightbox" title="Close">&times;</button>
                    </div>
                    <div class="lightbox-main">
                        <button class="lightbox-nav lightbox-prev" aria-label="Previous image" title="Previous">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                            </svg>
                        </button>
                        <div class="lightbox-image-container">
                            <img class="lightbox-image" src="" alt="" loading="lazy">
                        </div>
                        <button class="lightbox-nav lightbox-next" aria-label="Next image" title="Next">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="lightbox-footer">
                        <p id="lightbox-description" class="lightbox-description"></p>
                        <div class="lightbox-counter">
                            <span class="current-index">1</span> / <span class="total-images">1</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("beforeend", lightboxHTML);
    this.lightboxElement = document.getElementById("lightbox");
    this.lightboxImage = this.lightboxElement.querySelector(".lightbox-image");
    this.lightboxTitle = this.lightboxElement.querySelector(".lightbox-title");
    this.lightboxDescription = this.lightboxElement.querySelector(".lightbox-description");
    this.currentIndexElement = this.lightboxElement.querySelector(".current-index");
    this.totalImagesElement = this.lightboxElement.querySelector(".total-images");
  }
  bindEvents() {
    this.lightboxElement.querySelector(".lightbox-close").addEventListener("click", () => {
      this.close();
    });
    this.lightboxElement.querySelector(".lightbox-prev").addEventListener("click", () => {
      this.prev();
    });
    this.lightboxElement.querySelector(".lightbox-next").addEventListener("click", () => {
      this.next();
    });
    this.lightboxElement.querySelector(".lightbox-overlay").addEventListener("click", () => {
      this.close();
    });
    document.addEventListener("keydown", (e) => {
      if (!this.isOpen) return;
      switch (e.key) {
        case "Escape":
          this.close();
          break;
        case "ArrowLeft":
          this.prev();
          break;
        case "ArrowRight":
          this.next();
          break;
      }
    });
    this.lightboxImage.addEventListener("load", () => {
    });
    this.lightboxImage.addEventListener("error", () => {
      this.lightboxImage.alt = "Image failed to load";
    });
  }
  open(images, index = 0) {
    this.images = images;
    this.currentIndex = index;
    this.isOpen = true;
    this.totalImagesElement.textContent = this.images.length;
    this.lightboxElement.classList.add("active");
    this.lightboxElement.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    this.loadImage();
    this.lightboxElement.querySelector(".lightbox-close").focus();
  }
  close() {
    this.isOpen = false;
    this.lightboxElement.classList.remove("active");
    this.lightboxElement.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    setTimeout(() => {
      this.lightboxImage.src = "";
    }, 300);
  }
  prev() {
    if (this.images.length <= 1) return;
    this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.images.length - 1;
    this.loadImage();
  }
  next() {
    if (this.images.length <= 1) return;
    this.currentIndex = this.currentIndex < this.images.length - 1 ? this.currentIndex + 1 : 0;
    this.loadImage();
  }
  loadImage() {
    const imageData = this.images[this.currentIndex];
    this.lightboxTitle.textContent = imageData.title || "";
    this.lightboxDescription.textContent = imageData.category || "";
    this.currentIndexElement.textContent = this.currentIndex + 1;
    this.lightboxImage.src = imageData.src;
    this.lightboxImage.alt = imageData.alt || imageData.title || "";
    const prevBtn = this.lightboxElement.querySelector(".lightbox-prev");
    const nextBtn = this.lightboxElement.querySelector(".lightbox-next");
    if (this.images.length <= 1) {
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
    } else {
      prevBtn.style.display = "flex";
      nextBtn.style.display = "flex";
    }
  }
}
const galleryImages = {
  commercial: [
    { filename: "advance-auto-parking-lot-2.webp", title: "Advance Auto Parking Lot 2", alt: "Commercial parking lot paving for Advance Auto Parts" },
    { filename: "advance-auto-parking-lot-3.webp", title: "Advance Auto Parking Lot 3", alt: "Commercial parking lot paving for Advance Auto Parts" },
    { filename: "advance-auto-parking-lot.webp", title: "Advance Auto Parking Lot", alt: "Commercial parking lot paving for Advance Auto Parts" },
    { filename: "amg.webp", title: "AMG Commercial Project", alt: "Commercial paving project for AMG facility" },
    { filename: "apartment-complex-2.webp", title: "Apartment Complex 2", alt: "Apartment complex parking lot paving project" },
    { filename: "apartment-complex-3.webp", title: "Apartment Complex 3", alt: "Apartment complex parking lot paving project" },
    { filename: "apartment-complex-4.webp", title: "Apartment Complex 4", alt: "Apartment complex parking lot paving project" },
    { filename: "apartment-complex.webp", title: "Apartment Complex", alt: "Apartment complex parking lot paving project" },
    { filename: "apartments-garages-parking-lot-2.webp", title: "Apartments Garages Parking Lot 2", alt: "Parking lot paving for apartments with garages" },
    { filename: "apartments-garages-parking-lot-3-leeboy.webp", title: "Apartments Garages Parking Lot with Leeboy", alt: "Apartment parking lot paving with Leeboy equipment" },
    { filename: "apartments-garages-parking-lot.webp", title: "Apartments Garages Parking Lot", alt: "Parking lot paving for apartments with garages" },
    { filename: "asphalt-around-garage.webp", title: "Asphalt Around Garage", alt: "Asphalt paving work around commercial garage" },
    { filename: "before-after-riesebecks.webp", title: "Before After Riesbecks", alt: "Before and after comparison of Riesbecks parking lot" },
    { filename: "before-apartment-wreck.webp", title: "Before Apartment Reconstruction", alt: "Apartment parking lot before reconstruction work" },
    { filename: "behind-overhang-parking-lot.webp", title: "Behind Overhang Parking Lot", alt: "Parking lot paving behind building overhang" },
    { filename: "church-parking-lot-2.webp", title: "Church Parking Lot 2", alt: "Church parking lot paving project" },
    { filename: "church-parking-lot.webp", title: "Church Parking Lot", alt: "Church parking lot paving project" },
    { filename: "cinemark-colony-square.webp", title: "Cinemark Colony Square", alt: "Parking lot paving for Cinemark Colony Square theater" },
    { filename: "commercial-parking-lot-apartments-church.webp", title: "Commercial Parking Lot Apartments Church", alt: "Combined commercial parking lot for apartments and church" },
    { filename: "downtown-st-james-2.webp", title: "Downtown St James 2", alt: "Downtown St. James street paving project" },
    { filename: "downtown-st-james-stripped.webp", title: "Downtown St James Stripped", alt: "Downtown St. James with fresh line striping" },
    { filename: "downtown-st-james.webp", title: "Downtown St James", alt: "Downtown St. James street paving project" },
    { filename: "east-pike-shopping-center.webp", title: "East Pike Shopping Center", alt: "East Pike Shopping Center parking lot paving" },
    { filename: "five-below-2.webp", title: "Five Below 2", alt: "Five Below store parking lot paving project" },
    { filename: "five-below.webp", title: "Five Below", alt: "Five Below store parking lot paving project" },
    { filename: "florist.webp", title: "Florist", alt: "Florist shop parking lot paving project" },
    { filename: "formal-affairs.webp", title: "Formal Affairs", alt: "Formal Affairs business parking lot paving" },
    { filename: "garage-apartments-parking-lot.webp", title: "Garage Apartments Parking Lot", alt: "Parking lot for apartment garages" },
    { filename: "hamilton-waltman-melsheimer-2.webp", title: "Hamilton Waltman Melsheimer 2", alt: "Hamilton Waltman Melsheimer commercial paving project" },
    { filename: "hamilton-waltman-melsheimer-3.webp", title: "Hamilton Waltman Melsheimer 3", alt: "Hamilton Waltman Melsheimer commercial paving project" },
    { filename: "hamilton-waltman-melsheimer-4.webp", title: "Hamilton Waltman Melsheimer 4", alt: "Hamilton Waltman Melsheimer commercial paving project" },
    { filename: "hamilton-waltman-melsheimer-5.webp", title: "Hamilton Waltman Melsheimer 5", alt: "Hamilton Waltman Melsheimer commercial paving project" },
    { filename: "hamilton-waltman-melsheimer.webp", title: "Hamilton Waltman Melsheimer", alt: "Hamilton Waltman Melsheimer commercial paving project" },
    { filename: "holiday-inn-express-2.webp", title: "Holiday Inn Express 2", alt: "Holiday Inn Express parking lot paving project" },
    { filename: "holiday-inn-express.webp", title: "Holiday Inn Express", alt: "Holiday Inn Express parking lot paving project" },
    { filename: "large-open-parking-lot.webp", title: "Large Open Parking Lot", alt: "Large open commercial parking lot paving" },
    { filename: "leeboy-colony-square-mall.webp", title: "Leeboy Colony Square Mall", alt: "Colony Square Mall paving with Leeboy equipment" },
    { filename: "leeboy-condos.webp", title: "Leeboy Condos", alt: "Condominium parking lot paving with Leeboy equipment" },
    { filename: "leeboy-overhang.webp", title: "Leeboy Overhang", alt: "Paving work under overhang with Leeboy equipment" },
    { filename: "leeboy-riesbecks.webp", title: "Leeboy Riesbecks", alt: "Riesbecks parking lot paving with Leeboy equipment" },
    { filename: "leeboy-trailer-park.webp", title: "Leeboy Trailer Park", alt: "Trailer park paving with Leeboy equipment" },
    { filename: "lined-parking-lot.webp", title: "Lined Parking Lot", alt: "Commercial parking lot with fresh line striping" },
    { filename: "military-apartments-parking-lot.webp", title: "Military Apartments Parking Lot", alt: "Military apartments parking lot paving project" },
    { filename: "open-parking-area-behind-apartments.webp", title: "Open Parking Area Behind Apartments", alt: "Open parking area behind apartment complex" },
    { filename: "open-parking-lot-2.webp", title: "Open Parking Lot 2", alt: "Open commercial parking lot paving project" },
    { filename: "open-parking-lot-3.webp", title: "Open Parking Lot 3", alt: "Open commercial parking lot paving project" },
    { filename: "open-parking-lot-4.webp", title: "Open Parking Lot 4", alt: "Open commercial parking lot paving project" },
    { filename: "open-parking-lot.webp", title: "Open Parking Lot", alt: "Open commercial parking lot paving project" },
    { filename: "parking-lot-paved-wooded-area.webp", title: "Parking Lot Paved Wooded Area", alt: "Parking lot paving in wooded area" },
    { filename: "parking-lot.webp", title: "Parking Lot", alt: "Commercial parking lot paving project" },
    { filename: "paved-strip-mall.webp", title: "Paved Strip Mall", alt: "Strip mall parking lot paving project" },
    { filename: "paver-parking-lot.webp", title: "Paver Parking Lot", alt: "Commercial parking lot with paver work" },
    { filename: "private-road-apartments.webp", title: "Private Road Apartments", alt: "Private road paving for apartment complex" },
    { filename: "reisbecks-parking-lot-5.webp", title: "Riesbecks Parking Lot 5", alt: "Riesbecks store parking lot paving project" },
    { filename: "reisebecks-parking-lot-2.webp", title: "Riesbecks Parking Lot 2", alt: "Riesbecks store parking lot paving project" },
    { filename: "reisebecks-parking-lot-3.webp", title: "Riesbecks Parking Lot 3", alt: "Riesbecks store parking lot paving project" },
    { filename: "reisebecks-parking-lot-4.webp", title: "Riesbecks Parking Lot 4", alt: "Riesbecks store parking lot paving project" },
    { filename: "reisebecks-parking-lot.webp", title: "Riesbecks Parking Lot", alt: "Riesbecks store parking lot paving project" },
    { filename: "roller-dump-workers-working.webp", title: "Roller Dump Workers Working", alt: "Workers operating roller and dump equipment" },
    { filename: "roller-open-parking-lot.webp", title: "Roller Open Parking Lot", alt: "Open parking lot paving with roller equipment" },
    { filename: "roller-parking-lot.webp", title: "Roller Parking Lot", alt: "Parking lot paving with roller equipment" },
    { filename: "rolller-private-road.webp", title: "Roller Private Road", alt: "Private road paving with roller equipment" },
    { filename: "roseville-drive-thru-parking-lot-2.webp", title: "Roseville Drive Thru Parking Lot 2", alt: "Roseville drive-thru parking lot paving" },
    { filename: "roseville-drive-thru-parking-lot-e.webp", title: "Roseville Drive Thru Parking Lot E", alt: "Roseville drive-thru parking lot paving" },
    { filename: "roseville-drive-thru-parking-lot.webp", title: "Roseville Drive Thru Parking Lot", alt: "Roseville drive-thru parking lot paving" },
    { filename: "school-0-ring.webp", title: "School O Ring", alt: "School property paving with circular design" },
    { filename: "school-entryway.webp", title: "School Entryway", alt: "School entryway paving project" },
    { filename: "steamy-parking-lot.webp", title: "Steamy Parking Lot", alt: "Parking lot with steam from fresh asphalt" },
    { filename: "the-barn-after.webp", title: "The Barn After", alt: "The Barn parking lot after paving completion" },
    { filename: "the-barn-before.webp", title: "The Barn Before", alt: "The Barn parking lot before paving work" },
    { filename: "the-barn-parking-lot.webp", title: "The Barn Parking Lot", alt: "The Barn parking lot paving project" },
    { filename: "wilsons.webp", title: "Wilsons", alt: "Wilsons business parking lot paving project" },
    { filename: "workers-not-working-more.webp", title: "Workers Not Working More", alt: "Construction workers taking a break" },
    { filename: "workers-not-working.webp", title: "Workers Not Working", alt: "Construction workers taking a break" },
    { filename: "workers-working-overhang.webp", title: "Workers Working Overhang", alt: "Workers paving under building overhang" }
  ],
  residential: [
    { filename: "asphalt-driveway-barn.webp", title: "Asphalt Driveway Barn", alt: "Residential driveway leading to barn" },
    { filename: "asphalt-driveway-turnaround-2.webp", title: "Asphalt Driveway Turnaround 2", alt: "Residential driveway with turnaround area" },
    { filename: "asphalt-driveway-turnaround.webp", title: "Asphalt Driveway Turnaround", alt: "Residential driveway with turnaround area" },
    { filename: "austins-truck-college.webp", title: "Austins Truck College", alt: "Driveway for Austins Truck College" },
    { filename: "bungalow-driveway.webp", title: "Bungalow Driveway", alt: "Charming bungalow house driveway" },
    { filename: "cart-path-to-landing.webp", title: "Cart Path To Landing", alt: "Cart path leading to landing area" },
    { filename: "clearing-driveway.webp", title: "Clearing Driveway", alt: "Driveway through cleared wooded area" },
    { filename: "custom-mansion-driveway-2.webp", title: "Custom Mansion Driveway 2", alt: "Luxury mansion custom driveway design" },
    { filename: "custom-mansion-driveway-3.webp", title: "Custom Mansion Driveway 3", alt: "Luxury mansion custom driveway design" },
    { filename: "custom-mansion-driveway-4.webp", title: "Custom Mansion Driveway 4", alt: "Luxury mansion custom driveway design" },
    { filename: "custom-mansion-driveway.webp", title: "Custom Mansion Driveway", alt: "Luxury mansion custom driveway design" },
    { filename: "driveway-garage-door.webp", title: "Driveway Garage Door", alt: "Residential driveway leading to garage" },
    { filename: "driveway-turnaround-area-2.webp", title: "Driveway Turnaround Area 2", alt: "Residential driveway turnaround area" },
    { filename: "driveway-turnaround-area.webp", title: "Driveway Turnaround Area", alt: "Residential driveway turnaround area" },
    { filename: "flagpole-driveway-country-2.webp", title: "Flagpole Driveway Country 2", alt: "Country driveway with flagpole" },
    { filename: "flagpole-driveway-country.webp", title: "Flagpole Driveway Country", alt: "Country driveway with flagpole" },
    { filename: "long-driveway-bridge.webp", title: "Long Driveway Bridge", alt: "Long residential driveway with bridge" },
    { filename: "long-driveway-to-road.webp", title: "Long Driveway To Road", alt: "Long residential driveway connecting to road" },
    { filename: "open-basketball-court.webp", title: "Open Basketball Court", alt: "Residential basketball court paving" },
    { filename: "pond-asphalt-driveway.webp", title: "Pond Asphalt Driveway", alt: "Asphalt driveway near pond" },
    { filename: "roller-residential-driveway.webp", title: "Roller Residential Driveway", alt: "Residential driveway with roller equipment" },
    { filename: "stone-lined-paved-driveway-2.webp", title: "Stone Lined Paved Driveway 2", alt: "Paved driveway with decorative stone lining" },
    { filename: "stone-lined-paved-driveway.webp", title: "Stone Lined Paved Driveway", alt: "Paved driveway with decorative stone lining" }
  ],
  equipment: [
    { filename: "leeboy-closeup.webp", title: "Leeboy Closeup", alt: "Close-up view of Leeboy paving equipment" },
    { filename: "leeboy-dropping-tar.webp", title: "Leeboy Dropping Tar", alt: "Leeboy equipment applying tar/asphalt" },
    { filename: "leeboy-top-down.webp", title: "Leeboy Top Down", alt: "Top-down view of Leeboy paving equipment" },
    { filename: "loading-leeboy-2.webp", title: "Loading Leeboy 2", alt: "Loading Leeboy paving equipment" },
    { filename: "loading-leeboy.webp", title: "Loading Leeboy", alt: "Loading Leeboy paving equipment" }
  ],
  concrete: [
    { filename: "concrete-pad.webp", title: "Concrete Pad", alt: "Concrete pad installation project" },
    { filename: "convenience-store.webp", title: "Convenience Store", alt: "Concrete work at convenience store" },
    { filename: "manhole-cover.webp", title: "Manhole Cover", alt: "Concrete manhole cover installation" },
    { filename: "square-drain-cover.webp", title: "Square Drain Cover", alt: "Square concrete drain cover installation" }
  ]
};
var define_process_env_default = {};
function detectVercelEnvironment() {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname.endsWith(".vercel.app")) return true;
    if (hostname.includes("vercel.app")) return true;
    const vercelScript = document.querySelector('script[src*="vercel-scripts.com"]');
    if (vercelScript) return true;
  }
  if (typeof process !== "undefined" && define_process_env_default) {
    if (define_process_env_default.VERCEL || define_process_env_default.VERCEL_ENV || define_process_env_default.VERCEL_URL) return true;
    if (define_process_env_default.VITE_PLATFORM === "vercel" || define_process_env_default.DEPLOY_PLATFORM === "vercel") return true;
  }
  return false;
}
function detectGitHubPagesEnvironment() {
  return true;
}
const IS_VERCEL_DETECTED = detectVercelEnvironment();
const IS_GITHUB_PAGES_DETECTED = detectGitHubPagesEnvironment();
const BASE_URL = /* @__PURE__ */ (() => {
  return "/Neff-Paving/";
})();
const DEPLOY_MODE = /* @__PURE__ */ (() => {
  return "github";
})();
const BUILD_TIMESTAMP = "2025-08-15T08:42:09.150Z";
const DEPLOY_TIME = 1755247329150;
const IS_VERCEL = IS_VERCEL_DETECTED;
const IS_GITHUB_PAGES = IS_GITHUB_PAGES_DETECTED;
const shouldDebug = typeof window !== "undefined" && window.location.search.includes("debug=assets");
if (shouldDebug) {
  console.group("🛠️ Build-time Variables Check");
  console.log("BASE_URL:", BASE_URL);
  console.log("DEPLOY_MODE:", DEPLOY_MODE);
  console.log("IS_VERCEL:", IS_VERCEL);
  console.log("IS_GITHUB_PAGES:", IS_GITHUB_PAGES);
  console.log("BUILD_TIMESTAMP:", BUILD_TIMESTAMP);
  console.log("DEPLOY_TIME:", DEPLOY_TIME);
  console.groupEnd();
}
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
  const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const hasGitHubBasePath = typeof window !== "undefined" && window.location.pathname.startsWith("/Neff-Paving/");
  if (isLocalhost && hasGitHubBasePath) {
    return ASSET_CONFIG.github;
  }
  return ASSET_CONFIG[DEPLOY_MODE] || ASSET_CONFIG.github;
}
function getAssetPath(assetPath, options = {}) {
  var _a;
  const isDebug = typeof window !== "undefined" && window.location.search.includes("debug=assets") || typeof window !== "undefined" && ((_a = window.localStorage) == null ? void 0 : _a.getItem("debug-assets")) === "true";
  if (isDebug) {
    console.group("🔧 getAssetPath Debug Info");
    console.log("📥 Input:", { assetPath, options });
    console.log("🌍 Environment:", { DEPLOY_MODE, BASE_URL, IS_VERCEL, IS_GITHUB_PAGES });
    console.log("⚙️ Build Variables:", {
      __BASE_URL__: "/Neff-Paving/",
      __DEPLOY_MODE__: "github",
      __IS_VERCEL__: false,
      __IS_GITHUB_PAGES__: true
    });
  }
  const config = getEnvironmentConfig();
  if (isDebug) {
    console.log("🔧 Config:", config);
    console.log("🏠 Window location:", typeof window !== "undefined" ? {
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      href: window.location.href
    } : "Not in browser");
  }
  const {
    useRelative = config.useRelativePaths,
    addCacheBusting = true,
    forceAbsolute = false
  } = options;
  let resolvedPath = assetPath;
  if (assetPath.startsWith("http://") || assetPath.startsWith("https://")) {
    if (isDebug) {
      console.log("↩️  External URL detected, returning as-is:", assetPath);
      console.groupEnd();
    }
    return assetPath;
  }
  const cleanPath = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
  if (isDebug) console.log("🧹 Clean path (no leading slash):", cleanPath);
  if (forceAbsolute || DEPLOY_MODE === "vercel" || IS_VERCEL) {
    resolvedPath = "/" + cleanPath;
    if (isDebug) console.log("🔵 Vercel absolute path logic applied:", resolvedPath);
  } else if (useRelative && (DEPLOY_MODE === "github" || IS_GITHUB_PAGES)) {
    const baseUrl = BASE_URL === "/" ? "" : BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
    resolvedPath = baseUrl + "/" + cleanPath;
    if (isDebug) {
      console.log("🟣 GitHub Pages relative path logic applied");
      console.log("  - Base URL processed:", baseUrl);
      console.log("  - Combined path:", resolvedPath);
    }
  } else {
    resolvedPath = "/" + cleanPath;
    if (isDebug) console.log("⚪ Default absolute path logic applied:", resolvedPath);
  }
  const beforeSlashFix = resolvedPath;
  resolvedPath = resolvedPath.replace(/([^:])\/{2,}/g, "$1/");
  if (isDebug && beforeSlashFix !== resolvedPath) {
    console.log("🔧 Fixed double slashes:");
    console.log("  - Before:", beforeSlashFix);
    console.log("  - After:", resolvedPath);
  }
  if (addCacheBusting && config.cacheStrategy !== "none") {
    const separator = resolvedPath.includes("?") ? "&" : "?";
    const timestamp = config.cacheStrategy === "aggressive" ? DEPLOY_TIME : BUILD_TIMESTAMP;
    const beforeCacheBusting = resolvedPath;
    resolvedPath += `${separator}v=${timestamp}`;
    if (isDebug) {
      console.log("⏰ Cache busting applied:");
      console.log("  - Strategy:", config.cacheStrategy);
      console.log("  - Timestamp:", timestamp);
      console.log("  - Before:", beforeCacheBusting);
      console.log("  - After:", resolvedPath);
    }
  } else if (isDebug) {
    console.log("⏰ Cache busting skipped:", {
      addCacheBusting,
      cacheStrategy: config.cacheStrategy
    });
  }
  if (isDebug) {
    console.log("✅ Final resolved path:", resolvedPath);
    const hasDoubleSlash = resolvedPath.includes("//") && !resolvedPath.startsWith("http");
    const hasIncorrectBase = resolvedPath.includes("/Neff-Paving//") || resolvedPath.includes("//Neff-Paving/");
    if (hasDoubleSlash || hasIncorrectBase) {
      console.warn("⚠️  Potential path issues detected:");
      if (hasDoubleSlash) console.warn("  - Contains double slashes");
      if (hasIncorrectBase) console.warn("  - Incorrect base URL format");
    }
    console.groupEnd();
  }
  return resolvedPath;
}
function preloadCriticalAssets(assets = []) {
  if (typeof document === "undefined") return;
  const defaultCriticalAssets = [
    { type: "style", href: "assets/main.css", as: "style" },
    { type: "script", href: "src/main.js", as: "script" },
    { type: "font", href: "https://fonts.gstatic.com/s/oswald/v49/TK3IWkUHHAIjg75cFRf3bXL8LICs1_Fw.woff2", as: "font", crossorigin: true },
    { type: "image", href: "assets/images/logo.png", as: "image" }
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
  getEnvironmentConfig();
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
class GalleryFilter {
  constructor(galleryElement) {
    this.galleryElement = galleryElement;
    this.galleryContainer = galleryElement.querySelector(".gallery");
    this.filterButtons = document.querySelectorAll(".button-group .button");
    this.galleryItems = [];
    this.lightbox = new Lightbox();
    this.allImagesData = [];
    this.displayedImages = {};
    this.currentFilter = "all";
    this.init();
  }
  init() {
    this.loadGalleryImages();
    this.initFilters();
    this.initLightbox();
    if (this.filterButtons.length > 0) {
      this.filterButtons[0].classList.add("cs-active");
    }
  }
  loadGalleryImages() {
    this.galleryContainer.innerHTML = "";
    this.galleryItems = [];
    this.allImagesData = [];
    this.displayedImages = {};
    Object.entries(galleryImages).forEach(([category, images]) => {
      images.forEach((image) => {
        this.allImagesData.push({ ...image, category });
      });
    });
    const categories = Object.keys(galleryImages);
    categories.forEach((category) => {
      const categoryImages = galleryImages[category].map((img) => ({ ...img, category }));
      const shuffled = this.shuffleArray([...categoryImages]);
      this.displayedImages[category] = shuffled.slice(0, 8);
    });
    const allShuffled = this.shuffleArray([...this.allImagesData]);
    this.displayedImages["all"] = allShuffled.slice(0, 8);
    Object.entries(this.displayedImages).forEach(([category, images]) => {
      images.forEach((image) => {
        const galleryCard = this.createGalleryCard(image, image.category, category);
        this.galleryContainer.appendChild(galleryCard);
        this.galleryItems.push(galleryCard);
      });
    });
    this.filterItems("all");
  }
  // Fisher-Yates shuffle algorithm for truly random selection
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  createGalleryCard(image, category, displayCategory) {
    const card = document.createElement("div");
    card.className = "gallery-card";
    card.setAttribute("data-category", category);
    card.setAttribute("data-display-category", displayCategory);
    const resolvedPath = getAssetPath(`/assets/gallery/${category}/${image.filename}`, { addCacheBusting: true });
    card.innerHTML = `
            <div class="card-image">
                <div class="image-loading-placeholder">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem; color: #999;">📷</div>
                    <div style="font-size: 0.875rem; color: #666;">Loading...</div>
                </div>
                <img data-src="${resolvedPath}" alt="${image.alt}" width="630" height="400" loading="lazy" style="opacity: 0; transition: opacity 0.3s ease;">
            </div>
            <div class="card-overlay">
                <div class="card-title">${image.title}</div>
                <div class="card-category">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
            </div>
        `;
    const img = card.querySelector("img");
    const placeholder = card.querySelector(".image-loading-placeholder");
    const observerOptions = {
      rootMargin: "50px 0px",
      // Load earlier
      threshold: 0.1
      // threshold for loading
    };
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const image2 = entry.target;
          const src = image2.getAttribute("data-src");
          image2.src = src;
          image2.removeAttribute("data-src");
          image2.onload = () => {
            image2.style.opacity = "1";
            placeholder.style.opacity = "0";
            const transitionDelay = 300;
            setTimeout(() => {
              if (placeholder.parentNode) {
                placeholder.remove();
              }
            }, transitionDelay);
            console.log(`✅ Lazy loaded image: ${src}`);
          };
          image2.onerror = () => {
            console.error(`❌ Failed to load image: ${src}`);
          };
          observer.unobserve(image2);
        }
      });
    }, observerOptions);
    imageObserver.observe(img);
    return card;
  }
  initFilters() {
    this.filterButtons.forEach((button) => {
      button.addEventListener("click", () => this.handleFilterClick(button));
    });
  }
  initLightbox() {
    this.galleryContainer.addEventListener("click", (e) => {
      const card = e.target.closest(".gallery-card");
      if (!card) return;
      const clickedImage = {
        filename: card.querySelector("img").src.split("/").pop(),
        title: card.querySelector(".card-title").textContent,
        category: card.dataset.category
      };
      let imagesToShow = [];
      let clickedIndex = 0;
      if (this.currentFilter === "all") {
        imagesToShow = this.allImagesData;
      } else {
        imagesToShow = this.allImagesData.filter((img) => img.category === this.currentFilter);
      }
      const lightboxImages = imagesToShow.map((image) => {
        return {
          src: getAssetPath(`/assets/gallery/${image.category}/${image.filename}`, {
            addCacheBusting: true
          }),
          title: image.title,
          category: image.category.charAt(0).toUpperCase() + image.category.slice(1),
          alt: image.alt
        };
      });
      clickedIndex = imagesToShow.findIndex(
        (img) => img.filename === clickedImage.filename && img.category === clickedImage.category
      );
      if (clickedIndex === -1) clickedIndex = 0;
      this.lightbox.open(lightboxImages, clickedIndex);
    });
  }
  handleFilterClick(button) {
    this.filterButtons.forEach((btn) => btn.classList.remove("cs-active"));
    button.classList.add("cs-active");
    const filter = button.dataset.filter;
    this.filterItems(filter);
  }
  filterItems(filter) {
    this.currentFilter = filter;
    this.galleryItems.forEach((item) => {
      const displayCategory = item.dataset.displayCategory;
      const shouldShow = displayCategory === filter;
      if (shouldShow) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
    const visibleItems = this.galleryItems.filter(
      (item) => item && item.style.display === "block"
    );
    console.log(`🔄 SIMPLIFIED: Showing ${visibleItems.length} items for filter '${filter}'`);
  }
}
class NeffPavingApp {
  constructor() {
    this.galleryFilter = null;
    this.init();
  }
  init() {
    console.log("Initializing Neff Paving App...");
    this.initHeroVideo();
    this.initAnimations();
    this.initNavigation();
    try {
      this.initGalleryFilters();
      console.log("Gallery initialized successfully");
    } catch (error) {
      console.error("Gallery initialization failed:", error);
    }
    console.log("Neff Paving app initialized successfully");
  }
  initHeroVideo() {
    const video = document.getElementById("hero-video");
    if (!video) return;
    video.addEventListener("error", (e) => {
      console.error("Video failed to load:", e);
      const heroSection = document.getElementById("hero");
      if (heroSection) {
        heroSection.style.backgroundColor = "#2c2c2c";
      }
    });
    video.addEventListener("loadeddata", () => {
      video.play().catch((err) => {
        console.error("Video autoplay failed:", err);
      });
    });
    video.style.opacity = "1";
  }
  initAnimations() {
    AOS.init({
      duration: 1e3,
      once: true,
      offset: 100
    });
    this.removeLoadingStates();
  }
  removeLoadingStates() {
    const style = document.createElement("style");
    style.textContent = `
            /* Force immediate visibility - no loading states */
            .loading,
            .spinner,
            .loader,
            .loading-overlay,
            .progress-bar,
            .loading-indicator {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
            }
            
            /* Ensure all gallery images are immediately visible */
            .gallery-card,
            .gallery-item,
            .gallery img,
            .card-image img {
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
            }
            
            /* Ensure forms work without loading indicators */
            .form-loading,
            .btn .loading,
            .submit-loading {
                display: none !important;
            }
            
            /* Remove any transition delays that might appear as loading */
            .gallery-card,
            .service-card,
            .contact-method {
                transition-delay: 0s !important;
            }
            
            /* Force maps and images to display immediately */
            .map-placeholder,
            .image-placeholder {
                background: transparent !important;
            }
            
            /* Disable animations that might look like loading */
            .spin {
                animation: none !important;
            }
        `;
    document.head.appendChild(style);
    console.log("✅ Loading states removed - content displays immediately");
  }
  initNavigation() {
    document.querySelectorAll('nav a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });
    });
  }
  initGalleryFilters() {
    const galleryElement = document.getElementById("gallery");
    if (galleryElement) {
      this.galleryFilter = new GalleryFilter(galleryElement);
    }
  }
}
function initializeApp() {
  try {
    console.log("Starting NeffPavingApp initialization...");
    new NeffPavingApp();
    console.log("NeffPavingApp initialized successfully");
  } catch (error) {
    console.error("Failed to initialize NeffPavingApp:", error);
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
//# sourceMappingURL=main-CYH-K0Rc.js.map
