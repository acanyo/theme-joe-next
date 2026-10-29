// 由 scripts/settings-defaults.ts 根据 settings.yaml 生成，请勿手动修改（pnpm settings:defaults）

/** 布尔设置项及其默认值（true = 默认开启） */
export const BOOLEAN_DEFAULTS: Readonly<Record<string, boolean>> = {
  "aside.enabled": true,
  "aside.on_archives": true,
  "aside.on_categories": true,
  "aside.on_friends": true,
  "aside.on_links": true,
  "aside.on_moments": true,
  "aside.on_page": true,
  "aside.on_photos": true,
  "aside.on_post": true,
  "aside.on_tags": true,
  "blogger.daily_quote": false,
  "blogger.enabled": true,
  "blogger.level": false,
  "blogger.ribbons": false,
  "blogger.social": false,
  "blogger.social_mobile": false,
  "code.collapsible": false,
  "code.copy": false,
  "code.fold_long": false,
  "code.inline_select": false,
  "code.line_numbers": false,
  "code.mac_dots": false,
  "code.title": false,
  "code.title_divider": false,
  "code.tools_on_hover": false,
  "code.wrap": false,
  "effects.back_to_top": false,
  "effects.back_to_top_smooth": false,
  "effects.context_menu": false,
  "effects.list_animation": false,
  "effects.loading_bar": false,
  "effects.offscreen_title": false,
  "effects.reveal": false,
  "effects.swup": true,
  "effects.swup_preload": true,
  "footer.anniversary": false,
  "footer.busuanzi": false,
  "footer.clean_mode": false,
  "footer.console_banner": false,
  "footer.console_timing": false,
  "footer.debug": false,
  "footer.enabled": true,
  "footer.full_width": false,
  "footer.icp": false,
  "footer.nav": false,
  "footer.nav_social": true,
  "footer.police": false,
  "footer.powered_by": true,
  "footer.rss": false,
  "footer.sitemap": false,
  "footer.uptime": false,
  "home.card_commenters": true,
  "home.carousel": false,
  "home.carousel_arrows": false,
  "home.carousel_autoplay": false,
  "home.carousel_dots": false,
  "home.carousel_draggable": false,
  "home.carousel_loop": false,
  "home.category_tabs": true,
  "home.compact_mobile": true,
  "home.featured": false,
  "home.featured_more": false,
  "home.freshness_badge": true,
  "home.hero": false,
  "home.hero_hitokoto": false,
  "home.infinite_scroll": false,
  "home.load_more": false,
  "home.moments_stack": false,
  "home.random_thumbnail": false,
  "home.resume_bar": true,
  "home.thumbnail": false,
  "navbar.active_glow": false,
  "navbar.console": true,
  "navbar.full_width": false,
  "navbar.glass": false,
  "navbar.icon_animation": false,
  "navbar.icons": false,
  "navbar.login": false,
  "navbar.sticky": false,
  "pages.archives_categories": false,
  "pages.categories_count": false,
  "pages.feed_subscribe": false,
  "pages.guestbook_source": true,
  "pages.links_comments": false,
  "pages.links_random": false,
  "pages.moments_comments": false,
  "pages.moments_compose_button": false,
  "pages.moments_like": false,
  "pages.tags_count": false,
  "post.comments": true,
  "post.copy_notice": false,
  "post.copyable": false,
  "post.edit_button": false,
  "post.indent": false,
  "post.like": true,
  "post.meta": false,
  "post.outdated_format": true,
  "post.outdated_notice": false,
  "post.progress": true,
  "post.related": true,
  "post.title_shadow": false,
  "post.toc": true,
  "post.toc_mobile": true,
  "share.donate": false,
  "share.enabled": true,
  "share.link": true,
  "share.qq": true,
  "share.qzone": true,
  "share.wechat": true,
  "share.weibo": true
};

/** 非布尔设置项中有默认值的项（文本 / 数字 / 选项） */
export const VALUE_DEFAULTS: Readonly<Record<string, string | number>> = {
  "appearance.accent_dark": "#9999ff",
  "appearance.accent_light": "#fb6c28",
  "appearance.color_mode": "user",
  "appearance.content_width": 1320,
  "appearance.light_hours": "5:00~19:00",
  "appearance.scrollbar_width": 8,
  "aside.latest_count": 5,
  "aside.popular_count": 5,
  "aside.position": "right",
  "aside.recent_days": 30,
  "blogger.avatar_frame": "0",
  "blogger.avatar_pendant": "0",
  "blogger.avatar_shape": "circle",
  "blogger.fallback_avatar": "/themes/theme-joe-next/assets/images/peeps-avatar.png",
  "blogger.motto": "行动起来，活在当下",
  "blogger.social_source": "builtin",
  "blogger.stats": "category-post-comment",
  "blogger.text_avatar": "{bgColor:'',textColor:'',useTextGradient:false}",
  "code.fold_height": 800,
  "effects.backdrop": "off",
  "effects.cursor_effect": "off",
  "effects.cursor_skin": "off",
  "effects.list_animation_name": "fadeInUp",
  "effects.loading_bar_height": 3,
  "effects.offscreen_title_back": "(つェ⊂)咦，又回来了!",
  "effects.offscreen_title_leave": "歪，你去哪里了？",
  "effects.page_animation": "slide",
  "footer.anniversary_label": "十年之约",
  "footer.anniversary_years": 10,
  "footer.cloud": "none",
  "footer.position": "none",
  "footer.since": "2021/11/11 06:30",
  "home.carousel_direction": "horizontal",
  "home.carousel_effect": "slide",
  "home.carousel_interval": 3500,
  "home.carousel_speed": 500,
  "home.category_tabs_count": 5,
  "home.default_thumbnail": "https://picsum.photos/id/1081/350/200",
  "home.fallback_thumbnail": "/themes/theme-joe-next/assets/images/default_thumbnail.png",
  "home.featured_title": "精选推荐",
  "home.hero_image": "http://imgapi.xl0408.top/index.php",
  "home.hero_wave_dark": "#fff",
  "home.hero_wave_light": "#fff",
  "home.list_layout": "list",
  "home.list_sort": "published",
  "home.moments_stack_count": 4,
  "home.qq_group_text": "欢迎加入QQ交流群",
  "home.random_thumbnail_api": "https://imgapi.xl0408.top/index.php",
  "navbar.logo_radius": 4,
  "navbar.style": "islands",
  "pages.archives_empty": "暂无文章数据",
  "pages.archives_group_by": "month",
  "pages.archives_style": "timeline",
  "pages.archives_title": "文章归档",
  "pages.categories_style": "card",
  "pages.categories_title": "全部分类",
  "pages.feed_title": "朋友圈",
  "pages.links_fallback_logo": "/themes/theme-joe-next/assets/images/default_links_logo.png",
  "pages.links_group_order": "created_asc",
  "pages.links_link_order": "created_asc",
  "pages.links_title": "友情链接",
  "pages.moments_empty": "暂无动态",
  "pages.moments_max_height": 300,
  "pages.moments_title": "我的动态",
  "pages.photos_gap": 10,
  "pages.photos_title": "我的图库",
  "pages.tags_style": "card",
  "pages.tags_title": "全部标签",
  "post.ads_aside": "none",
  "post.ads_bottom": "none",
  "post.ads_top": "none",
  "post.header_style": "immersive",
  "post.image_align": "center",
  "post.image_max_width": "100%",
  "post.outdated_days": 30,
  "post.related_count": 5,
  "post.toc_depth": 0
};

/** 列表类设置项（重复器）的默认内容，模板中以 SpEL 内联列表写出 */
export const LIST_DEFAULTS: Readonly<Record<string, readonly unknown[]>> = {
  "aside.widgets": [
    {
      "type": "blogger",
      "notice": {
        "title": null,
        "html": null
      },
      "donate": {
        "items": null
      },
      "image": {
        "url": null,
        "title": null,
        "description": null
      },
      "comments": {
        "count": null
      },
      "tags": {
        "style": null,
        "limit": null,
        "count": null,
        "width": null
      },
      "categories": {
        "style": null,
        "limit": null,
        "count": null,
        "width": null
      },
      "ad": {
        "kind": null,
        "image": null,
        "url": null,
        "html": null
      },
      "custom": {
        "html": null
      }
    },
    {
      "type": "latest",
      "notice": {
        "title": null,
        "html": null
      },
      "donate": {
        "items": null
      },
      "image": {
        "url": null,
        "title": null,
        "description": null
      },
      "comments": {
        "count": null
      },
      "tags": {
        "style": null,
        "limit": null,
        "count": null,
        "width": null
      },
      "categories": {
        "style": null,
        "limit": null,
        "count": null,
        "width": null
      },
      "ad": {
        "kind": null,
        "image": null,
        "url": null,
        "html": null
      },
      "custom": {
        "html": null
      }
    },
    {
      "type": "tags",
      "notice": {
        "title": null,
        "html": null
      },
      "donate": {
        "items": null
      },
      "image": {
        "url": null,
        "title": null,
        "description": null
      },
      "comments": {
        "count": null
      },
      "tags": {
        "style": "3d",
        "limit": "num",
        "count": "15",
        "width": null
      },
      "categories": {
        "style": null,
        "limit": null,
        "count": null,
        "width": null
      },
      "ad": {
        "kind": null,
        "image": null,
        "url": null,
        "html": null
      },
      "custom": {
        "html": null
      }
    }
  ]
};
