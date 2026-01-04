import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles.css";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import HolidayCard from "./components/HolidayCard.jsx";
import { getAuth } from "./api.js";
import { ThemeProvider } from "./ThemeContext.jsx";
import { UserProvider } from "./UserContext.jsx";

import Home from "./pages/Home.jsx";
import MovieDetails from "./pages/MovieDetails.jsx";
import ShowDetails from "./pages/ShowDetails.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Watchlist from "./pages/Watchlist.jsx";

import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminMovies from "./pages/AdminMovies.jsx";
import AdminMovieForm from "./pages/AdminMoviesForm.jsx";
import AdminEpisodes from "./pages/AdminEpisodes.jsx";
import AdminEpisodeForm from "./pages/AdminEpisodeForm.jsx";
import AdminMovieParts from "./pages/AdminMovieParts.jsx";
import AdminMoviePartForm from "./pages/AdminMoviePartForm.jsx";
import AdminDocuments from "./pages/AdminDocuments.jsx";
import AdminDocumentForm from "./pages/AdminDocumentForm.jsx";
import Audiobooks from "./pages/Audiobooks.jsx";
import AudiobookReader from "./pages/AudiobookReader.jsx";
import MyAudiobooks from "./pages/MyAudiobooks.jsx";
import Achievements from "./pages/Achievements.jsx";

function AdminRoute({ children }) {
  return getAuth() ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  const [search, setSearch] = useState("");

  return (
    <ThemeProvider>
      <UserProvider>
        <BrowserRouter>
          <HolidayCard />
          <Header search={search} setSearch={setSearch} />
          <div className="container">
            <Routes>
              <Route path="/" element={<Home search={search} />} />
              <Route path="/movie/:id" element={<MovieDetails />} />
              <Route path="/show/:id" element={<ShowDetails />} />
              
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/watchlist" element={<Watchlist />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/movies" element={<AdminRoute><AdminMovies /></AdminRoute>} />
              <Route path="/admin/movies/new" element={<AdminRoute><AdminMovieForm mode="create" /></AdminRoute>} />
              <Route path="/admin/movies/:id/edit" element={<AdminRoute><AdminMovieForm mode="edit" /></AdminRoute>} />

              <Route path="/admin/shows/:id/episodes" element={<AdminRoute><AdminEpisodes /></AdminRoute>} />
              <Route path="/admin/shows/:id/episodes/new" element={<AdminRoute><AdminEpisodeForm mode="create" /></AdminRoute>} />
              <Route path="/admin/episodes/:id/edit" element={<AdminRoute><AdminEpisodeForm mode="edit" /></AdminRoute>} />

              <Route path="/admin/movies/:id/parts" element={<AdminRoute><AdminMovieParts /></AdminRoute>} />
              <Route path="/admin/movies/:id/parts/new" element={<AdminRoute><AdminMoviePartForm mode="create" /></AdminRoute>} />
              <Route path="/admin/parts/:id/edit" element={<AdminRoute><AdminMoviePartForm mode="edit" /></AdminRoute>} />

              <Route path="/admin/documents" element={<AdminRoute><AdminDocuments /></AdminRoute>} />
              <Route path="/admin/documents/new" element={<AdminRoute><AdminDocumentForm mode="create" /></AdminRoute>} />
              <Route path="/admin/documents/:id/edit" element={<AdminRoute><AdminDocumentForm mode="edit" /></AdminRoute>} />

              <Route path="/audiobooks" element={<Audiobooks />} />
              <Route path="/audiobook/:id" element={<AudiobookReader />} />
              <Route path="/my-audiobooks" element={<MyAudiobooks />} />
              <Route path="/achievements" element={<Achievements />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </BrowserRouter>
      </UserProvider>
    </ThemeProvider>
  );
}
