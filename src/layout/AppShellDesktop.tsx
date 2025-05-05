import React from 'react';
import Sidebar from './Sidebar';

const AppShellDesktop = ({ children }: { children: React.ReactNode }) => (
  <div>
    <Sidebar />
    <main>{children}</main>
  </div>
);

export default AppShellDesktop; 