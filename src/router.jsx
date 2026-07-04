import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import TimetablePage from './pages/TimetablePage';
import FavoritesPage from './pages/FavoritesPage';
import MapPage from './pages/MapPage';
import GuidePage from './pages/GuidePage';

export const routes = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/timetable" replace />,
      },
      {
        path: 'timetable',
        element: <TimetablePage />,
      },
      {
        path: 'favorites',
        element: <FavoritesPage />,
      },
      {
        path: 'map',
        element: <MapPage />,
      },
      {
        path: 'guide',
        element: <GuidePage />,
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
