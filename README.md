# Header 3D - Family Tree Visualization

An interactive 3D visualization of a family tree built with React Three Fiber. The project displays family members as stylized 3D cards with visual connections and immersive interactive effects.

## 🎨 Features

- **Interactive 3D cards**: Every family member appears on a rounded card
- **Custom design**: Dynamically generated textures include
  - Generation badge
  - Gender icon (male/female)
  - Personal info (first name, last name, birth date)
- **Visual effects**:
  - Highlight and scale on hover
  - Back face color-coded by gender
  - Drop shadows for depth
- **Relationship links**: Visual connectors between family members
- **Heart badge**: Decorative 3D element symbolizing relationships
- **Interactive controls**: Camera navigation with OrbitControls (rotate, zoom)

## 🛠️ Tech Stack

- **React 19** – UI library
- **Vite** – Build tool and dev server
- **Three.js** – 3D engine
- **@react-three/fiber** – React renderer for Three.js
- **@react-three/drei** – Utilities and helpers for React Three Fiber

## 📦 Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── FamilyTreeScene.jsx  # Main 3D scene
│   ├── PersonCard.jsx        # Card component
│   ├── RelationshipLink.jsx  # Visual connector
│   └── HeartBadge.jsx        # Decorative heart badge
├── constants/
│   └── layout.js             # Configuration constants (dimensions, camera)
├── data/
│   └── family.js             # Family data
├── App.jsx                   # Root component
└── main.jsx                  # Entry point
```

## 🎯 Usage

Family data lives in `src/data/family.js`. Each person needs:
- `id`: Unique identifier
- `firstName`: Given name
- `lastName`: Family name
- `birthDate`: Birth date (string)
- `gender`: `'male'` or `'female'`
- `generation`: Generation number
- `position`: 3D coordinates `[x, y, z]`

Relationship links are defined in the same file with references to person IDs.

## 🎨 Customization

### Colors

Colors live in `PersonCard.jsx`:
- **Generations**: `generationColors` object
- **Gender**: `genderPalette` object (male/female colors)

### Dimensions

Card dimensions and camera settings are defined in `src/constants/layout.js`.

## 📝 Available Scripts

- `npm run dev` – Start the development server
- `npm run build` – Create a production build
- `npm run preview` – Preview the production build
- `npm run lint` – Run ESLint

## 🚀 Deployment

Deploy the project to any static React hosting platform:
- Vercel
- Netlify
- GitHub Pages
- etc.

After building (`npm run build`), the static files are available in `dist/`.
