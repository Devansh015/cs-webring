# Contributing to CS-DS Webring

Thank you for your interest in joining the CS-DS Webring! 🎉

## 📋 Submission Rules

### Site Requirements

1. **Relevant Content**: Your site must be related to Computer Science, Data Science, programming, or related technical fields.

2. **Original Content**: Your site should have original content such as:
   - Blog posts
   - Tutorials
   - Project showcases
   - Research papers
   - Technical documentation

3. **Active Site**: Your site should be actively maintained (updated within the last 6 months).

4. **Safe for Work**: No adult content, hate speech, or illegal content.

5. **Working URL**: Your site must be accessible and not behind a paywall.

### Technical Requirements

1. **HTTPS**: Your site should use HTTPS (strongly recommended).

2. **Widget Placement**: You must add the webring widget to your site in a visible location.

3. **No Broken Links**: Ensure your site doesn't have excessive broken links.

## 🚀 How to Submit

### Step 1: Fork the Repository

Click the "Fork" button on GitHub to create your own copy.

### Step 2: Add Your Site

Edit `data/webring.json` and add your entry at the end of the `sites` array:

```json
{
  "id": "your-unique-id",
  "name": "Your Site Name",
  "url": "https://yoursite.com",
  "description": "Brief description (max 200 chars)",
  "owner": "Your Name",
  "added": "2026-01-28"
}
```

**Field Guidelines:**
- `id`: Lowercase, alphanumeric with hyphens only (e.g., `johns-tech-blog`)
- `name`: Your site's display name
- `url`: Full URL including `https://`
- `description`: Keep it under 200 characters
- `owner`: Your name or handle
- `added`: Today's date in YYYY-MM-DD format

### Step 3: Validate Your Entry

Run the validation script to check for errors:

```bash
node scripts/validate.js
```

### Step 4: Submit a Pull Request

1. Commit your changes with a clear message: `Add [Your Site Name] to webring`
2. Push to your fork
3. Open a Pull Request to the main repository
4. Fill out the PR template (if provided)

### Step 5: Add the Widget

After your PR is merged, add the widget to your site:

```html
<div id="cs-ds-webring"></div>
<link rel="stylesheet" href="https://your-domain.com/widget/themes.css">
<script src="https://your-domain.com/widget/webring.js"></script>
```

## ✏️ Updating Your Entry

To update your site information:

1. Fork (or update your existing fork)
2. Edit your entry in `data/webring.json`
3. Submit a Pull Request with the changes

## 🗑️ Removing Your Site

If you want to leave the webring:

1. Submit a PR removing your entry from `data/webring.json`
2. Remove the widget from your site

## 🚫 Grounds for Removal

Sites may be removed for:

- Becoming inactive for over 12 months
- Removing the webring widget
- Adding inappropriate content
- Domain expiration
- Violating our Code of Conduct

## 💬 Questions?

Open an issue on GitHub if you have any questions or concerns.

---

**Happy linking! 🔗**
