import { Page, useAuth } from '@strapi/strapi/admin';
import { Routes, Route } from 'react-router-dom';

import { userIsSuperAdmin } from '../permissions';
import { HomePage } from './HomePage';

const App = () => {
  const isLoading = useAuth('AssistantApp', (state) => state.isLoading);
  const user = useAuth('AssistantApp', (state) => state.user);

  if (isLoading) {
    return <Page.Loading />;
  }

  if (!userIsSuperAdmin(user)) {
    return <Page.NoPermissions />;
  }

  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="*" element={<Page.Error />} />
    </Routes>
  );
};

export default App;
