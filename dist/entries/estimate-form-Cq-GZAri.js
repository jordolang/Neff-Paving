import "../chunks/chunk-BsPm7yBB.js";
/* empty css                       */
import { t as BLOCKED_PROPERTIES } from "../chunks/chunk-vzQuS6yE.js";
import { inject, track } from "https://cdn.jsdelivr.net/npm/@vercel/analytics@1.5.0/+esm";
//#region estimate-form.html?html-proxy&index=1.js
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
track("page_view", {
	page_type: "estimate_form",
	page: "estimate_form",
	referrer: document.referrer || void 0
});
//#endregion

//# sourceMappingURL=estimate-form-Cq-GZAri.js.map