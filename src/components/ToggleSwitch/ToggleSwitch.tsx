import { useId } from "react";
import "./ToggleSwitch.css";

interface ToggleSwitchProps {
  label: string; //left text
  checked: boolean; //on/off state
  onChange: (next: boolean) => void; //called with the next state
  id?: string;
  disabled?: boolean;
  title?: string;
  labelWidthPx?: number; // optional fixed width for label column
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  checked,
  onChange,
  id,
  disabled,
  title,
  labelWidthPx = 110,
}) => {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="ts-row">
      <label
        htmlFor={inputId}
        className="ts-label"
        style={{ flexBasis: labelWidthPx }}
        title={title}
      >
        {label}
      </label>
      <button
        id={inputId}
        type="button"
        className={`ts-switch ${checked ? "ts-on" : "ts-off"} ${
          disabled ? "ts-disabled" : ""
        }`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span className="ts-handle" />
      </button>
    </div>
  );
};

export default ToggleSwitch;
