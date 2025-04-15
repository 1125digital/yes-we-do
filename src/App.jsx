import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CrearBoda from './CrearBoda';
import DashboardPanel from './panel/DashboardPanel';
import PanelEventoPrincipal from './panel/PanelEventoPrincipal';
import PanelEventosEspeciales from './panel/PanelEventosEspeciales';
import PanelMesas from './panel/PanelMesas';
import PanelInvitados from './panel/PanelInvitados';
import Muro from './Muro';
import PerfilInvitado from './PerfilInvitado.jsx';
import ChatPrivado from './ChatPrivado.jsx';
import Register from './register'; // 👈 importa el componente de registro

function App() {
  return (
    <Routes>
      <Route path="/crear-boda" element={<CrearBoda />} />
      <Route path="/:slug/panel" element={<DashboardPanel />} />
      <Route path="/:slug/panel/evento" element={<PanelEventoPrincipal />} />
      <Route path="/:slug/panel/especiales" element={<PanelEventosEspeciales />} />
      <Route path="/:slug/panel/mesas" element={<PanelMesas />} />
      <Route path="/:slug/panel/invitados" element={<PanelInvitados />} />
      <Route path="/:slug/muro" element={<Muro />} />
      <Route path="/:slug/registro" element={<Register />} /> {/* ✅ agregada */}
      <Route path="/:slug" element={<Muro />} /> {/* ✅ agregada */}
      <Route path="/:slug/invitado/:slugInvitado" element={<PerfilInvitado />} />
      <Route path="/:slug/chat/:slugInvitado" element={<ChatPrivado />} />
    </Routes>
  );
}

export default App;
