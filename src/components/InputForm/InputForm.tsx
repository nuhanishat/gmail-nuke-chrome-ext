import React, { useId } from "react";
import "./InputForm.css";

type InputType = "text" | "email" | "number";

interface InputFormProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: InputType;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  suffix?: React.ReactNode;
  title?: string;
  width?: string;
}

const InputForm: React.FC<InputFormProps> = ({
  label,
  value,
  onChange,
  type = "text",
  id,
  placeholder,
  disabled,
  required,
  min,
  max,
  step,
  suffix,
  title,
  width,
}) => {
  const autoId = useId(); //auto generates unique ID for resusable components
  const inputId = id ?? autoId; //set to autoId if id not passed in

  return (
    <div className="if-row">
      <label htmlFor={inputId} className="if-label" title={title}>
        {label}
        {required ? (
          <span className="if-req" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      <div className="if-inputWrap" style={width ? { width } : undefined}>
        <input
          id={inputId}
          className="if-input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          {...(type === "number"
            ? { inputMode: "numeric", min, max, step }
            : {})}
          //aria-hidden={label}
        />
        {suffix ? <span className="if-suffix">{suffix}</span> : null}
      </div>
    </div>
  );
};

export default InputForm;
