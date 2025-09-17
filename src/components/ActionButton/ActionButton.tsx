import "./ActionButton.css";

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger"; //default = preview, danger = trash
}

const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onClick,
  disabled = false,
  variant = "default",
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`actbtn ${
        variant === "danger" ? "actbtn-danger" : "actbtn-default"
      }`}
    >
      {label}
    </button>
  );
};

export default ActionButton;
