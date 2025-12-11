import './App.css';
import FamilyTreeScene from './components/FamilyTreeScene';
import PageLoader from './components/PageLoader';
import NarrativeSequenceController from './components/NarrativeSequenceController';
//import SpaceCursor from './components/SpaceCursor';

function App() {
  return (
    <NarrativeSequenceController>
      <PageLoader>
        <div className="app-shell">
          <div className="canvas-wrapper">
            <FamilyTreeScene />
          </div>
          {/* <SpaceCursor /> */}
        </div>
      </PageLoader>
    </NarrativeSequenceController>
  );
}

export default App;
