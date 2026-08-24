window.__ModuleLoader__.load({ id: "dsh-workspace-status", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let react = require("react");
react = __toESM(react);

//#region src/client/index.ts
const style = `
@keyframes dsh-workspace-status-pulse {
  0%, 100% { color: var(--ds-accent, #4f9cff); filter: drop-shadow(0 0 0 transparent); transform: scale(1); }
  50% { color: color-mix(in srgb, var(--ds-accent, #4f9cff) 72%, white); filter: drop-shadow(0 0 5px currentColor); transform: scale(1.14); }
}

[role="tree"] > div:has([data-state="ongoing"]) > * > [role="treeitem"] > span:first-child {
  animation: dsh-workspace-status-pulse 1.6s ease-in-out infinite;
  transform-origin: center;
}

[role="tree"] > div:has([data-state="ongoing"]) > * > [role="treeitem"] > span:first-child svg {
  color: var(--ds-accent, #4f9cff);
}

[role="tree"] > div:has([data-state="done"]):not(:has([data-state="ongoing"])) > * > [role="treeitem"] > span:first-child,
[data-dsh-workspace-status-unread="true"] {
  color: var(--ds-success, #22a06b);
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--ds-success, #22a06b) 55%, transparent));
}

@media (prefers-reduced-motion: reduce) {
  [role="tree"] > div:has([data-state="ongoing"]) > * > [role="treeitem"] > span:first-child {
    animation: none;
    filter: none;
    transform: none;
  }
}
`;
function WorkspaceState(props) {
	const workspaces = props.useWorkspaces((state) => state.items);
	const sessions = props.useSessions((state) => state.byId);
	const rules = [];
	workspaces.forEach((workspace, index) => {
		let active = false;
		let unread = false;
		workspace.sessionIds.forEach((sessionId) => {
			const session = sessions[sessionId];
			if (session?.running === true) active = true;
			if (session?.completed === true) unread = true;
		});
		const row = `[role="tree"] > div:nth-child(${index + 1}) > * > [role="treeitem"] > span:first-child`;
		if (active) rules.push(`${row}{animation:dsh-workspace-status-pulse 1.6s ease-in-out infinite;transform-origin:center;color:var(--ds-accent,#4f9cff)}`);
		else if (unread) rules.push(`${row}{color:var(--ds-success,#22a06b);filter:drop-shadow(0 0 4px color-mix(in srgb,var(--ds-success,#22a06b) 55%,transparent))}`);
	});
	return (0, react.createElement)("style", { "data-dsh-workspace-status": "true" }, `${style}\n${rules.join("")}`);
}
const inject = ["slots"];
function apply(ctx) {
	ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
		name: "sidebar.footer.action",
		id: "dsh-workspace-status",
		order: 1e3
	}, WorkspaceState));
}

//#endregion
exports.apply = apply;
exports.inject = inject;
return module.exports; } });
//# sourceMappingURL=client.js.map