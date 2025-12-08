import './App.css';
import FamilyTreeScene from './components/FamilyTreeScene';
//import SpaceCursor from './components/SpaceCursor';

function App() {
  return (
    <div className="app-shell">
      <div className="canvas-wrapper">
        <FamilyTreeScene />
      </div>
      {/* <SpaceCursor /> */}
    </div>
  );
}

export default App;
