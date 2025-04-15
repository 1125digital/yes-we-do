// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './Landing.jsx'

import Register from './Register.jsx'
import Album from './Album.jsx'
import Mensajes from './Mensajes.jsx'
import Agenda from './Agenda.jsx'
import Mapa from './Mapa.jsx'
import Muro from './Muro.jsx'
import Welcome from './Welcome.jsx'
import AppLayout from './AppLayout.jsx'
import PerfilInvitado from './PerfilInvitado.jsx'

// Nuevos componentes para creación y panel de bodas
import CrearBoda from './CrearBoda.jsx'
import DashboardPanel from './panel/DashboardPanel.jsx'
import PanelEventoPrincipal from './panel/PanelEventoPrincipal.jsx'
import PanelEventosEspeciales from './panel/PanelEventosEspeciales.jsx'
import PanelMesas from './panel/PanelMesas.jsx'
import PanelInvitados from './panel/PanelInvitados.jsx'
import ChatPrivado from './ChatPrivado.jsx'
import EventoPrincipal from './EventoPrincipal.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
  {/* Público general */}
  <Route path="/:slug/registro" element={<Register />} />
  <Route path="/:slug/muro" element={<Muro />} />
  <Route path="/:slug" element={<Muro />} /> {/* ✅ ESTA ES LA QUE FALTABA */}

  <Route path="/bienvenida" element={<AppLayout><Welcome /></AppLayout>} />
  <Route path="/" element={<Landing />} />
  <Route path="/album" element={<AppLayout><Album /></AppLayout>} />
  <Route path="/mensajes" element={<AppLayout><Mensajes /></AppLayout>} />
  <Route path="/agenda" element={<AppLayout><Agenda /></AppLayout>} />
  <Route path="/mapa" element={<AppLayout><Mapa /></AppLayout>} />
  <Route path="/:slug/evento-principal" element={<EventoPrincipal />} />
  


  {/* Nueva ruta para registrar una boda */}
  <Route path="/crear-boda" element={<CrearBoda />} />

  {/* Rutas para panel privado de novios */}
  <Route path="/:slug/panel" element={<DashboardPanel />} />
  <Route path="/:slug/panel/evento" element={<PanelEventoPrincipal />} />
  <Route path="/:slug/panel/especiales" element={<PanelEventosEspeciales />} />
  <Route path="/:slug/panel/mesas" element={<PanelMesas />} />
  <Route path="/:slug/panel/invitados" element={<PanelInvitados />} />
  <Route path="/:slug/invitado/:slugInvitado" element={<PerfilInvitado />} />
  <Route path="/:slug/chat/:slugInvitado" element={<ChatPrivado />} />
</Routes>

    </BrowserRouter>
  </React.StrictMode>
)
