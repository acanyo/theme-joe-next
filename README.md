# Joe Next

基于 [Joe3](https://github.com/jiewenhuang/halo-theme-joe3.0) 重构的 [Halo](https://www.halo.run/) 2 主题。保留 Joe3 的视觉风格与功能，前端代码使用 Astro + TypeScript 重写，不再依赖 jQuery 和手动拷贝的第三方库。

> 本主题由 Joe3 衍生，已获得原作者授权。Joe3 的前身为 qinhua 的 halo-theme-joe2.0。

## 环境要求

- Halo `>= 2.22.2`
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
│   ├── content/        正文处理（代码块、目录、灯箱、短代码）
│   ├── core/           基础工具（DOM、配置、存储、提示）
│   └── effects/        鼠标/背景特效（按需加载）
├── styles/             原生 CSS（嵌套语法），按 base / layout / components / content / pages 拆分
├── config/             前后端共享的配置契约与 SpEL 表达式
└── data/               社交图标、内联 SVG 等静态数据
public/assets/          运行时按路径引用的资源（头像框、鼠标皮肤、字体、默认图片）
integrations/           Astro 构建后处理
```

## 关键约定

**Astro 编译期 vs Thymeleaf 运行期。** `.astro` 文件在构建时展开为 HTML，`th:*` 属性原样输出，由 Halo 在请求时求值。组件的 props 只能是构建期常量，运行时数据一律通过 Thymeleaf 表达式取得。

**命名空间标签。** Astro 7 编译器不支持 `<th:block>`、`<halo:comment>`，源码中写作 `<th-block>`、`<halo-comment>`、`<halo-footer>`，构建后由 `integrations/thymeleaf-tags.ts` 还原。

**布尔设置项。** 未保存过的设置值为 `null`，直接参与 `and` / `or` / `!` 会抛出异常。构建后处理会把 `src/config/boolean-settings.ts` 中列出的设置项改写为 `(x == true)`。在 `settings.yaml` 新增布尔字段时，需要同步更新该列表，`pnpm test` 会校验两者一致。

**设置项命名。** 键名一律 snake_case，不带 `enable_` / `show_` 前缀，也不重复分组名（`links.title` 而非 `links.links_title`）。模板中引用的每个 `theme.config.*` 都必须在 `settings.yaml` 中存在，同样由 `pnpm test` 校验。

**避免 `__` 出现在表达式中。** Thymeleaf 把 `__x__` 视为预处理语法，BEM 类名（如 `joe_index__hot`）只能写在静态 `class` 中。

**前端配置。** 浏览器端需要的设置项在 `src/config/theme-config.ts` 中声明，服务端一次性序列化注入页面，脚本通过 `getThemeConfig()` 读取类型安全的配置。新增字段只需修改这一个文件。

**样式。** 原生 CSS 嵌套语法，无预处理器。颜色、阴影、圆角等变量在 `src/styles/base/tokens.css`，按用途命名（`--text-*`、`--bg-*`、`--border-*`、`--fill-*`）。组件的响应式规则写在组件自己的样式文件末尾，断点只用 500 / 768 / 992 / 1200 / 1360px（`max-width`）。

**按需加载。** Swiper、PhotoSwipe、APlayer、vConsole、Prism 语言包、代码主题、鼠标/背景特效均在用到时才下载，样式通过 `loadStylesheet()` 插入，不会进入首屏 CSS。

## 插件集成

| 功能                        | 插件                           | 未安装时               |
| --------------------------- | ------------------------------ | ---------------------- |
| 评论                        | 评论组件 `PluginCommentWidget` | 不显示评论区           |
| 搜索                        | 搜索组件 `PluginSearchWidget`  | 隐藏搜索按钮           |
| 瞬间 `/moments`             | 瞬间 `PluginMoments`           | 路由不存在             |
| 图库 `/photos`              | 图库 `PluginPhotos`            | 路由不存在             |
| 友链 `/links`、友链页面模板 | 链接 `PluginLinks`             | 友链页面模板只显示正文 |
| 朋友圈 `/friends`           | 朋友圈 `plugin-friends`        | 路由不存在             |
| 代码高亮                    | 可选（如 shiki）               | 使用主题内置 Prism     |

## 相对 Joe3 的变化

- **技术栈：** jQuery、Isotope、fancybox、Draggabilly、WOW.js、NProgress、Qmsg、ClipboardJS、lazysizes、Vue 2 均由原生 API 或 npm 包替代，第三方库通过 pnpm 管理并锁定版本。
- **图标字体与资源本地化：** iconfont 不再依赖 at.alicdn.com，Font Awesome 已移除（Joe3 中未实际使用）。
- **评论：** 只使用 Halo 评论扩展点（评论组件插件），不再内置 Waline。
- **已移除：** 天气组件、百度收录检测、PDF 短代码，以及 Joe3 中未被引用的库和模板（halo-comment、KaTeX、jquery-ui 等）。视频短代码改用原生 `<video>` + hls.js，不再使用 DPlayer 的 iframe 页面。
- **设置项：** 重新整理为 18 个分组，统一键名与说明文字，**与 Joe3 及 Joe Next 0.1 之前的配置不兼容**，升级后需要在后台重新设置。已删除不再生效的设置（预载图、外部资源地址、旧版自定义 CSS/JS、Waline 等）。
- **修复：** 分类/标签/作者页分页地址、年度时间轴重复、作者页标题、`page_links` 在未安装链接插件时报错等 Joe3 遗留问题。

## 许可证

[CC BY-NC-SA 4.0](./LICENSE)，与 Joe3 保持一致。
