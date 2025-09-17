import type { EmailPreview } from "../../types";
import "./EmailCard.css";

interface EmailCardProps {
  item: EmailPreview;
}

const EmailCard: React.FC<EmailCardProps> = ({ item }) => {
  return (
    <div className="email-card">
      <div className="email-row">
        <span className="email-label">From:</span>
        <span className="email-value">{item.from}</span>
      </div>
      <div className="email-row">
        <span className="email-label">To:</span>
        <span className="email-value">{item.to}</span>
      </div>
      <div className="email-row">
        <span className="email-label">Date:</span>
        <span className="email-value">{item.date}</span>
      </div>
      <div className="email-subject"> {item.subject}</div>
      {/* <div className="email-id"> ID: {item.id}</div> */}
    </div>
  );
};

export default EmailCard;
