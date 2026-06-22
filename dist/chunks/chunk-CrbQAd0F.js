const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["chunks/chunk-vzQuS6yE.js","chunks/chunk-B-1-B7_t.js"])))=>i.map(i=>d[i]);
import { r as __toESM } from "./chunk-B-1-B7_t.js";
import { t as require_aos } from "./chunk-BJJXfMjr.js";
//#region node_modules/@vercel/analytics/dist/index.mjs
var initQueue$1 = () => {
	if (window.va) return;
	window.va = function a(...params) {
		if (!window.vaq) window.vaq = [];
		window.vaq.push(params);
	};
};
var name$1 = "@vercel/analytics";
var version$1 = "2.0.1";
function isBrowser$1() {
	return typeof window !== "undefined";
}
function detectEnvironment$1() {
	return "production";
}
function setMode(mode = "auto") {
	if (mode === "auto") {
		window.vam = detectEnvironment$1();
		return;
	}
	window.vam = mode;
}
function getMode() {
	return (isBrowser$1() ? window.vam : detectEnvironment$1()) || "production";
}
function isDevelopment$1() {
	return getMode() === "development";
}
function getScriptSrc$1(props) {
	if (props.scriptSrc) return makeAbsolute$1(props.scriptSrc);
	if (isDevelopment$1()) return "https://va.vercel-scripts.com/v1/script.debug.js";
	if (props.basePath) return makeAbsolute$1(`${props.basePath}/insights/script.js`);
	return "/_vercel/insights/script.js";
}
function loadProps$1(explicitProps, confString) {
	var _a;
	let props = explicitProps;
	if (confString) try {
		props = {
			...(_a = JSON.parse(confString)) == null ? void 0 : _a.analytics,
			...explicitProps
		};
	} catch {}
	setMode(props.mode);
	const dataset = {
		sdkn: name$1 + (props.framework ? `/${props.framework}` : ""),
		sdkv: version$1
	};
	if (props.disableAutoTrack) dataset.disableAutoTrack = "1";
	if (props.viewEndpoint) dataset.viewEndpoint = makeAbsolute$1(props.viewEndpoint);
	if (props.eventEndpoint) dataset.eventEndpoint = makeAbsolute$1(props.eventEndpoint);
	if (props.sessionEndpoint) dataset.sessionEndpoint = makeAbsolute$1(props.sessionEndpoint);
	if (isDevelopment$1() && props.debug === false) dataset.debug = "false";
	if (props.dsn) dataset.dsn = props.dsn;
	if (props.endpoint) dataset.endpoint = props.endpoint;
	else if (props.basePath) dataset.endpoint = makeAbsolute$1(`${props.basePath}/insights`);
	return {
		beforeSend: props.beforeSend,
		src: getScriptSrc$1(props),
		dataset
	};
}
function makeAbsolute$1(url) {
	return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/") ? url : `/${url}`;
}
function inject(props = { debug: true }, confString) {
	var _a;
	if (!isBrowser$1()) return;
	const { beforeSend, src, dataset } = loadProps$1(props, confString);
	initQueue$1();
	if (beforeSend) (_a = window.va) == null || _a.call(window, "beforeSend", beforeSend);
	if (document.head.querySelector(`script[src*="${src}"]`)) return;
	const script = document.createElement("script");
	script.src = src;
	for (const [key, value] of Object.entries(dataset)) script.dataset[key] = value;
	script.defer = true;
	script.onerror = () => {
		const errorMessage = isDevelopment$1() ? "Please check if any ad blockers are enabled and try again." : "Be sure to enable Web Analytics for your project and deploy again. See https://vercel.com/docs/analytics/quickstart for more information.";
		console.log(`[Vercel Web Analytics] Failed to load script from ${src}. ${errorMessage}`);
	};
	document.head.appendChild(script);
}
//#endregion
//#region node_modules/@vercel/speed-insights/dist/index.mjs
var initQueue = () => {
	if (window.si) return;
	window.si = function a(...params) {
		window.siq = window.siq || [];
		window.siq.push(params);
	};
};
var name = "@vercel/speed-insights";
var version = "2.0.0";
function isBrowser() {
	return typeof window !== "undefined";
}
function detectEnvironment() {
	return "production";
}
function isDevelopment() {
	return detectEnvironment() === "development";
}
function getScriptSrc(props) {
	if (props.scriptSrc) return makeAbsolute(props.scriptSrc);
	if (isDevelopment()) return "https://va.vercel-scripts.com/v1/speed-insights/script.debug.js";
	if (props.dsn) return "https://va.vercel-scripts.com/v1/speed-insights/script.js";
	if (props.basePath) return makeAbsolute(`${props.basePath}/speed-insights/script.js`);
	return "/_vercel/speed-insights/script.js";
}
function loadProps(explicitProps, confString) {
	var _a;
	let props = explicitProps;
	if (confString) try {
		props = {
			...(_a = JSON.parse(confString)) == null ? void 0 : _a.speedInsights,
			...explicitProps
		};
	} catch {}
	const dataset = {
		sdkn: name + (props.framework ? `/${props.framework}` : ""),
		sdkv: version
	};
	if (props.sampleRate) dataset.sampleRate = props.sampleRate.toString();
	if (props.route) dataset.route = props.route;
	if (isDevelopment() && props.debug === false) dataset.debug = "false";
	if (props.dsn) dataset.dsn = props.dsn;
	if (props.endpoint) dataset.endpoint = makeAbsolute(props.endpoint);
	else if (props.basePath) dataset.endpoint = makeAbsolute(`${props.basePath}/speed-insights/vitals`);
	return {
		src: getScriptSrc(props),
		beforeSend: props.beforeSend,
		dataset
	};
}
function makeAbsolute(url) {
	return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/") ? url : `/${url}`;
}
function injectSpeedInsights(props = {}, confString) {
	var _a;
	if (!isBrowser() || props.route === null) return null;
	initQueue();
	const { beforeSend, src, dataset } = loadProps(props, confString);
	if (document.head.querySelector(`script[src*="${src}"]`)) return null;
	if (beforeSend) (_a = window.si) == null || _a.call(window, "beforeSend", beforeSend);
	const script = document.createElement("script");
	script.src = src;
	script.defer = true;
	for (const [key, value] of Object.entries(dataset)) script.dataset[key] = value;
	script.onerror = () => {
		console.log(`[Vercel Speed Insights] Failed to load script from ${src}. Please check if any content blockers are enabled and try again.`);
	};
	document.head.appendChild(script);
	return { setRoute: (route) => {
		script.dataset.route = route !== null && route !== void 0 ? route : void 0;
	} };
}
//#endregion
//#region src/components/lightbox.js
var import_aos = /* @__PURE__ */ __toESM(require_aos(), 1);
/**
* Lightbox component for image gallery
*/
var Lightbox = class {
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
		document.body.insertAdjacentHTML("beforeend", `
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
        `);
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
		this.lightboxImage.addEventListener("load", () => {});
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
};
//#endregion
//#region src/data/gallery-images.js
var galleryImages = {
	commercial: [
		{
			filename: "advance-auto-parking-lot-2.webp",
			title: "Advance Auto Parking Lot 2",
			alt: "Commercial parking lot paving for Advance Auto Parts"
		},
		{
			filename: "advance-auto-parking-lot-3.webp",
			title: "Advance Auto Parking Lot 3",
			alt: "Commercial parking lot paving for Advance Auto Parts"
		},
		{
			filename: "advance-auto-parking-lot.webp",
			title: "Advance Auto Parking Lot",
			alt: "Commercial parking lot paving for Advance Auto Parts"
		},
		{
			filename: "amg.webp",
			title: "AMG Commercial Project",
			alt: "Commercial paving project for AMG facility"
		},
		{
			filename: "apartment-complex-2.webp",
			title: "Apartment Complex 2",
			alt: "Apartment complex parking lot paving project"
		},
		{
			filename: "apartment-complex-3.webp",
			title: "Apartment Complex 3",
			alt: "Apartment complex parking lot paving project"
		},
		{
			filename: "apartment-complex-4.webp",
			title: "Apartment Complex 4",
			alt: "Apartment complex parking lot paving project"
		},
		{
			filename: "apartment-complex.webp",
			title: "Apartment Complex",
			alt: "Apartment complex parking lot paving project"
		},
		{
			filename: "apartments-garages-parking-lot-2.webp",
			title: "Apartments Garages Parking Lot 2",
			alt: "Parking lot paving for apartments with garages"
		},
		{
			filename: "apartments-garages-parking-lot-3-leeboy.webp",
			title: "Apartments Garages Parking Lot with Leeboy",
			alt: "Apartment parking lot paving with Leeboy equipment"
		},
		{
			filename: "apartments-garages-parking-lot.webp",
			title: "Apartments Garages Parking Lot",
			alt: "Parking lot paving for apartments with garages"
		},
		{
			filename: "asphalt-around-garage.webp",
			title: "Asphalt Around Garage",
			alt: "Asphalt paving work around commercial garage"
		},
		{
			filename: "before-after-riesebecks.webp",
			title: "Before After Riesbecks",
			alt: "Before and after comparison of Riesbecks parking lot"
		},
		{
			filename: "before-apartment-wreck.webp",
			title: "Before Apartment Reconstruction",
			alt: "Apartment parking lot before reconstruction work"
		},
		{
			filename: "behind-overhang-parking-lot.webp",
			title: "Behind Overhang Parking Lot",
			alt: "Parking lot paving behind building overhang"
		},
		{
			filename: "church-parking-lot-2.webp",
			title: "Church Parking Lot 2",
			alt: "Church parking lot paving project"
		},
		{
			filename: "church-parking-lot.webp",
			title: "Church Parking Lot",
			alt: "Church parking lot paving project"
		},
		{
			filename: "cinemark-colony-square.webp",
			title: "Cinemark Colony Square",
			alt: "Parking lot paving for Cinemark Colony Square theater"
		},
		{
			filename: "commercial-parking-lot-apartments-church.webp",
			title: "Commercial Parking Lot Apartments Church",
			alt: "Combined commercial parking lot for apartments and church"
		},
		{
			filename: "downtown-st-james-2.webp",
			title: "Downtown St James 2",
			alt: "Downtown St. James street paving project"
		},
		{
			filename: "downtown-st-james-stripped.webp",
			title: "Downtown St James Stripped",
			alt: "Downtown St. James with fresh line striping"
		},
		{
			filename: "downtown-st-james.webp",
			title: "Downtown St James",
			alt: "Downtown St. James street paving project"
		},
		{
			filename: "east-pike-shopping-center.webp",
			title: "East Pike Shopping Center",
			alt: "East Pike Shopping Center parking lot paving"
		},
		{
			filename: "five-below-2.webp",
			title: "Five Below 2",
			alt: "Five Below store parking lot paving project"
		},
		{
			filename: "five-below.webp",
			title: "Five Below",
			alt: "Five Below store parking lot paving project"
		},
		{
			filename: "florist.webp",
			title: "Florist",
			alt: "Florist shop parking lot paving project"
		},
		{
			filename: "formal-affairs.webp",
			title: "Formal Affairs",
			alt: "Formal Affairs business parking lot paving"
		},
		{
			filename: "garage-apartments-parking-lot.webp",
			title: "Garage Apartments Parking Lot",
			alt: "Parking lot for apartment garages"
		},
		{
			filename: "hamilton-waltman-melsheimer-2.webp",
			title: "Hamilton Waltman Melsheimer 2",
			alt: "Hamilton Waltman Melsheimer commercial paving project"
		},
		{
			filename: "hamilton-waltman-melsheimer-3.webp",
			title: "Hamilton Waltman Melsheimer 3",
			alt: "Hamilton Waltman Melsheimer commercial paving project"
		},
		{
			filename: "hamilton-waltman-melsheimer-4.webp",
			title: "Hamilton Waltman Melsheimer 4",
			alt: "Hamilton Waltman Melsheimer commercial paving project"
		},
		{
			filename: "hamilton-waltman-melsheimer-5.webp",
			title: "Hamilton Waltman Melsheimer 5",
			alt: "Hamilton Waltman Melsheimer commercial paving project"
		},
		{
			filename: "hamilton-waltman-melsheimer.webp",
			title: "Hamilton Waltman Melsheimer",
			alt: "Hamilton Waltman Melsheimer commercial paving project"
		},
		{
			filename: "holiday-inn-express-2.webp",
			title: "Holiday Inn Express 2",
			alt: "Holiday Inn Express parking lot paving project"
		},
		{
			filename: "holiday-inn-express.webp",
			title: "Holiday Inn Express",
			alt: "Holiday Inn Express parking lot paving project"
		},
		{
			filename: "large-open-parking-lot.webp",
			title: "Large Open Parking Lot",
			alt: "Large open commercial parking lot paving"
		},
		{
			filename: "leeboy-colony-square-mall.webp",
			title: "Leeboy Colony Square Mall",
			alt: "Colony Square Mall paving with Leeboy equipment"
		},
		{
			filename: "leeboy-condos.webp",
			title: "Leeboy Condos",
			alt: "Condominium parking lot paving with Leeboy equipment"
		},
		{
			filename: "leeboy-overhang.webp",
			title: "Leeboy Overhang",
			alt: "Paving work under overhang with Leeboy equipment"
		},
		{
			filename: "leeboy-riesbecks.webp",
			title: "Leeboy Riesbecks",
			alt: "Riesbecks parking lot paving with Leeboy equipment"
		},
		{
			filename: "leeboy-trailer-park.webp",
			title: "Leeboy Trailer Park",
			alt: "Trailer park paving with Leeboy equipment"
		},
		{
			filename: "lined-parking-lot.webp",
			title: "Lined Parking Lot",
			alt: "Commercial parking lot with fresh line striping"
		},
		{
			filename: "military-apartments-parking-lot.webp",
			title: "Military Apartments Parking Lot",
			alt: "Military apartments parking lot paving project"
		},
		{
			filename: "open-parking-area-behind-apartments.webp",
			title: "Open Parking Area Behind Apartments",
			alt: "Open parking area behind apartment complex"
		},
		{
			filename: "open-parking-lot-2.webp",
			title: "Open Parking Lot 2",
			alt: "Open commercial parking lot paving project"
		},
		{
			filename: "open-parking-lot-3.webp",
			title: "Open Parking Lot 3",
			alt: "Open commercial parking lot paving project"
		},
		{
			filename: "open-parking-lot-4.webp",
			title: "Open Parking Lot 4",
			alt: "Open commercial parking lot paving project"
		},
		{
			filename: "open-parking-lot.webp",
			title: "Open Parking Lot",
			alt: "Open commercial parking lot paving project"
		},
		{
			filename: "parking-lot-paved-wooded-area.webp",
			title: "Parking Lot Paved Wooded Area",
			alt: "Parking lot paving in wooded area"
		},
		{
			filename: "parking-lot.webp",
			title: "Parking Lot",
			alt: "Commercial parking lot paving project"
		},
		{
			filename: "paved-strip-mall.webp",
			title: "Paved Strip Mall",
			alt: "Strip mall parking lot paving project"
		},
		{
			filename: "paver-parking-lot.webp",
			title: "Paver Parking Lot",
			alt: "Commercial parking lot with paver work"
		},
		{
			filename: "private-road-apartments.webp",
			title: "Private Road Apartments",
			alt: "Private road paving for apartment complex"
		},
		{
			filename: "reisbecks-parking-lot-5.webp",
			title: "Riesbecks Parking Lot 5",
			alt: "Riesbecks store parking lot paving project"
		},
		{
			filename: "reisebecks-parking-lot-2.webp",
			title: "Riesbecks Parking Lot 2",
			alt: "Riesbecks store parking lot paving project"
		},
		{
			filename: "reisebecks-parking-lot-3.webp",
			title: "Riesbecks Parking Lot 3",
			alt: "Riesbecks store parking lot paving project"
		},
		{
			filename: "reisebecks-parking-lot-4.webp",
			title: "Riesbecks Parking Lot 4",
			alt: "Riesbecks store parking lot paving project"
		},
		{
			filename: "reisebecks-parking-lot.webp",
			title: "Riesbecks Parking Lot",
			alt: "Riesbecks store parking lot paving project"
		},
		{
			filename: "roller-dump-workers-working.webp",
			title: "Roller Dump Workers Working",
			alt: "Workers operating roller and dump equipment"
		},
		{
			filename: "roller-open-parking-lot.webp",
			title: "Roller Open Parking Lot",
			alt: "Open parking lot paving with roller equipment"
		},
		{
			filename: "roller-parking-lot.webp",
			title: "Roller Parking Lot",
			alt: "Parking lot paving with roller equipment"
		},
		{
			filename: "rolller-private-road.webp",
			title: "Roller Private Road",
			alt: "Private road paving with roller equipment"
		},
		{
			filename: "roseville-drive-thru-parking-lot-2.webp",
			title: "Roseville Drive Thru Parking Lot 2",
			alt: "Roseville drive-thru parking lot paving"
		},
		{
			filename: "roseville-drive-thru-parking-lot-e.webp",
			title: "Roseville Drive Thru Parking Lot E",
			alt: "Roseville drive-thru parking lot paving"
		},
		{
			filename: "roseville-drive-thru-parking-lot.webp",
			title: "Roseville Drive Thru Parking Lot",
			alt: "Roseville drive-thru parking lot paving"
		},
		{
			filename: "school-0-ring.webp",
			title: "School O Ring",
			alt: "School property paving with circular design"
		},
		{
			filename: "school-entryway.webp",
			title: "School Entryway",
			alt: "School entryway paving project"
		},
		{
			filename: "steamy-parking-lot.webp",
			title: "Steamy Parking Lot",
			alt: "Parking lot with steam from fresh asphalt"
		},
		{
			filename: "the-barn-after.webp",
			title: "The Barn After",
			alt: "The Barn parking lot after paving completion"
		},
		{
			filename: "the-barn-before.webp",
			title: "The Barn Before",
			alt: "The Barn parking lot before paving work"
		},
		{
			filename: "the-barn-parking-lot.webp",
			title: "The Barn Parking Lot",
			alt: "The Barn parking lot paving project"
		},
		{
			filename: "wilsons.webp",
			title: "Wilsons",
			alt: "Wilsons business parking lot paving project"
		},
		{
			filename: "workers-not-working-more.webp",
			title: "Workers Not Working More",
			alt: "Construction workers taking a break"
		},
		{
			filename: "workers-not-working.webp",
			title: "Workers Not Working",
			alt: "Construction workers taking a break"
		},
		{
			filename: "workers-working-overhang.webp",
			title: "Workers Working Overhang",
			alt: "Workers paving under building overhang"
		}
	],
	residential: [
		{
			filename: "asphalt-driveway-barn.webp",
			title: "Asphalt Driveway Barn",
			alt: "Residential driveway leading to barn"
		},
		{
			filename: "asphalt-driveway-turnaround-2.webp",
			title: "Asphalt Driveway Turnaround 2",
			alt: "Residential driveway with turnaround area"
		},
		{
			filename: "asphalt-driveway-turnaround.webp",
			title: "Asphalt Driveway Turnaround",
			alt: "Residential driveway with turnaround area"
		},
		{
			filename: "austins-truck-college.webp",
			title: "Austins Truck College",
			alt: "Driveway for Austins Truck College"
		},
		{
			filename: "bungalow-driveway.webp",
			title: "Bungalow Driveway",
			alt: "Charming bungalow house driveway"
		},
		{
			filename: "cart-path-to-landing.webp",
			title: "Cart Path To Landing",
			alt: "Cart path leading to landing area"
		},
		{
			filename: "clearing-driveway.webp",
			title: "Clearing Driveway",
			alt: "Driveway through cleared wooded area"
		},
		{
			filename: "custom-mansion-driveway-2.webp",
			title: "Custom Mansion Driveway 2",
			alt: "Luxury mansion custom driveway design"
		},
		{
			filename: "custom-mansion-driveway-3.webp",
			title: "Custom Mansion Driveway 3",
			alt: "Luxury mansion custom driveway design"
		},
		{
			filename: "custom-mansion-driveway-4.webp",
			title: "Custom Mansion Driveway 4",
			alt: "Luxury mansion custom driveway design"
		},
		{
			filename: "custom-mansion-driveway.webp",
			title: "Custom Mansion Driveway",
			alt: "Luxury mansion custom driveway design"
		},
		{
			filename: "driveway-garage-door.webp",
			title: "Driveway Garage Door",
			alt: "Residential driveway leading to garage"
		},
		{
			filename: "driveway-turnaround-area-2.webp",
			title: "Driveway Turnaround Area 2",
			alt: "Residential driveway turnaround area"
		},
		{
			filename: "driveway-turnaround-area.webp",
			title: "Driveway Turnaround Area",
			alt: "Residential driveway turnaround area"
		},
		{
			filename: "flagpole-driveway-country-2.webp",
			title: "Flagpole Driveway Country 2",
			alt: "Country driveway with flagpole"
		},
		{
			filename: "flagpole-driveway-country.webp",
			title: "Flagpole Driveway Country",
			alt: "Country driveway with flagpole"
		},
		{
			filename: "long-driveway-bridge.webp",
			title: "Long Driveway Bridge",
			alt: "Long residential driveway with bridge"
		},
		{
			filename: "long-driveway-to-road.webp",
			title: "Long Driveway To Road",
			alt: "Long residential driveway connecting to road"
		},
		{
			filename: "open-basketball-court.webp",
			title: "Open Basketball Court",
			alt: "Residential basketball court paving"
		},
		{
			filename: "pond-asphalt-driveway.webp",
			title: "Pond Asphalt Driveway",
			alt: "Asphalt driveway near pond"
		},
		{
			filename: "roller-residential-driveway.webp",
			title: "Roller Residential Driveway",
			alt: "Residential driveway with roller equipment"
		},
		{
			filename: "stone-lined-paved-driveway-2.webp",
			title: "Stone Lined Paved Driveway 2",
			alt: "Paved driveway with decorative stone lining"
		},
		{
			filename: "stone-lined-paved-driveway.webp",
			title: "Stone Lined Paved Driveway",
			alt: "Paved driveway with decorative stone lining"
		}
	],
	equipment: [
		{
			filename: "leeboy-closeup.webp",
			title: "Leeboy Closeup",
			alt: "Close-up view of Leeboy paving equipment"
		},
		{
			filename: "leeboy-dropping-tar.webp",
			title: "Leeboy Dropping Tar",
			alt: "Leeboy equipment applying tar/asphalt"
		},
		{
			filename: "leeboy-top-down.webp",
			title: "Leeboy Top Down",
			alt: "Top-down view of Leeboy paving equipment"
		},
		{
			filename: "loading-leeboy-2.webp",
			title: "Loading Leeboy 2",
			alt: "Loading Leeboy paving equipment"
		},
		{
			filename: "loading-leeboy.webp",
			title: "Loading Leeboy",
			alt: "Loading Leeboy paving equipment"
		}
	],
	concrete: [
		{
			filename: "concrete-pad.webp",
			title: "Concrete Pad",
			alt: "Concrete pad installation project"
		},
		{
			filename: "convenience-store.webp",
			title: "Convenience Store",
			alt: "Concrete work at convenience store"
		},
		{
			filename: "manhole-cover.webp",
			title: "Manhole Cover",
			alt: "Concrete manhole cover installation"
		},
		{
			filename: "square-drain-cover.webp",
			title: "Square Drain Cover",
			alt: "Square concrete drain cover installation"
		}
	]
};
//#endregion
//#region src/data/facebook-images.js
var facebookImages = [{
	"filename": "fb-1458305476314382.webp",
	"title": "Website Feed Cover Photo",
	"alt": "Website Feed Cover Photo",
	"date": "2026-06-17T06:39:23+0000"
}];
//#endregion
//#region src/utils/base-url.js
/**
* Enhanced Base URL utility for handling different deployment environments
* Provides comprehensive asset handling with relative paths and dynamic resolution
*/
/**
* Detect Vercel environment at runtime
* @returns {boolean} True if running on Vercel
*/
function detectVercelEnvironment() {
	if (typeof window !== "undefined") {
		const hostname = window.location.hostname;
		if (hostname.endsWith(".vercel.app")) return true;
		if (hostname.includes("vercel.app")) return true;
		if (document.querySelector("script[src*=\"vercel-scripts.com\"]")) return true;
	}
	if (typeof process !== "undefined" && {}) {
		if ({}.VERCEL || {}.VERCEL_ENV || {}.VERCEL_URL) return true;
		if ({}.VITE_PLATFORM === "vercel" || {}.DEPLOY_PLATFORM === "vercel") return true;
	}
	return false;
}
/**
* Detect GitHub Pages environment at runtime
* @returns {boolean} True if running on GitHub Pages
*/
function detectGitHubPagesEnvironment() {
	return true;
}
var IS_VERCEL_DETECTED = detectVercelEnvironment();
var IS_GITHUB_PAGES_DETECTED = detectGitHubPagesEnvironment();
var BASE_URL = (() => {
	return "/Neff-Paving/";
})();
var DEPLOY_MODE = (() => {
	return "github";
})();
var BUILD_TIMESTAMP = "2026-06-22T07:45:06.176Z";
var DEPLOY_TIME = 1782114306176;
var IS_VERCEL = IS_VERCEL_DETECTED;
var IS_GITHUB_PAGES = IS_GITHUB_PAGES_DETECTED;
if (typeof window !== "undefined" && window.location.search.includes("debug=assets")) {
	console.group("🛠️ Build-time Variables Check");
	console.log("BASE_URL:", BASE_URL);
	console.log("DEPLOY_MODE:", DEPLOY_MODE);
	console.log("IS_VERCEL:", IS_VERCEL);
	console.log("IS_GITHUB_PAGES:", IS_GITHUB_PAGES);
	console.log("BUILD_TIMESTAMP:", BUILD_TIMESTAMP);
	console.log("DEPLOY_TIME:", DEPLOY_TIME);
	console.groupEnd();
}
var ASSET_CONFIG = {
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
/**
* Get the current environment configuration
* @returns {object} Environment-specific asset configuration
*/
function getEnvironmentConfig() {
	const isDev = typeof process !== "undefined" && false;
	const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
	const hasGitHubBasePath = typeof window !== "undefined" && window.location.pathname.startsWith("/Neff-Paving/");
	if (isLocalhost && hasGitHubBasePath) return ASSET_CONFIG.github;
	if (isDev && isLocalhost) return ASSET_CONFIG.development;
	return ASSET_CONFIG[DEPLOY_MODE] || ASSET_CONFIG.github;
}
/**
* Enhanced asset path resolution with relative path support
* @param {string} assetPath - The asset path
* @param {object} options - Resolution options
* @returns {string} The environment-specific asset path
*/
function getAssetPath(assetPath, options = {}) {
	var _window$localStorage;
	const isDebug = typeof window !== "undefined" && window.location.search.includes("debug=assets") || typeof window !== "undefined" && ((_window$localStorage = window.localStorage) === null || _window$localStorage === void 0 ? void 0 : _window$localStorage.getItem("debug-assets")) === "true";
	if (isDebug) {
		console.group("🔧 getAssetPath Debug Info");
		console.log("📥 Input:", {
			assetPath,
			options
		});
		console.log("🌍 Environment:", {
			DEPLOY_MODE,
			BASE_URL,
			IS_VERCEL,
			IS_GITHUB_PAGES
		});
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
	const { useRelative = config.useRelativePaths, addCacheBusting = true, forceAbsolute = false } = options;
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
	} else if (isDebug) console.log("⏰ Cache busting skipped:", {
		addCacheBusting,
		cacheStrategy: config.cacheStrategy
	});
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
/**
* Critical asset preloading for improved performance
* @param {Array} assets - Array of critical assets to preload
*/
function preloadCriticalAssets(assets = []) {
	if (typeof document === "undefined") return;
	[...[
		{
			type: "style",
			href: "assets/main.css",
			as: "style"
		},
		{
			type: "script",
			href: "src/main.js",
			as: "script"
		},
		{
			type: "font",
			href: "https://fonts.gstatic.com/s/oswald/v49/TK3IWkUHHAIjg75cFRf3bXL8LICs1_Fw.woff2",
			as: "font",
			crossorigin: true
		},
		{
			type: "image",
			href: "assets/images/logo.png",
			as: "image"
		}
	], ...assets].forEach((asset) => {
		if (document.querySelector(`link[href="${asset.href}"]`)) return;
		const link = document.createElement("link");
		link.rel = asset.type === "font" ? "preload" : "prefetch";
		link.href = getAssetPath(asset.href, { addCacheBusting: false });
		link.as = asset.as;
		if (asset.crossorigin) link.crossOrigin = "anonymous";
		if (asset.type === "font") link.type = "font/woff2";
		document.head.appendChild(link);
	});
}
/**
* Enhanced asset path updating with improved error handling
*/
function updateAssetPaths() {
	if (typeof document === "undefined") return;
	getEnvironmentConfig();
	document.querySelectorAll([
		"a[href^=\"/\"]:not([href^=\"//\"])",
		"img[src^=\"/\"]:not([src^=\"//\"])",
		"link[href^=\"/\"]:not([href^=\"//\"])",
		"script[src^=\"/\"]:not([src^=\"//\"])",
		"source[src^=\"/\"]:not([src^=\"//\"])",
		"video[src^=\"/\"]:not([src^=\"//\"])",
		"audio[src^=\"/\"]:not([src^=\"//\"])",
		"[style*=\"url(/\"]"
	].join(", ")).forEach((element) => {
		try {
			const tagName = element.tagName.toLowerCase();
			let attr, currentPath;
			if (tagName === "a" || tagName === "link") attr = "href";
			else if ([
				"img",
				"script",
				"source",
				"video",
				"audio"
			].includes(tagName)) attr = "src";
			else if (element.hasAttribute("style")) {
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
					const newPath = getAssetPath(currentPath, { addCacheBusting: !element.hasAttribute("data-no-cache-bust") });
					element.setAttribute(attr, newPath);
				}
			}
		} catch (error) {
			console.warn("Failed to update asset path for element:", element, error);
		}
	});
}
/**
* Initialize asset optimization features
*/
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
if (typeof document !== "undefined" && document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeAssetOptimization);
else if (typeof document !== "undefined") initializeAssetOptimization();
//#endregion
//#region src/components/gallery-filter.js
var allGalleryImages = facebookImages.length > 0 ? {
	facebook: facebookImages,
	...galleryImages
} : { ...galleryImages };
var GalleryFilter = class {
	constructor(galleryElement) {
		this.galleryElement = galleryElement;
		this.galleryContainer = galleryElement.querySelector(".gallery");
		this.filterButtons = document.querySelectorAll(".button-group .button");
		this.galleryItems = [];
		this.lightbox = new Lightbox();
		this.allImagesData = [];
		this.currentFilter = "all";
		this.init();
	}
	init() {
		this.loadAllImageData();
		this.syncFacebookFilterButton();
		this.initFilters();
		this.initLightbox();
		if (this.filterButtons.length > 0) this.filterButtons[0].classList.add("cs-active");
		this.filterItems("all");
	}
	loadAllImageData() {
		this.allImagesData = [];
		Object.entries(allGalleryImages).forEach(([category, images]) => {
			images.forEach((image) => {
				this.allImagesData.push({
					...image,
					category
				});
			});
		});
		console.log(`🔄 Gallery: Loaded ${this.allImagesData.length} total images from all categories`);
	}
	syncFacebookFilterButton() {
		const fbButton = document.querySelector(".button-group .button[data-filter=\"facebook\"]");
		if (fbButton) fbButton.hidden = facebookImages.length === 0;
	}
	loadGalleryImages(filter) {
		this.galleryContainer.innerHTML = "";
		this.galleryItems = [];
		let imagesToDisplay = [];
		if (filter === "facebook") imagesToDisplay = this.allImagesData.filter((img) => img.category === "facebook").slice(0, 10);
		else if (filter === "all") imagesToDisplay = this.shuffleArray([...this.allImagesData]).slice(0, 10);
		else {
			const categoryImages = this.allImagesData.filter((img) => img.category === filter);
			imagesToDisplay = this.shuffleArray([...categoryImages]).slice(0, 10);
			if (imagesToDisplay.length < 10) console.log(`⚠️ Category '${filter}' has only ${categoryImages.length} images`);
		}
		imagesToDisplay.forEach((image) => {
			const galleryCard = this.createGalleryCard(image);
			this.galleryContainer.appendChild(galleryCard);
			this.galleryItems.push(galleryCard);
		});
		console.log(`🔄 Gallery Filter '${filter}': Showing exactly ${imagesToDisplay.length} images`);
	}
	shuffleArray(array) {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}
	formatCategory(category) {
		if (category === "facebook") return "Latest";
		return category.charAt(0).toUpperCase() + category.slice(1);
	}
	createGalleryCard(image) {
		const card = document.createElement("div");
		card.className = "gallery-card";
		card.setAttribute("data-category", image.category);
		card.innerHTML = `
            <div class="card-image">
                <div class="image-loading-placeholder">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem; color: #999;">📷</div>
                    <div style="font-size: 0.875rem; color: #666;">Loading...</div>
                </div>
                <img data-src="${getAssetPath(`/assets/gallery/${image.category}/${image.filename}`, { addCacheBusting: true })}" alt="${image.alt}" width="630" height="400" loading="lazy" style="opacity: 0; transition: opacity 0.3s ease;">
            </div>
            <div class="card-overlay">
                <div class="card-title">${image.title}</div>
                <div class="card-category">${this.formatCategory(image.category)}</div>
            </div>
        `;
		const img = card.querySelector("img");
		const placeholder = card.querySelector(".image-loading-placeholder");
		new IntersectionObserver((entries, observer) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const image = entry.target;
					const src = image.getAttribute("data-src");
					image.src = src;
					image.removeAttribute("data-src");
					image.onload = () => {
						image.style.opacity = "1";
						placeholder.style.opacity = "0";
						setTimeout(() => {
							if (placeholder.parentNode) placeholder.remove();
						}, 300);
						console.log(`✅ Lazy loaded image: ${src}`);
					};
					image.onerror = () => {
						console.error(`❌ Failed to load image: ${src}`);
					};
					observer.unobserve(image);
				}
			});
		}, {
			rootMargin: "50px 0px",
			threshold: .1
		}).observe(img);
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
			const imgEl = card.querySelector("img");
			const clickedImage = {
				filename: imgEl.src.split("/").pop() || imgEl.getAttribute("data-src").split("/").pop(),
				title: card.querySelector(".card-title").textContent,
				category: card.dataset.category
			};
			let imagesToShow = [];
			let clickedIndex = 0;
			if (this.currentFilter === "all") imagesToShow = this.allImagesData;
			else imagesToShow = this.allImagesData.filter((img) => img.category === this.currentFilter);
			const lightboxImages = imagesToShow.map((image) => {
				return {
					src: getAssetPath(`/assets/gallery/${image.category}/${image.filename}`, { addCacheBusting: true }),
					title: image.title,
					category: this.formatCategory(image.category),
					alt: image.alt
				};
			});
			clickedIndex = imagesToShow.findIndex((img) => img.filename === clickedImage.filename && img.category === clickedImage.category);
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
		this.loadGalleryImages(filter);
	}
};
//#endregion
//#region src/utils/content-populator.js
/**
* Content Populator - Loads CMS content from JSON and updates DOM
*/
var ContentPopulator = class {
	constructor() {
		this.content = {
			homepage: null,
			services: null,
			gallery: null
		};
	}
	/**
	* Load all content from JSON files
	*/
	async loadContent() {
		try {
			const [homepage, services, gallery] = await Promise.all([
				fetch("/content/homepage.json").then((r) => r.json()),
				fetch("/content/services.json").then((r) => r.json()),
				fetch("/content/gallery.json").then((r) => r.json())
			]);
			this.content.homepage = homepage;
			this.content.services = services;
			this.content.gallery = gallery;
			return this.content;
		} catch (error) {
			console.error("Failed to load content:", error);
			throw error;
		}
	}
	/**
	* Populate all dynamic content on the page
	*/
	async populate() {
		await this.loadContent();
		this.populateHero();
		this.populateStats();
		this.populateIntroduction();
		console.log("✅ Dynamic content loaded successfully");
	}
	/**
	* Populate hero section
	*/
	populateHero() {
		var _hero$cta, _hero$cta2;
		const { hero } = this.content.homepage;
		if (!hero) return;
		const heroBadge = document.querySelector(".hero-badge");
		if (heroBadge) heroBadge.textContent = hero.badge;
		const heroEyebrow = document.querySelector(".hero-eyebrow");
		if (heroEyebrow) heroEyebrow.textContent = hero.eyebrow;
		const heroTitle = document.querySelector(".hero-title");
		if (heroTitle) heroTitle.innerHTML = hero.title;
		const heroSubtitle = document.querySelector(".hero-subtitle");
		if (heroSubtitle) heroSubtitle.innerHTML = hero.subtitle;
		const heroMotto = document.querySelector(".hero-motto");
		if (heroMotto) heroMotto.textContent = hero.motto;
		const primaryCta = document.querySelector(".hero-cta .btn-primary");
		if (primaryCta && ((_hero$cta = hero.cta) === null || _hero$cta === void 0 ? void 0 : _hero$cta.primary)) {
			primaryCta.textContent = hero.cta.primary.text;
			primaryCta.href = hero.cta.primary.link;
		}
		const secondaryCta = document.querySelector(".hero-cta .btn-outline");
		if (secondaryCta && ((_hero$cta2 = hero.cta) === null || _hero$cta2 === void 0 ? void 0 : _hero$cta2.secondary)) {
			secondaryCta.textContent = hero.cta.secondary.text;
			secondaryCta.href = hero.cta.secondary.link;
		}
		if (hero.socialProof && Array.isArray(hero.socialProof)) {
			const socialProofContainer = document.querySelector(".hero-social");
			if (socialProofContainer) {
				socialProofContainer.innerHTML = "";
				hero.socialProof.forEach((item) => {
					const itemDiv = document.createElement("div");
					itemDiv.className = "item";
					if (item.type === "rating") itemDiv.innerHTML = `
              <span class="stars">${item.stars}</span>
              <span class="lbl">${item.label}</span>
            `;
					else if (item.type === "stat") itemDiv.innerHTML = `
              <span class="num">${item.number}</span>
              <span class="lbl">${item.label}</span>
            `;
					socialProofContainer.appendChild(itemDiv);
				});
			}
		}
		if (hero.video) {
			const video = document.getElementById("hero-video");
			if (video) {
				video.poster = hero.video.poster;
				const source = video.querySelector("source");
				if (source) {
					source.src = hero.video.src;
					video.load();
				}
			}
		}
	}
	/**
	* Populate stats section
	*/
	populateStats() {
		const { stats } = this.content.homepage;
		if (!stats || !Array.isArray(stats)) return;
		const statsSection = document.querySelector(".stats-grid");
		if (!statsSection) return;
		statsSection.innerHTML = "";
		stats.forEach((stat) => {
			const statCard = document.createElement("div");
			statCard.className = "stat-card";
			statCard.setAttribute("data-aos", "fade-up");
			statCard.innerHTML = `
        <div class="stat-number">${stat.number}</div>
        <div class="stat-label">${stat.label}</div>
        <div class="stat-description">${stat.description}</div>
      `;
			statsSection.appendChild(statCard);
		});
	}
	/**
	* Populate introduction section
	*/
	populateIntroduction() {
		var _introduction$cta, _introduction$cta2;
		const { introduction } = this.content.homepage;
		if (!introduction) return;
		const eyebrow = document.querySelector(".introduction .eyebrow");
		if (eyebrow) eyebrow.textContent = introduction.eyebrow;
		const title = document.querySelector(".introduction .section-title");
		if (title) title.textContent = introduction.title;
		const lead = document.querySelector(".introduction .lead");
		if (lead) lead.textContent = introduction.lead;
		if (introduction.points && Array.isArray(introduction.points)) {
			const pointsContainer = document.querySelector(".feature-points");
			if (pointsContainer) {
				pointsContainer.innerHTML = "";
				introduction.points.forEach((point) => {
					const pointDiv = document.createElement("div");
					pointDiv.className = "point";
					pointDiv.setAttribute("data-aos", "fade-up");
					pointDiv.innerHTML = `
            <div class="point-icon">
              ${this.getIconSvg(point.icon)}
            </div>
            <div class="point-content">
              <h3>${point.title}</h3>
              <p>${point.description}</p>
            </div>
          `;
					pointsContainer.appendChild(pointDiv);
				});
			}
		}
		if ((_introduction$cta = introduction.cta) === null || _introduction$cta === void 0 ? void 0 : _introduction$cta.button) {
			const ctaButton = document.querySelector(".introduction .cta-button");
			if (ctaButton) {
				ctaButton.textContent = introduction.cta.button.text;
				ctaButton.href = introduction.cta.button.link;
			}
		}
		if ((_introduction$cta2 = introduction.cta) === null || _introduction$cta2 === void 0 ? void 0 : _introduction$cta2.note) {
			const ctaNote = document.querySelector(".introduction .cta-note");
			if (ctaNote) ctaNote.innerHTML = `${introduction.cta.note.icon} ${introduction.cta.note.text}`;
		}
	}
	/**
	* Get SVG icon markup based on icon name
	*/
	getIconSvg(iconName) {
		const icons = {
			"star": "<svg viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z\"/></svg>",
			"check-circle": "<svg viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z\"/></svg>",
			"fast": "<svg viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M15.5 5H11l5 7-3.5 1-8-6h11l3 2 2 1-3 3h3l4-4-5.5-4z\"/></svg>"
		};
		return icons[iconName] || icons["check-circle"];
	}
};
//#endregion
//#region \0vite/preload-helper.js
var scriptRel = "modulepreload";
var assetsURL = function(dep) {
	return "/Neff-Paving/" + dep;
};
var seen = {};
var __vitePreload = function preload(baseModule, deps, importerUrl) {
	let promise = Promise.resolve();
	if (deps && deps.length > 0) {
		const links = document.getElementsByTagName("link");
		const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
		const cspNonce = (cspNonceMeta === null || cspNonceMeta === void 0 ? void 0 : cspNonceMeta.nonce) || (cspNonceMeta === null || cspNonceMeta === void 0 ? void 0 : cspNonceMeta.getAttribute("nonce"));
		function allSettled(promises) {
			return Promise.all(promises.map((p) => Promise.resolve(p).then((value) => ({
				status: "fulfilled",
				value
			}), (reason) => ({
				status: "rejected",
				reason
			}))));
		}
		promise = allSettled(deps.map((dep) => {
			dep = assetsURL(dep, importerUrl);
			if (dep in seen) return;
			seen[dep] = true;
			const isCss = dep.endsWith(".css");
			const cssSelector = isCss ? "[rel=\"stylesheet\"]" : "";
			if (!!importerUrl) for (let i = links.length - 1; i >= 0; i--) {
				const link = links[i];
				if (link.href === dep && (!isCss || link.rel === "stylesheet")) return;
			}
			else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) return;
			const link = document.createElement("link");
			link.rel = isCss ? "stylesheet" : scriptRel;
			if (!isCss) link.as = "script";
			link.crossOrigin = "";
			link.href = dep;
			if (cspNonce) link.setAttribute("nonce", cspNonce);
			document.head.appendChild(link);
			if (isCss) return new Promise((res, rej) => {
				link.addEventListener("load", res);
				link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
			});
		}));
	}
	function handlePreloadError(err) {
		const e = new Event("vite:preloadError", { cancelable: true });
		e.payload = err;
		window.dispatchEvent(e);
		if (!e.defaultPrevented) throw err;
	}
	return promise.then((res) => {
		for (const item of res || []) {
			if (item.status !== "rejected") continue;
			handlePreloadError(item.reason);
		}
		return baseModule().catch(handlePreloadError);
	});
};
//#endregion
//#region src/main.js
var NeffPavingApp = class {
	constructor() {
		this.galleryFilter = null;
		this.contentPopulator = null;
		this.init();
	}
	async init() {
		console.log("Initializing Neff Paving App...");
		try {
			await this.initDynamicContent();
			console.log("Dynamic content loaded successfully");
		} catch (error) {
			console.error("Dynamic content loading failed:", error);
		}
		this.initAnalytics();
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
	async initDynamicContent() {
		this.contentPopulator = new ContentPopulator();
		await this.contentPopulator.populate();
	}
	async initAnalytics() {
		try {
			const { BLOCKED_PROPERTIES } = await __vitePreload(async () => {
				const { BLOCKED_PROPERTIES } = await import("./chunk-vzQuS6yE.js").then((n) => n.n);
				return { BLOCKED_PROPERTIES };
			}, __vite__mapDeps([0,1]));
			inject({ beforeSend: (event) => {
				var _event$data;
				if ((_event$data = event.data) === null || _event$data === void 0 ? void 0 : _event$data.properties) {
					const filtered = Object.keys(event.data.properties).reduce((acc, key) => {
						if (!BLOCKED_PROPERTIES.some((blocked) => key.toLowerCase().includes(blocked.toLowerCase()))) acc[key] = event.data.properties[key];
						else console.warn("[Analytics] beforeSend blocked PII:", key);
						return acc;
					}, {});
					return {
						...event,
						data: {
							...event.data,
							properties: filtered
						}
					};
				}
				return event;
			} });
			injectSpeedInsights();
			console.log("Analytics initialized with PII filtering");
		} catch (error) {
			console.error("Analytics initialization failed:", error);
		}
	}
	initHeroVideo() {
		const video = document.getElementById("hero-video");
		if (!video) return;
		video.addEventListener("error", (e) => {
			console.error("Video failed to load:", e);
			const heroSection = document.getElementById("hero");
			if (heroSection) heroSection.style.backgroundColor = "#2c2c2c";
		});
		const videoObserver = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					if (video.readyState === 0) video.load();
					video.play().catch((err) => {
						console.error("Video autoplay failed:", err);
					});
					video.style.opacity = "1";
					videoObserver.unobserve(video);
				}
			});
		}, { rootMargin: "50px" });
		videoObserver.observe(video);
	}
	initAnimations() {
		const initAOS = () => {
			import_aos.default.init({
				duration: 1e3,
				once: true,
				offset: 100
			});
		};
		if ("requestIdleCallback" in window) requestIdleCallback(initAOS, { timeout: 2e3 });
		else setTimeout(initAOS, 100);
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
		document.querySelectorAll("nav a[href^=\"#\"]").forEach((anchor) => {
			anchor.addEventListener("click", function(e) {
				e.preventDefault();
				const target = document.querySelector(this.getAttribute("href"));
				if (target) target.scrollIntoView({
					behavior: "smooth",
					block: "start"
				});
			});
		});
	}
	initGalleryFilters() {
		const galleryElement = document.getElementById("gallery");
		if (galleryElement) this.galleryFilter = new GalleryFilter(galleryElement);
	}
};
async function initializeApp() {
	try {
		console.log("Starting NeffPavingApp initialization...");
		await new NeffPavingApp();
		console.log("NeffPavingApp initialized successfully");
	} catch (error) {
		console.error("Failed to initialize NeffPavingApp:", error);
	}
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeApp);
else initializeApp();
//#endregion

//# sourceMappingURL=chunk-CrbQAd0F.js.map