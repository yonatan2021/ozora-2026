import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { lazy } from 'react';

const TimetablePage = lazy(() => import('./pages/TimetablePage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const GuidePage = lazy(() => import('./pages/GuidePage'));

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

const base = import.meta.env.BASE_URL;
const basename = base === '/' ? '/' : base.replace(/\/$/, '');

export const router = createBrowserRouter(routes, { basename });
