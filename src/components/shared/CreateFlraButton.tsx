import React from 'react';

interface CreateFlraButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const CreateFlraButton: React.FC<CreateFlraButtonProps> = ({ children, ...props }) => (
  <button {...props}>{children}</button>
);

export default CreateFlraButton; 