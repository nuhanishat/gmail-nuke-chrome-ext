import "./App.css";
import QueryFields from "./components/QueryFields/QueryFields";
import GmailIcon from "./assets/nuke-icon.svg";

function App() {
  return (
    <>
      <div className="popup">
        <div className="app-name">
          <img className="app-icon" src={GmailIcon} />
          <h3 className="app-heading"> GMail Nuke</h3>
        </div>
        <QueryFields></QueryFields>
      </div>
    </>
  );
}

export default App;
