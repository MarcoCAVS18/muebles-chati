import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { traductor, infoT, limiteT } from '../i18n/electrico.js';
import { videosDe, urlVideo, urlEmbed, urlBusqueda } from '../data/videos.js';
import { ELEMENTOS, BUSQUEDA_CABLES } from '../data/elementos.js';

// Panel que aparece sobre el 3D al hacer clic en un equipo, cable o manguera.
export default function PanelElemento({ id, elec3d, dataEquipos, tramos, elec, cerrar }) {
  const { t, i18n } = useTranslation();
  const tx = traductor(i18n);
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
  const info = equipo ? infoT(tx, i18n, id, ELEMENTOS[id] || {}) : {};
  const tramo = cable ? tramos.find((x) => x.id === id) : null;
  const claveVideo = equipo ? id : cable.video;
  const videos = videosDe(claveVideo);
  const actual = videos[Math.min(indice, videos.length - 1)];
  const busqueda = info.busqueda || (cable ? tx(`elec.busquedaCable.${cable.tipo}`, BUSQUEDA_CABLES[cable.tipo]) : nombre);

  // Conexiones del equipo: todos los cables que llegan o salen
  const todos = [...elec3d.cables, ...elec3d.mangueras];
  const nombres = Object.fromEntries([...elec3d.equipos, ...dataEquipos].map((e) => [e.id, e.nombre]));
  const conexiones = equipo ? todos.filter((c) => c.desde === id || c.hasta === id) : [];

  return (
    <aside className="panel-elemento">
      <header>
        <h3>{nombre}</h3>
        <button onClick={cerrar} aria-label={t('elemento.cerrar')}>
          {t('elemento.cerrar')}
        </button>
      </header>

      {equipo && (
        <>
          {info.descripcion && <p>{info.descripcion}</p>}
          {info.ubicacion && (
            <p>
              <b>{t('elemento.dondeVa')}</b> {info.ubicacion}
            </p>
          )}
          {id === 'panelSwitches' && (
            <ol className="lista-switches">
              {elec.switches.map((s, i) => (
                <li key={i}>{tx(`elec.switches.${i}`, s)}</li>
              ))}
            </ol>
          )}
          {conexiones.length > 0 && (
            <>
              <p>
                <b>{t('elemento.seConectaCon')}</b>
              </p>
              <ul>
                {conexiones.map((c) => (
                  <li key={c.id}>
                    {c.nombre}
                    {c.desde === id ? t('elemento.saleHacia', { nombre: nombres[c.hasta] || c.hasta }) : t('elemento.llegaDesde', { nombre: nombres[c.desde] || c.desde })}
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
            <b>{t('elemento.desde')}</b> {nombres[cable.desde] || cable.desde} &nbsp; <b>{t('elemento.hasta')}</b> {nombres[cable.hasta] || cable.hasta}
          </p>
          {tramo && (
            <table className="datos">
              <tbody>
                <tr>
                  <td>{t('elemento.largoSobrante')}</td>
                  <td>{tramo.largoM.toFixed(2)} m</td>
                </tr>
                <tr>
                  <td>{t('elemento.corriente')}</td>
                  <td>{tramo.amperes.toFixed(1)} A</td>
                </tr>
                <tr>
                  <td>{t('elemento.cable')}</td>
                  <td>{tramo.seccion} mm2 ({limiteT(tx, tramo.limitadoPor)})</td>
                </tr>
                <tr>
                  <td>{t('elemento.fusible')}</td>
                  <td>{tramo.sinFusible || tramo.tipo === 'senal' ? t('elemento.sinFusible') : `${tramo.fusible} A`}</td>
                </tr>
                <tr>
                  <td>{t('elemento.caida')}</td>
                  <td>{tramo.caidaPct.toFixed(2)} %</td>
                </tr>
              </tbody>
            </table>
          )}
        </>
      )}

      <h4>{t('elemento.videoRecomendado')}</h4>
      {!verVideo ? (
        <button className="ver-video" onClick={() => setVerVideo(true)}>
          {t('elemento.ver', { titulo: actual.titulo })}
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
              {v.idioma === 'en' ? t('elemento.enIngles') : ''}
            </button>
          </li>
        ))}
      </ul>
      <p className="enlaces">
        <a href={urlVideo(actual.id)} target="_blank" rel="noreferrer">
          {t('elemento.abrirYoutube')}
        </a>
        {' | '}
        <a href={urlBusqueda(busqueda)} target="_blank" rel="noreferrer">
          {t('elemento.buscarMas')}
        </a>
      </p>
    </aside>
  );
}
