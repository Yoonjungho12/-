import React from "react";
import ReactDOM from "react-dom";

const MessagePortal = ({ onClose, myId, myNickname, unreadCount, setUnreadCount }) => {
  return ReactDOM.createPortal(
    <div className="portal">
      {/* Portal content */}
      <button onClick={onClose}>Close</button>
      {/* ...other content... */}
    </div>,
    document.getElementById("portal-root") // Ensure this element exists in your HTML
  );
};

export default MessagePortal;
