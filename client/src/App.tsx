import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AdminPage } from "./pages/AdminPage";
import { DressCodePage } from "./pages/DressCodePage";
import { GiftReturnPage } from "./pages/GiftReturnPage";
import { GalleryPage } from "./pages/GalleryPage";
import { GiftsPage } from "./pages/GiftsPage";
import { HomePage } from "./pages/HomePage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { RsvpPage } from "./pages/RsvpPage";
import { StoryPage } from "./pages/StoryPage";
import { VenuePage } from "./pages/VenuePage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/nossa-historia" element={<StoryPage />} />
        <Route path="/local" element={<VenuePage />} />
        <Route path="/presentes" element={<GiftsPage />} />
        <Route path="/presentes/retorno" element={<GiftReturnPage />} />
        <Route path="/trajes" element={<DressCodePage />} />
        <Route path="/galeria" element={<GalleryPage />} />
        <Route path="/confirmar-presenca" element={<RsvpPage />} />
        <Route path="/privacidade" element={<PrivacyPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}
