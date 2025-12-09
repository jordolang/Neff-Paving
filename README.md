# Neff Paving - Modern Paving Company Website
<!-- Deployment trigger -->

A modern, responsive website for a paving company featuring video showcases, smooth animations, and professional design.
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/jordolang/Neff-Paving?utm_source=oss&utm_medium=github&utm_campaign=jordolang%2FNeff-Paving&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)
## Features

- 🎥 **Video Integration**: Advanced video players with HLS support
- ✨ **Smooth Animations**: GSAP and AOS animations for enhanced user experience
- 📱 **Responsive Design**: Mobile-first approach with modern CSS Grid and Flexbox
- ⚡ **Fast Build**: Powered by Vite for lightning-fast development and builds
- 🎨 **Modern UI**: Clean, professional design with CSS custom properties
- 🔧 **Developer-Friendly**: Modern JavaScript (ES6+) with module system

## Project Structure

```
neff-paving/
├── src/                    # Source files
│   └── main.js            # Main JavaScript entry point
├── assets/                # Static assets
│   ├── videos/           # Video files
│   ├── images/           # Image files
│   └── fonts/            # Font files
├── styles/               # CSS stylesheets
│   └── main.css         # Main stylesheet
├── scripts/             # Additional JavaScript files
├── index.html          # Main HTML file
├── vite.config.js      # Vite configuration
├── package.json        # Node.js dependencies and scripts
└── README.md          # This file
```

## 🔀 Repository Structure

**Important**: This repository uses a structured branching strategy for safe development and deployment:

- **`deployment`** - Production code deployed to GitHub Pages
- **`main`** - Stable, tested code ready for production  
- **`development`** - Active development and new features

For development work, please use the `development` branch. See [Branching Strategy](docs/deployment/branching-strategy.md) for complete details.

## Technologies Used

### Build Tools
- **Vite** - Fast build tool and development server
- **npm** - Package manager

### Video Players
- **Plyr** - Modern HTML5 video player
- **Video.js** - HTML5 video player with HLS support
- **HLS.js** - JavaScript HLS client

### Animation Libraries
- **GSAP** - Professional animation library with ScrollTrigger
- **AOS (Animate On Scroll)** - Scroll-triggered animations
- **Framer Motion** - Production-ready motion library
- **Lottie Web** - Render After Effects animations
- **Animate.css** - CSS animation library

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v8 or higher)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd neff-paving
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests (placeholder)

### Adding Videos

1. Place video files in the `assets/videos/` directory
2. Update the video source in `src/main.js`
3. Ensure video formats are web-optimized (MP4, WebM)

### Adding Images

1. Place images in the `assets/images/` directory
2. Reference them in your HTML or CSS using `/assets/images/filename.ext`

### Customizing Styles

The main stylesheet is located at `styles/main.css`. The project uses CSS custom properties (variables) for easy theming:

```css
:root {
    --primary-color: #2c3e50;
    --secondary-color: #e74c3c;
    --accent-color: #f39c12;
    /* ... more variables */
}
```

### Adding Animations

The project includes several animation libraries:

- **GSAP**: For complex animations and scroll-triggered effects
- **AOS**: For simple scroll animations (add `data-aos="fade-up"` to elements)
- **CSS Animations**: Custom keyframe animations in the stylesheet

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with ES6 support

## Performance

- Optimized assets loading
- Lazy loading for images and videos
- Modern JavaScript bundling with Vite
- CSS minification and optimization

## License

This project is licensed under the ISC License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support and questions, please open an issue in the repository.
