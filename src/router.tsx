import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import HomePage from './pages/HomePage';
import TestListPage from './pages/TestListPage';
import TestModeSelector from './pages/TestModeSelector';
import TestSinglePage from './pages/TestSinglePage';
import TestInstantPage from './pages/TestInstantPage';
import TestResultsPage from './pages/TestResultsPage';
import TestCreatePage from './pages/TestCreatePage';
import TestEditPage from './pages/TestEditPage';
import ManageGroupsPage from './pages/ManageGroupsPage';
import ManageDifficultyPage from './pages/ManageDifficultyPage';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'tests', element: <TestListPage /> },
        { path: 'test/:id/mode', element: <TestModeSelector /> },
        { path: 'test/:id', element: <TestSinglePage /> },
        { path: 'test/:id/instant', element: <TestInstantPage /> },
        { path: 'test/:id/results', element: <TestResultsPage /> },
        { path: 'create', element: <TestCreatePage /> },
        { path: 'test/:id/edit', element: <TestEditPage /> },
        { path: 'manage/groups', element: <ManageGroupsPage /> },
        { path: 'manage/difficulty', element: <ManageDifficultyPage /> },
      ],
    },
  ]
);
