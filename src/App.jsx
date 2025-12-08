import './App.css';
import FamilyTreeScene from './components/FamilyTreeScene';
//import SpaceCursor from './components/SpaceCursor';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">Newton Family Tree</p>
          <h1>Visualiser la famille en 3D</h1>
          <p className="app-subtitle">
            Recréation fidèle de votre arbre généalogique avec une touche interactive et immersive.
          </p>
        </div>
      </header>
      <div className="canvas-wrapper">
        <FamilyTreeScene />
      </div>
      {/* <SpaceCursor /> */}
    </div>
  );
}

export default App;
