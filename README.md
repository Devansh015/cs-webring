# 🔗 CS-DS Webring

A webring connecting Computer Science and Data Science blogs, personal sites, and portfolios.

## What is a Webring?

A webring is a collection of websites linked together in a circular structure. Visitors can navigate from one site to another using navigation links, discovering new content along the way!

## 🚀 Join the Webring

Want to add your site? Follow these steps:

### Requirements

- Your site must be related to Computer Science, Data Science, or related fields
- It should have original content (blog posts, projects, tutorials, etc.)
- Must be safe for work and follow our [Code of Conduct](CONTRIBUTING.md)

### How to Join

1. **Fork this repository**
2. **Edit `data/webring.json`** and add your site:
   ```json
   {
     "id": "your-site-id",
     "name": "Your Site Name",
     "url": "https://yoursite.com",
     "description": "A brief description of your site",
     "owner": "Your Name",
     "added": "YYYY-MM-DD"
   }
   ```
3. **Submit a Pull Request**
4. **Add the widget to your site** (see below)

## 🎨 Embed the Widget

Add this snippet to your website:

```html
<!-- CS-DS Webring Widget -->
<div id="cs-ds-webring"></div>
<link rel="stylesheet" href="https://your-domain.com/widget/themes.css">
<script src="https://your-domain.com/widget/webring.js"></script>
```

### Widget Themes

Choose a theme that matches your site:

- `default` - Clean, light theme
- `dark` - Dark mode friendly
- `minimal` - Borderless, adapts to your styles
- `neon` - Cyberpunk vibes
- `retro` - 90s nostalgia

```html
<script>
  new WebringWidget({ theme: 'dark' });
</script>
```

## 📁 Project Structure

```
cs-ds-webring/
├── public/              # Landing page and directory
│   ├── index.html
│   ├── styles.css
│   └── favicon.ico
├── data/
│   └── webring.json     # Source of truth for all sites
├── widget/
│   ├── webring.js       # Embeddable navigation widget
│   └── themes.css       # Widget themes
├── frontend/            # Future React app
├── scripts/
│   └── validate.js      # JSON validation script
├── README.md
├── CONTRIBUTING.md
└── .gitignore
```

## 🛠️ Development

### Validate Sites

```bash
node scripts/validate.js
```

### Local Development

Serve the `public/` directory with any static file server:

```bash
# Using Python
python -m http.server 8000 --directory public

# Using Node.js (npx)
npx serve public
```

## 📜 License

MIT License - Feel free to fork and create your own webring!

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting your site.

---

**Made with ❤️ by the CS-DS community**
