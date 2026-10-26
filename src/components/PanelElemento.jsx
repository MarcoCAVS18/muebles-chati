import React, { useEffect, useState } from 'react';
import { videosDe, urlVideo, urlEmbed, urlBusqueda } from '../data/videos.js';
import { ELEMENTOS, BUSQUEDA_CABLES } from '../data/elementos.js';

// Panel que aparece sobre el 3D al hacer clic en un equipo, cable o manguera.
export default function PanelElemento({ id, elec3d, dataEquipos, tramos, elec, cerrar }) {
  const [indice, setIndice] = useState(0);
  const [verVideo, setVerVideo] = useState(false);

  useEffect(() => {
    setIndice(0);
    setVerVideo(false);
  }, [id]);

  if (!id) return null;

  const equipo = [...elec3d.equipos, ...dataEquipos].find((e) => e.id === id);
  const cable = [...elec3d.cables, ...elec3d.mangueras].find((c) => c.id === id);
  if (!equipo && !cable) return null;

  const nombre = (equipo || cable).nombre;
  const info = equipo ? ELEMENTOS[id] || {} : {};
  const tramo = cable ? tramos.find((t) => t.id === id) : null;
  const claveVideo = equipo ? id : cable.video;
  const videos = videosDe(claveVideo);
  const actual = videos[Math.min(indice, videos.length - 1)];
  const busqueda = info.busqueda || (cable ? BUSQUEDA_CABLES[cable.tipo] : nombre);

  // Conexiones del equipo: todos los cables que llegan o salen
  const todos = [...elec3d.cables, ...elec3d.mangueras];
  const nombres = Object.fromEntries([...elec3d.equipos, ...dataEquipos].map((e) => [e.id, e.nombre]));
  const conexiones = equipo ? todos.filter((c) => c.desde === id || c.hasta === id) : [];

  return (
    <aside className="panel-elemento">
      <header>
        <h3>{nombre}</h3>
        <button onClick={cerrar} aria-label="Cerrar">
          Cerrar
        </button>
      </header>

      {equipo && (
        <>
          {info.descripcion && <p>{info.descripcion}</p>}
          {info.ubicacion && (
            <p>
              <b>Dónde va:</b> {info.ubicacion}
            </p>
          )}
          {id === 'panelSwitches' && (
            <ol className="lista-switches">
              {elec.switches.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          )}
          {conexiones.length > 0 && (
            <>
              <p>
                <b>Se conecta con:</b>
              </p>
              <ul>
                {conexiones.map((c) => (
                  <li key={c.id}>
                    {c.nombre}
                    {c.desde === id ? ` (sale hacia ${nombres[c.hasta] || c.hasta})` : ` (llega desde ${nombres[c.desde] || c.desde})`}
                  </li>
                ))}
              </ul>
            </>
          )}
          {info.consejos && (
            <ul>
              {info.consejos.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          )}
        </>
      )}

      {cable && (
        <>
          <p>{cable.nota}</p>
          <p>
            <b>Desde:</b> {nombres[cable.desde] || cable.desde} &nbsp; <b>Hasta:</b> {nombres[cable.hasta] || cable.hasta}
          </p>
          {tramo && (
            <table className="datos">
              <tbody>
                <tr>
                  <td>Largo con sobrante</td>
                  <td>{tramo.largoM.toFixed(2)} m</td>
                </tr>
                <tr>
                  <td>Corriente</td>
                  <td>{tramo.amperes.toFixed(1)} A</td>
                </tr>
                <tr>
                  <td>Cable</td>
                  <td>{tramo.seccion} mm2 ({tramo.limitadoPor})</td>
                </tr>
                <tr>
                  <td>Fusible</td>
                  <td>{tramo.sinFusible || tramo.tipo === 'senal' ? 'Sin fusible propio (lo protege el tramo anterior)' : `${tramo.fusible} A`}</td>
                </tr>
                <tr>
                  <td>Caída de tensión</td>
                  <td>{tramo.caidaPct.toFixed(2)} %</td>
                </tr>
              </tbody>
            </table>
          )}
        </>
      )}

      <h4>Video recomendado</h4>
      {!verVideo ? (
        <button className="ver-video" onClick={() => setVerVideo(true)}>
          Ver: {actual.titulo}
        </button>
      ) : (
        <div className="reproductor">
          <iframe
            key={actual.id}
            src={urlEmbed(actual.id)}
            title={actual.titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      <ul className="videos">
        {videos.map((v, i) => (
          <li key={v.id}>
            <button
              className={i === indice ? 'activo' : ''}
              onClick={() => {
                setIndice(i);
                setVerVideo(true);
              }}
            >
              {v.titulo}
              {v.idioma === 'en' ? ' (en inglés)' : ''}
            </button>
          </li>
        ))}
      </ul>
      <p className="enlaces">
        <a href={urlVideo(actual.id)} target="_blank" rel="noreferrer">
          Abrir en YouTube
        </a>
        {' | '}
        <a href={urlBusqueda(busqueda)} target="_blank" rel="noreferrer">
          Buscar más en YouTube
        </a>
      </p>
    </aside>
  );
}
