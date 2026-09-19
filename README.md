# dsh-workspace-status

为 DSH Web 侧边栏 workspace 图标显示会话状态.

- 活跃会话显示蓝色脉冲效果.
- 未读完成会话显示绿色静态光晕.
- 等待审核, 提权确认或用户回答时显示黄色呼吸闪烁.
- 会话有运行中或正在停止的后台任务时, 目录图标右上角叠加一个蓝色小圆点, 与上面三种状态同时成立.
- 同一个会话在会话列表行的时间左侧也显示这个蓝点.
- 状态按 workspace 的 sessionIds 归属计算.
- workspace 收起后仍保持状态效果.

## 已知限制

- 会话行没有官方槽位, 蓝点通过 DOM 注入. 从 React 行组件的 key 与 `node.id` / `result.id` 交叉确认 session id, 支持同名分叉, 改名和列表重排, 不按标题反查.
- React 挂载信息属于宿主内部结构. 无法确认组件 id 和会话快照的一致性时不标记, 防止标错行; 宿主更换行结构后需要重新验证.
- 只标记已渲染的普通非空白会话行, 搜索结果不注入蓝点. 本插件独立工作, 不依赖其他状态插件或其 DOM 标记.
- 会话活动状态未实时刷新时, 行蓝点可能滞后一帧到一次列表更新.
- 后台任务只镜像当前连接期间登记的任务, 与官方任务列表的数据源一致.

## 构建

```shell
just install
just verify
```

## 安装

将本包作为 DSH Web profile 的插件来源, 或通过 GitHub 仓库安装:

```shell
dsh plugin --profile web add azazo1/dsh-workspace-status
```
