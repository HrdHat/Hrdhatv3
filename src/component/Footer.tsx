import React from "react";

const Footer: React.FC = () => {
  return (
    <footer>
      <div>
        <p>&copy; {new Date().getFullYear()} Your Company Name</p>
        {/* Footer content will go here */}
      </div>
    </footer>
  );
};

export default Footer;
