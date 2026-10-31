# Joe Next

基于 [Joe3](https://github.com/jiewenhuang/halo-theme-joe3.0) 重构的 [Halo](https://www.halo.run/) 2 主题。保留 Joe3 的视觉风格与功能，前端代码使用 Astro + TypeScript 重写，不再依赖 jQuery 和手动拷贝的第三方库。

> 本主题由 Joe3 衍生，已获得原作者授权。Joe3 的前身为 qinhua 的 halo-theme-joe2.0。

## 环境要求

- Halo `>= 2.22.8`
- 开发：Node.js `22.23.4`（见 `.nvmrc`）、pnpm `10`

## 开发

```bash
nvm use
pnpm install
pnpm dev        # 监听 src/ 变化并重新构建到 templates/
```

将主题目录放到 Halo 工作目录的 `themes/theme-joe-next/`，在控制台安装并启用。开发时建议关闭模板缓存：`SPRING_THYMELEAF_CACHE=false`。

| 命令                   | 作用                                                 |
| ---------------------- | ---------------------------------------------------- |
| `pnpm build`           | 构建模板并打包为 `dist/theme-joe-next-<version>.zip` |
| `pnpm build:templates` | 仅构建模板到 `templates/`（开发调试用）              |
| `pnpm check`           | TypeScript / Astro 类型检查                          |
| `pnpm test`            | 单元测试                                             |
| `pnpm qa:size`         | 首屏 CSS / JS 与主题包体积预算（CI 中运行）          |
| `pnpm qa:shots`        | 各页面明暗 × 桌面 / 手机全页截图，检查状态码和脚本错误 |
| `pnpm qa:snapshot DIR` | 计算样式快照；`pnpm qa:diff A B` 对比两次快照        |
| `pnpm qa:a11y`         | axe-core 无障碍检查（WCAG 2 A / AA）                 |

`qa:shots`、`qa:snapshot`、`qa:a11y` 需要一个启用了本主题的 Halo（默认 `http://127.0.0.1:8091`，用 `HALO_URL` 修改）和本机 Chrome；`ROUTES`、`WIDTHS` 环境变量可限定页面与宽度。重构样式时先对修改前后各拍一次快照再对比，可发现肉眼难以察觉的样式变化。

发布：在 GitHub 创建 Release 后，CD 工作流会自动构建并把主题包上传到 Release 附件。

## 目录结构

```
src/
├── pages/              页面模板，每个文件对应一个 Halo 模板（index、post、archives…）
├── layouts/            BaseLayout：head、导航、页脚、悬浮按钮、全局脚本
├── components/
│   ├── head/           配置注入、动态样式（主题色、字体、背景）
│   ├── navbar/         顶部导航与移动端抽屉
│   ├── aside/          侧栏及各侧栏组件
│   ├── blogger/        博主卡片、社交账号
│   ├── home/           首页轮播、大图、精品分类
│   ├── list/           文章列表项、分页、分类/标签网格
│   ├── post/           文章正文、分享、版权、评论
│   ├── moment/         瞬间
│   └── links/          友链
├── scripts/
│   ├── app.ts          全站脚本入口
│   ├── pages/          页面专属脚本入口
│   ├── features/       独立功能模块（明暗模式、导航、点赞、轮播…）
│   ├── content/        正文处理（代码块、目录、灯箱）
│   ├── core/           基础工具（DOM、配置、存储、提示）
│   └── effects/        鼠标/背景特效（按需加载）
├── styles/             原生 CSS（嵌套语法），按 base / components / layout / content / pages 拆分，目录即级联层
├── config/             前后端共享的配置契约与 SpEL 表达式
└── data/               社交图标、内联 SVG 等静态数据
public/assets/          运行时按路径引用的资源（头像框、鼠标皮肤、字体、默认图片）
integrations/           Astro 构建后处理（Thymeleaf 标签还原、CSS 级联层）
```

## 关键约定

**Astro 编译期 vs Thymeleaf 运行期。** `.astro` 文件在构建时展开为 HTML，`th:*` 属性原样输出，由 Halo 在请求时求值。组件的 props 只能是构建期常量，运行时数据一律通过 Thymeleaf 表达式取得。

**命名空间标签。** Astro 7 编译器不支持 `<th:block>`、`<halo:comment>`，源码中写作 `<th-block>`、`<halo-comment>`、`<halo-footer>`，构建后由 `integrations/thymeleaf-tags.ts` 还原。

**设置项默认值。** 用户首次保存主题设置前，Halo 不会写入 `settings.yaml` 中的默认值，模板读到的是 `null`。`pnpm settings:defaults` 从 `settings.yaml` 生成 `src/config/setting-defaults.ts`；构建后处理据此改写布尔设置的引用（默认开启的写成 `!= false`，默认关闭的写成 `== true`），有默认值的文本/数字设置补上 `?: 默认值`，列表设置补上默认内容的内联列表。模板中手写的 `?:` 保持不变，但必须与 `settings.yaml` 一致。修改 `settings.yaml` 后需重新生成，`pnpm test` 会校验两者一致。

**设置项命名。** 键名一律 snake_case，不带 `enable_` / `show_` 前缀，也不重复分组名（`links.title` 而非 `links.links_title`）。模板中引用的每个 `theme.config.*` 都必须在 `settings.yaml` 中存在，同样由 `pnpm test` 校验。

**避免 `__` 出现在表达式中。** Thymeleaf 把 `__x__` 视为预处理语法，BEM 类名（如 `joe_index__hot`）只能写在静态 `class` 中。

**前端配置。** 浏览器端需要的设置项在 `src/config/theme-config.ts` 中声明，服务端一次性序列化注入页面，脚本通过 `getThemeConfig()` 读取类型安全的配置。新增字段只需修改这一个文件。

**样式。** 原生 CSS 嵌套语法，无预处理器。颜色、阴影、圆角等变量在 `src/styles/base/tokens.css`，按用途命名（`--text-*`、`--bg-*`、`--border-*`、`--fill-*`）。组件的响应式规则写在组件自己的样式文件末尾，断点只用 500 / 768 / 992 / 1200 / 1360px（`max-width`）。

**级联层。** `src/styles` 的每个文件在构建时按目录放入 CSS 级联层（`integrations/css-layers.ts`），顺序为 `reset → tokens → vendor → base → components → layout → content → pages`。后面的层总是覆盖前面的层，与选择器权重无关，所以不需要用 `html` / `#Joe` 前缀或 `!important` 抬高优先级；跨文件的覆盖应写在更靠后的层里。不分层的样式优先于主题：主题设置生成的动态样式、插件样式，以及在 Halo「代码注入」里写的自定义 CSS，都能直接覆盖主题。按需加载的 Swiper / PhotoSwipe 样式放在 vendor 层。

**按需加载。** Swiper、PhotoSwipe、vConsole、鼠标/背景特效均在用到时才下载，样式通过 `loadStylesheet()` 插入，不会进入首屏 CSS。

## SEO 与 GEO

`src/components/head/Seo.astro` 是一个公共模块，放在 `BaseLayout` 的 `<head>` 里。页面在 `BaseLayout` 上声明 `seo="post"` 这样的类型；每种类型的标题、摘要、图片、地址和分页取哪些模板变量，集中写在 `src/config/seo.ts`。新增页面时声明类型即可，`pnpm test` 会检查每个页面都声明了类型。

| 设置（分组「SEO」） | 输出                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| 页面元数据          | canonical（分页列表第 2 页起指向当前页）、Open Graph、Twitter Card；文章另有 `article:*`                   |
| 结构化数据          | JSON-LD `@graph`：WebSite、博主 Person，本页的 BlogPosting / WebPage / CollectionPage / ProfilePage / ImageGallery / SocialMediaPosting，文章页加 BreadcrumbList |
| 订阅地址发现        | `<link rel="alternate">`：全站 RSS，分类 / 标签 / 作者 / 瞬间页再加各自的订阅（需要 RSS 插件）             |
| AI 训练抓取         | 选「不允许」时输出 `robots: noai, noimageai`，不影响搜索收录                                                 |

description、keywords、robots（屏蔽搜索引擎）、robots.txt、站点地图由 Halo 和插件提供，主题不重复。装了 SEO 插件时，关掉插件也提供的那一项。地址用 Halo「外部访问地址」拼成绝对地址，正式站点要填对。

## 插件集成

| 功能                        | 插件                           | 未安装时               |
| --------------------------- | ------------------------------ | ---------------------- |
| 评论                        | 评论组件 `PluginCommentWidget` | 不显示评论区           |
| 搜索                        | 搜索组件 `PluginSearchWidget`  | 隐藏搜索按钮           |
| 瞬间 `/moments`             | 瞬间 `PluginMoments`           | 路由不存在             |
| 图库 `/photos`              | 图库 `PluginPhotos`            | 路由不存在             |
| 友链 `/links`、友链页面模板 | 链接 `PluginLinks`             | 友链页面模板只显示正文 |
| 朋友圈页面模板              | 链接 `PluginLinks`（RSS 订阅） | 显示「需要链接插件」   |
| 装备 `/equipments`          | 装备管理 `plugin-equipment`    | 路由不存在             |
| 订阅地址发现（SEO）         | RSS `PluginFeed`               | 不声明订阅地址         |
| 代码高亮                    | 代码高亮 `shiki`               | 代码块无语法高亮       |

## 相对 Joe3 的变化

- **技术栈：** jQuery、Isotope、fancybox、Draggabilly、WOW.js、NProgress、Qmsg、ClipboardJS、lazysizes、Vue 2 均由原生 API 或 npm 包替代，第三方库通过 pnpm 管理并锁定版本。
- **图标：** iconfont 图标字体与 Font Awesome 改为 [Iconify](https://iconify.design/) 图标（lucide、Remix Icon、Simple Icons），构建时内联为 SVG（`src/config/icons.ts`），不加载图标字体也不请求 CDN；菜单项图标使用 Halo 的 Iconify 图标选择器。
- **评论：** 只使用 Halo 评论扩展点（评论组件插件），不再内置 Waline。
- **已移除：** 天气组件、百度收录检测、内置 Prism 代码高亮（改由 shiki 插件负责）、APlayer 音乐播放器（侧栏歌单组件）、Joe 编辑器的正文短代码（`<joe-tabs>`、`<joe-alert>`、卡片、折叠、时间线、音视频、B 站视频等，旧文章里的这些标签按普通文字显示），以及 Joe3 中未被引用的库和模板（halo-comment、KaTeX、jquery-ui 等）。
- **设置项：** 重新整理为 12 个分组，统一键名与说明文字，**与 Joe3 及 Joe Next 0.1 之前的配置不兼容**，升级后需要在后台重新设置。已删除不再生效的设置（预载图、外部资源地址、旧版自定义 CSS/JS、Waline 等）。
- **修复：** 分类/标签/作者页分页地址、年度时间轴重复、作者页标题、`page_links` 在未安装链接插件时报错等 Joe3 遗留问题。

## 许可证

[CC BY-NC-SA 4.0](./LICENSE)，与 Joe3 保持一致。
