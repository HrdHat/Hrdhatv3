import React from 'react';
import Sidebar from './Sidebar';

const AppShellMobile = ({ children }: { children: React.ReactNode }) => (
  <div>
    <Sidebar />
    <main>{children}</main>
  </div>
);

export default AppShellMobile; 