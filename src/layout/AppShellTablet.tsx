import React from 'react';
import Sidebar from './Sidebar';

const AppShellTablet = ({ children }: { children: React.ReactNode }) => (
  <div>
    <Sidebar />
    <main>{children}</main>
  </div>
);

export default AppShellTablet; 