import { useMemo, useState } from "react";
import "./QueryFields.css";
import InputForm from "../InputForm/InputForm";
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";
import InfoIcon from "../../assets/info-solid-full.svg";
import ActionButtonsBlock from "../ActionButtonsBlock/ActionButtonsBlock";
import { buildGmailQuery } from "../../helpers/queryBuilder";

export default function QueryFields() {
  //Input Fields
  const [subject, setSubject] = useState<string>("");
  const [fromAdd, setFromAdd] = useState<string>("");
  const [olderThan, setOlderThan] = useState<string>("30");

  //Toggle Switches
  const [excludeStarred, setExcludeStarred] = useState<boolean>(true);
  const [excludeImportant, setExcludeImportant] = useState<boolean>(true);

  // Build Gmail query string
  const query = useMemo(() => {
    return buildGmailQuery({
      subject,
      from: fromAdd,
      olderThanDays: Number(olderThan) || undefined,
      excludeStarred,
      excludeImportant,
    });
  }, [subject, fromAdd, olderThan, excludeStarred, excludeImportant]);

  return (
    <div className="query_fields">
      <div className="input-fields">
        <InputForm
          label="Subject"
          value={subject}
          onChange={setSubject}
          placeholder='"promo" OR "newsletter"'
        />
        <InputForm
          label="From"
          type="email"
          value={fromAdd}
          onChange={setFromAdd}
          placeholder="@company.com OR Sender"
        />
        <InputForm
          label="Older Than"
          type="number"
          value={olderThan}
          onChange={setOlderThan}
          min={0}
          step={1}
          suffix="days"
        />
      </div>

      <div className="toggle-switches">
        <ToggleSwitch
          label="Include Starred"
          checked={excludeStarred}
          onChange={setExcludeStarred}
          title=" When ON - excludes starred"
        />
        <ToggleSwitch
          label="Include Important"
          checked={excludeImportant}
          onChange={setExcludeImportant}
          title=" When ON - excludes important"
        />
      </div>

      {/* <p className="query-display" style={{ fontSize: 12, color: "#666" }}>
        Build query: <code>{query || "(waiting for inputs...)"}</code>
      </p> */}

      <div className="info-card">
        <img src={InfoIcon} className="info-icon" />
        <p className="info-msg">
          Click Preview to see emails retrieved. Click Trash when ready
        </p>
      </div>
      <ActionButtonsBlock query={query}></ActionButtonsBlock>
    </div>
  );
}
