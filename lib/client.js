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

//#region src/client/model.ts
/** 会占用 workspace 行提示色的交互种类; 其余种类不在目录行上呈现. */
const PENDING_KINDS = new Set([
	"approval",
	"plan-review",
	"question"
]);
/** 运行中与正在停止都算 "任务还没结束", 其余状态都已落定. */
function isLiveJob(job) {
	return job.status === "running" || job.status === "stopping";
}
/**
* 会话显示标题到会话 id 的反查表, 供会话行 DOM 标记定位使用.
*
* 空白会话行显示的是本地化文案而不是标题, 不参与反查; 同一标题落在多个
* 会话上时保留全部 id, 由使用者决定放弃标记.
* @param sessions - 会话列表快照.
*/
function titleIndex(sessions) {
	const index = /* @__PURE__ */ new Map();
	for (const [sessionId, session] of Object.entries(sessions)) {
		const title = session?.displayTitle;
		if (session === void 0 || session.blank === true || title === void 0 || title === "") continue;
		const ids = index.get(title);
		if (ids === void 0) index.set(title, [sessionId]);
		else ids.push(sessionId);
	}
	return index;
}
/**
* 有运行中或正在停止的后台任务的会话 id 集合.
* @param jobsBySession - 每个会话可见的后台任务.
*/
function sessionsWithLiveJobs(jobsBySession) {
	const ids = /* @__PURE__ */ new Set();
	for (const [sessionId, jobs] of Object.entries(jobsBySession)) if (jobs !== void 0 && jobs.some(isLiveJob)) ids.add(sessionId);
	return ids;
}
/**
* 聚合一个 workspace 的标记状态.
* @param workspace - workspace 行及其会话归属.
* @param sessions - 会话列表快照.
* @param pendingInteractions - 等待用户处理的交互快照.
* @param jobsBySession - 每个会话可见的后台任务.
* @returns 该 workspace 行需要呈现的事实.
*/
function workspaceStatus(workspace, sessions, pendingInteractions, jobsBySession) {
	const status = {
		pending: false,
		active: false,
		unread: false,
		liveJobs: 0
	};
	workspace.sessionIds.forEach((sessionId) => {
		const session = sessions[sessionId];
		if (session?.running === true) status.active = true;
		if (session?.completed === true) status.unread = true;
		const kind = pendingInteractions.get(sessionId)?.kind;
		if (kind !== void 0 && PENDING_KINDS.has(kind)) status.pending = true;
		const jobs = jobsBySession[sessionId];
		if (jobs === void 0) return;
		status.liveJobs += jobs.filter(isLiveJob).length;
	});
	return status;
}

//#endregion
//#region src/client/rows.ts
/**
* 会话行标记: 会话列表行没有官方槽位, 只能在 DOM 上注入.
*
* 行上没有会话 id, 唯一可用的对应关系是显示标题, 因此标题重复的会话一律
* 不标记: 宁可漏, 不可错. 标记元素由本模块自己插入与移除, 走 data-owner
* 属性自我标识, 不触碰 React 管理的子节点内容.
*/
/** 标记元素的 data-owner 值, 同时也是样式表的定位锚点. */
const MARKER_OWNER = "dsh-workspace-status";
/**
* 会话行选择器. 会话行是树里的 `div[role="treeitem"]`, 搜索结果是同 role
* 的 button, 且布局不同, 因此只认 div.
*/
const ROW_SELECTOR = `div[role="treeitem"][aria-selected]`;
/** 行直属的标记元素, 用来判断这一行当前是否已经标记过. */
const MARKER_SELECTOR = `:scope > [data-owner="${MARKER_OWNER}"]`;
/**
* 在行内定位承载标题的元素.
*
* 标题元素的类名带构建期哈希, 不能按类名找; 按文本匹配则只认完全等于某个
* 已知标题的 span, 命中不了就放弃这一行.
*/
function findTitleElement(row, byTitle) {
	const spans = row.querySelectorAll("span");
	for (const span of spans) {
		const text = span.textContent?.trim() ?? "";
		if (text === "") continue;
		const ids = byTitle.get(text);
		if (ids === void 0) continue;
		if (ids.length !== 1) return void 0;
		return {
			element: span,
			sessionId: ids[0]
		};
	}
}
/** 移除全部标记元素. */
function removeMarkers() {
	for (const marker of document.querySelectorAll(`[data-owner="${MARKER_OWNER}"]`)) marker.remove();
}
/**
* 使页面上的标记与快照一致.
* @param snapshot - 标题反查表与有后台任务的会话集合.
*/
function sync(snapshot) {
	if (snapshot.liveJobSessions.size === 0) {
		removeMarkers();
		return;
	}
	for (const row of document.querySelectorAll(ROW_SELECTOR)) {
		const existing = row.querySelector(MARKER_SELECTOR);
		const resolved = findTitleElement(row, snapshot.byTitle);
		const needed = resolved !== void 0 && snapshot.liveJobSessions.has(resolved.sessionId);
		if (needed && existing === null) {
			const marker = document.createElement("span");
			marker.setAttribute("data-owner", MARKER_OWNER);
			marker.setAttribute("aria-hidden", "true");
			resolved.element.after(marker);
		} else if (!needed && existing !== null) existing.remove();
	}
}
/**
* 安装会话行标记: 观察 DOM 变化并按快照对齐.
*
* 标记只在真的需要插入或移除时改动 DOM, 因此一次变更触发的那一轮重算会
* 立即收敛, 不会自我激励成逐帧循环.
* @param source - 读取当前快照的函数, 供观察回调按需取值.
*/
function installRowMarkers(source) {
	let frame = 0;
	const schedule = () => {
		if (frame !== 0) return;
		frame = requestAnimationFrame(() => {
			frame = 0;
			sync(source());
		});
	};
	const observer = new MutationObserver(schedule);
	if (document.body !== null) observer.observe(document.body, {
		childList: true,
		subtree: true
	});
	schedule();
	return {
		update: schedule,
		dispose: () => {
			observer.disconnect();
			if (frame !== 0) cancelAnimationFrame(frame);
			frame = 0;
			removeMarkers();
		}
	};
}

//#endregion
//#region src/client/style.ts
/**
* workspace 分组行的选择器基元.
*
* 会话行同样是树里的 treeitem, 也挂在同一个分组 section 之下, 所以只靠
* 首个 span 里有没有 svg 是区分不开的: 会话行首个 span 的状态指示器同样是
* svg. 分组行是树里唯一带 aria-expanded 的行, 用它把会话行和平铺列表排除掉.
*/
const GROUP_ROW = "div[role=\"treeitem\"][aria-expanded]";
/** 与 workspace 树结构绑定的常量样式: 动画定义与按会话行状态推导的兜底. */
const BASE_STYLE = `
@keyframes dsh-workspace-status-pulse {
  0%, 100% { color: var(--ds-accent, #4f9cff); filter: drop-shadow(0 0 0 transparent); transform: scale(1); }
  50% { color: color-mix(in srgb, var(--ds-accent, #4f9cff) 72%, white); filter: drop-shadow(0 0 5px currentColor); transform: scale(1.14); }
}

@keyframes dsh-workspace-status-pending {
  0%, 100% { opacity: 0.68; filter: drop-shadow(0 0 1px currentColor); transform: scale(1); }
  50% { opacity: 1; filter: drop-shadow(0 0 6px currentColor); transform: scale(1.08); }
}

[role="tree"] > div:has([data-state="warning"]) > * > ${GROUP_ROW} > span:first-child {
  color: var(--ds-warning, #d99a22);
  animation: dsh-workspace-status-pending 2s ease-in-out infinite;
  transform-origin: center;
}

[role="tree"] > div:has([data-state="warning"]) > * > ${GROUP_ROW} > span:first-child svg {
  color: var(--ds-warning, #d99a22);
}

[role="tree"] > div:has([data-state="ongoing"]) > * > ${GROUP_ROW} > span:first-child {
  animation: dsh-workspace-status-pulse 1.6s ease-in-out infinite;
  transform-origin: center;
}

[role="tree"] > div:has([data-state="ongoing"]) > * > ${GROUP_ROW} > span:first-child svg {
  color: var(--ds-accent, #4f9cff);
}

[role="tree"] > div:has([data-state="done"]):not(:has([data-state="ongoing"])) > * > ${GROUP_ROW} > span:first-child {
  color: var(--ds-success, #22a06b);
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--ds-success, #22a06b) 55%, transparent));
}

/* 会话行的后台任务蓝点: 行内标题占满剩余宽度, 所以这个 flex item 自然落在
   时间左侧, 与行首的状态点互不干扰. */
[data-owner="${MARKER_OWNER}"] {
  flex: none;
  width: 6px;
  height: 6px;
  margin-right: 6px;
  border-radius: 50%;
  background: var(--dsw-static-deepseek-450, #4f9cff);
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  [role="tree"] > div:has([data-state="warning"]) > * > ${GROUP_ROW} > span:first-child,
  [role="tree"] > div:has([data-state="ongoing"]) > * > ${GROUP_ROW} > span:first-child {
    animation: none;
    filter: none;
    transform: none;
  }
}
`;
/**
* 后台任务角标: 目录图标右上角的小圆点, 与三种行状态并存.
* 图标槽从行内边距 8px 开始, 宽 16px; 行高 34px 中图标高 20px, 因此
* 图标右上角落在 (24px, 7px), 圆点向左上各留 1px 到 2px 压住它的边缘.
* 挂在目录行而非图标槽上, 这样悬停切换文件夹与展开箭头时角标不会消失.
*/
const JOBS_BADGE = `content:'';position:absolute;left:19px;top:5px;width:6px;height:6px;border-radius:50%;background:var(--dsw-static-deepseek-450,#4f9cff);pointer-events:none`;
/**
* 第 index 个 workspace 分组行的选择器.
*
* 分组行被 HoverCard 的 span 包了一层, 因此比叶子会话行多一级; 行本身只认
* {@link GROUP_ROW}, 免得第 index 条会话行被当成分组行.
* @param index - workspace 在列表快照中的下标, 与树中分组行的顺序一致.
*/
function rowSelector(index) {
	return `[role="tree"] > div:nth-child(${index + 1}) > * > ${GROUP_ROW}`;
}
/**
* 一个 workspace 分组行需要追加的规则: 行状态取 pending, active, unread 中
* 优先级最高者, 后台任务角标独立叠加.
* @param index - workspace 在列表快照中的下标.
* @param status - 该 workspace 推导出的状态.
* @returns 该分组行的 CSS 规则文本, 无状态时为空串.
*/
function workspaceRules(index, status) {
	const row = rowSelector(index);
	const icon = `${row} > span:first-child`;
	const rules = [];
	if (status.pending) rules.push(`${icon}{color:var(--ds-warning,#d99a22);animation:dsh-workspace-status-pending 2s ease-in-out infinite;transform-origin:center}`);
	else if (status.active) rules.push(`${icon}{animation:dsh-workspace-status-pulse 1.6s ease-in-out infinite;transform-origin:center;color:var(--ds-accent,#4f9cff)}`);
	else if (status.unread) rules.push(`${icon}{color:var(--ds-success,#22a06b);filter:drop-shadow(0 0 4px color-mix(in srgb,var(--ds-success,#22a06b) 55%,transparent))}`);
	if (status.liveJobs > 0) {
		rules.push(`${row}{position:relative}`);
		rules.push(`${row}::after{${JOBS_BADGE}}`);
	}
	return rules.join("");
}
/**
* 组装完整的注入样式表.
* @param statuses - 按 workspace 列表顺序排列的状态.
*/
function styleSheet(statuses) {
	return `${BASE_STYLE}${statuses.map((status, index) => workspaceRules(index, status)).join("")}`;
}

//#endregion
//#region src/client/index.ts
/** 空快照: 尚未拿到列表数据时按 "没有后台任务" 处理. */
function emptySnapshot() {
	return {
		byTitle: /* @__PURE__ */ new Map(),
		liveJobSessions: /* @__PURE__ */ new Set()
	};
}
function WorkspaceState(props) {
	const workspaces = props.useWorkspaces((state) => state.items);
	const sessions = props.useSessions((state) => state.byId);
	const jobsBySession = props.useSessions((state) => state.jobsBySession);
	const pendingInteractions = props.useSessionPendingInteraction((state) => state);
	const statuses = workspaces.map((workspace) => workspaceStatus(workspace, sessions, pendingInteractions, jobsBySession));
	const byTitle = (0, react.useMemo)(() => titleIndex(sessions), [sessions]);
	const liveJobSessions = (0, react.useMemo)(() => sessionsWithLiveJobs(jobsBySession), [jobsBySession]);
	const snapshotRef = (0, react.useRef)(emptySnapshot());
	snapshotRef.current = {
		byTitle,
		liveJobSessions
	};
	const markersRef = (0, react.useRef)(null);
	(0, react.useEffect)(() => {
		const markers = installRowMarkers(() => snapshotRef.current);
		markersRef.current = markers;
		return () => {
			markersRef.current = null;
			markers.dispose();
		};
	}, []);
	(0, react.useEffect)(() => {
		markersRef.current?.update();
	}, [byTitle, liveJobSessions]);
	return (0, react.createElement)("style", { "data-dsh-workspace-status": "true" }, styleSheet(statuses));
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