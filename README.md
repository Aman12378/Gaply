# 🎯 Gaply — Find the gap. Build the skill.

> **Gaply** is an intelligent, responsive web platform that matches your tech profile against job descriptions, uncovers missing skill gaps, visualizes category coverage, and optimizes ATS resume keywords.

![Gaply Logo](images/logo_img.png)

---

## ✨ Features

- 🚀 **Interactive Single Page Application (SPA)**: Includes an engaging Landing Page hero, 4-stat metrics counter, 6-tool suite overview, 3-step workflow, and instant view switching.
- 📝 **Context-Aware Skill Extraction**: Automatically identifies coding languages, tooling frameworks, core computer science concepts, and soft skills with sentiment tags (**Must-Have** vs **Nice-to-Have**).
- 📊 **Dynamic Match Score & Category Breakdown**: Calculates an overall match percentage gauge along with category coverage bars (Languages, Tooling, Concepts, Soft Skills).
- 📄 **Dual-View Resume Preview**: Upload your resume (`.pdf` or `.txt`) to preview visual layout and clean extracted skills with automated PDF syntax cleaning.
- ⚖️ **Role Comparison Tool**: Compare two job descriptions side-by-side to highlight shared requirements and unique skill demands.
- 📜 **Analysis History**: Save past job analysis reports locally to track your skill growth over time.
- 🌗 **Responsive Light / Dark Themes**: Designed with modern typography (**Space Grotesk** for logo/titles, **Inter** for body/taglines) and fluid mobile drawer navigation.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Vanilla Design System with CSS variables)
- **Logic**: ES6+ JavaScript (Modular architecture, LocalStorage integration)
- **PDF Extraction**: PDF.js (`pdf.worker.js`)
- **Typography**: Space Grotesk 700 & Inter 400/500/600/700 via Google Fonts

---

## 🚀 Quick Start (Run Locally)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/YOUR_GITHUB_USERNAME/gaply.git
   ```
2. Navigate to the project directory:
   ```bash
   cd gaply
   ```
3. Open `index.html` directly in your web browser, or serve using any HTTP server:
   ```bash
   python -m http.server 8000
   ```
4. Visit `http://localhost:8000` in your browser.

---

## 🌐 Free Online Deployment

Deploy Gaply online for free using **GitHub Pages** or **Netlify**:

### GitHub Pages Deployment:
1. Push this repository to GitHub.
2. Go to **Settings** $\rightarrow$ **Pages**.
3. Under **Branch**, select `main` and click **Save**.
4. Your site will be live at `https://YOUR_GITHUB_USERNAME.github.io/gaply/`

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
