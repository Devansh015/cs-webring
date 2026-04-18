# CS Webring

A webring for Computer Science students and alumni to connect their personal sites, portfolios, and projects through one shared ring.

**Visit the Live site:** [here](https://wluring.com)

---
## Joining the Webring

1. Fork this repository
2. Add your site to `data/members.json`

Add your entry to the members array using this format:

```json
{
  "name": "Your Name",
  "year": 2027,
  "website": "https://your-site.com"
}
```
3. Submit a PR and we'll try to review it as fast as possible!

## Widget
<img width="302" height="160" alt="image" src="https://github.com/user-attachments/assets/9363e6a4-6eec-4bae-87a0-7f4ca883aa90" />


#### HTML:

```html
<div className="mb-6 flex items-center gap-2">
  <a href="https://wluring.com/go?site=https%3A%2F%2Fyour-site-here%2F&nav=prev">&#8592;</a>
  <a href="https://wluring.com/">
    <img
      src={theme === "dark" ? "https://wluring.com/icon.white.svg" : "https://wluring.com/icon.black.svg"%7D
      alt="CS Webring"
      style={{ width: 24, height: "auto", opacity: 0.8 }}
    />
  </a>
  <a href="https://wluring.com/go?site=https%3A%2F%2Fyour-site-here%2F&nav=next">&#8594;</a>
</div>
<!-- Replace 'your-site-here' with your actual site URL -->
```

#### JSX:

```jsx
<div className="mb-6 flex items-center gap-2">
  <a href="https://wluring.com/go?site=https%3A%2F%2Fyour-site-here%2F&nav=prev">←</a>
  <a href="https://wluring.com/">
    <img
      src={
        theme === "dark"
          ? "https://wluring.com/icon.white.svg"
          : "https://wluring.com/icon.black.svg"
      }
      alt="CS Webring"
      style={{ width: 24, height: "auto", opacity: 0.8 }}
    />
  </a>
  <a href="https://wluring.com/go?site=https%3A%2F%2Fyour-site-here%2F&nav=next">→</a>
</div>
// Replace 'your-site-here' with your actual site URL
```


## What is a webring?

A webring is a group of websites connected in a circle. Each member site links to the previous and next site, making it easy to discover other people in the same community.

This project brings that idea to CS students and alumni by giving everyone a simple way to link their sites together and discover others in the community.

---

## FAQ

#### _I'm not in CS. Can I still join?_

> We’re really glad you’re interested in the webring. If you’re a Laurier student outside of CS, there may be a better fit depending on your program,
> students in Data Science or other closely related computing programs are still welcome to reach out or submit a PR, and we can review those on a case-by-case basis.
>

#### _Do you accept alumni and post-grad students?_

> Yep, as long as you studied Computer Science, Data Science or are currently studying it

#### _What about minors, double degrees (ie CS BBA), etc?_

> Join up!  

If a case is unclear, it can be reviewed individually.

Inspired by UW CS Webring

---
**Authors:** Devansh Jain, Yash Soni
