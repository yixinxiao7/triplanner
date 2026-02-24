import { Routes, Route } from 'react-router-dom';

function HomePage() {
  return (
    <div>
      <h1>Welcome</h1>
      <p>Your app is running. Start building!</p>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div>
      <h1>404</h1>
      <p>Page not found.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
