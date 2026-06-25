# PortofolioV2-Console
pusat console portofolio v2

PortofolioV2-Console/
├── index.html              ← Login page
├── dashboard.html          ← App shell + semua halaman
├── _redirects              ← Cloudflare Pages routing
└── assets/
    ├── css/
    │   ├── base.css        ← Variables, reset, typography
    │   ├── layout.css      ← Sidebar, topbar, grid
    │   └── components.css  ← Cards, forms, buttons, modals, toast
    └── js/
        ├── supabase.js     ← Client + auth (sign in/out, CRUD, storage)
        ├── router.js       ← SPA hash routing
        ├── ui.js           ← Toast, modal, confirm, tags input, loader
        ├── image.js        ← Compress + convert WebP ≤500KB
        └── modules/
            ├── about.js    ← Edit bio & tags
            ├── slides.js   ← CRUD Education/Venture slides
            ├── skills.js   ← CRUD skills + icon picker visual
            └── projects.js ← CRUD projects + upload foto auto-compress
