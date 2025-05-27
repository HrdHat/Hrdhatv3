import React from 'react';
import Sidebar from './Sidebar';
import { ActiveFormsProvider } from '../modules/forms/flra/ActiveFormsContext';

const AppShellMobile = ({ children }: { children: React.ReactNode }) => (
  <ActiveFormsProvider>
    <div>
      <Sidebar />
      <main>{children}</main>
    </div>
  </ActiveFormsProvider>
);

export default AppShellMobile; 