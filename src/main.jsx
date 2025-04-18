// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Landing from './Landing.jsx';
import Register from './Register.jsx';
import Album from './Album.jsx';
import Mensajes from './Mensajes.jsx';
import Agenda from './Agenda.jsx';
import Mapa from './Mapa.jsx';
import Muro from './Muro.jsx';
import Welcome from './Welcome.jsx';
import AppLayout from './AppLayout.jsx';
import PerfilInvitado from './PerfilInvitado.jsx';
import VistaMesas from './panel/VistaMesas.jsx';
import CrearBoda from './CrearBoda.jsx';
import DashboardPanel from './panel/DashboardPanel.jsx';
import PanelEventoPrincipal from './panel/PanelEventoPrincipal.jsx';
import PanelEventosEspeciales from './panel/PanelEventosEspeciales.jsx';
import PanelMesas from './panel/PanelMesas.jsx';
import PanelInvitados from './panel/PanelInvitados.jsx';
import ChatPrivado from './ChatPrivado.jsx';
import Chats from './chat.jsx';
import EventoPrincipal from './EventoPrincipal.jsx';
import Ajustes from './Ajustes.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster />
      <Routes>
        {/* Público general */}
        <Route path="/" element={<Landing />} />
        <Route path="/bienvenida" element={<AppLayout><Welcome /></AppLayout>} />
        <Route path="/album" element={<AppLayout><Album /></AppLayout>} />
        <Route path="/mensajes" element={<AppLayout><Mensajes /></AppLayout>} />
        <Route path="/agenda" element={<AppLayout><Agenda /></AppLayout>} />
        <Route path="/mapa" element={<AppLayout><Mapa /></AppLayout>} />

        {/* Invitado autenticado y navegación con navbar */}
        <Route element={<AppLayout />}>
          <Route path="/:slug" element={<Muro />} />
          <Route path="/:slug/muro" element={<Muro />} />
          <Route path="/:slug/album" element={<Album />} />
          <Route path="/:slug/mesas" element={<VistaMesas />} />
          <Route path="/:slug/chat" element={<Chats />} />
          <Route path="/:slug/chat/:slugInvitado" element={<ChatPrivado />} />
          <Route path="/:slug/evento-principal" element={<EventoPrincipal />} />
          <Route path="/:slug/invitado/:slugInvitado" element={<PerfilInvitado />} />
          <Route path="/:slug/ajustes" element={<Ajustes />} />
        </Route>

        {/* Crear boda y panel de administración */}
        <Route path="/crear-boda" element={<CrearBoda />} />
        <Route path="/:slug/panel" element={<DashboardPanel />} />
        <Route path="/:slug/panel/evento" element={<PanelEventoPrincipal />} />
        <Route path="/:slug/panel/especiales" element={<PanelEventosEspeciales />} />
        <Route path="/:slug/panel/mesas" element={<PanelMesas />} />
        <Route path="/:slug/panel/invitados" element={<PanelInvitados />} />

        {/* Registro de invitados */}
        <Route path="/:slug/registro" element={<Register />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
