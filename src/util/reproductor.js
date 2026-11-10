// Reproductor del armado animado: lleva el reloj de la secuencia (en segundos a velocidad 1) y avisa a la pantalla
// solo cuando cambia algo que se ve en los controles (el evento, play o pausa), no en cada cuadro.
// El 3D lee rep.t directamente en cada cuadro, así que no hace falta volver a dibujar React 60 veces por segundo.
import { useSyncExternalStore } from 'react';
import { eventoEn } from '../engine/secuencia.js';

export const VELOCIDADES = [0.5, 1, 2, 4];

export function crearReproductor() {
  let est = { activo: false, seq: null, grupo: '', pasoId: '', playing: false, vel: 1, indice: 0, rango: [0, 0], fin: false, seguir: true };
  let t = 0;
  const subs = new Set();
  const emitir = (cambios) => {
    est = { ...est, ...cambios };
    subs.forEach((f) => f());
  };
  const poner = (s, extra = {}) => {
    const seq = est.seq;
    t = Math.min(est.rango[1], Math.max(est.rango[0], s));
    emitir({ indice: eventoEn(seq, t), fin: false, ...extra });
  };
  const piezas = () => est.seq.eventos.filter((e) => e.tipo === 'pieza');

  return {
    get t() {
      return t;
    },
    suscribir: (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    estado: () => est,

    // pasoId vacío: todo el mueble; con pasoId: solo ese paso
    abrir(seq, pasoId = '') {
      const paso = pasoId ? seq.pasos.find((p) => p.id === pasoId) : null;
      const rango = paso ? [paso.t0, paso.t1] : [0, seq.duracion];
      t = rango[0];
      emitir({ activo: true, seq, grupo: seq.grupo, pasoId: paso ? paso.id : '', playing: true, indice: eventoEn(seq, t), rango, fin: false });
    },
    cerrar() {
      emitir({ activo: false, playing: false, seq: null, pasoId: '', fin: false });
    },
    jugar() {
      if (!est.activo) return;
      if (est.fin || t >= est.rango[1] - 0.01) poner(est.rango[0], { playing: true });
      else emitir({ playing: true });
    },
    pausar() {
      emitir({ playing: false });
    },
    alternar() {
      if (est.playing) this.pausar();
      else this.jugar();
    },
    velocidad(v) {
      emitir({ vel: v });
    },
    seguir(b) {
      emitir({ seguir: b });
    },
    irA(s) {
      if (est.activo) poner(s);
    },

    // Saltos: la pieza siguiente o anterior, y el paso siguiente o anterior (si se mira todo el mueble)
    siguientePieza() {
      if (!est.activo) return;
      const sig = piezas().find((e) => e.t0 > t + 0.05 && e.t0 < est.rango[1]);
      if (sig) poner(sig.t0, { playing: true });
      else poner(est.rango[1], { playing: false, fin: true });
    },
    anteriorPieza() {
      if (!est.activo) return;
      const ant = [...piezas()].reverse().find((e) => e.t0 < t - 0.9 && e.t0 >= est.rango[0] - 1);
      poner(ant ? ant.t0 : est.rango[0], { playing: true });
    },
    siguientePaso() {
      if (!est.activo || est.pasoId) return;
      const sig = est.seq.pasos.find((p) => p.t0 > t + 0.05);
      if (sig) poner(sig.t0, { playing: true });
    },
    anteriorPaso() {
      if (!est.activo || est.pasoId) return;
      const ant = [...est.seq.pasos].reverse().find((p) => p.t0 < t - 1.5);
      poner(ant ? ant.t0 : 0, { playing: true });
    },

    // Lo llama el 3D en cada cuadro
    avanzar(dt) {
      if (!est.activo || !est.playing) return;
      t += Math.min(dt, 0.05) * est.vel;
      if (t >= est.rango[1]) {
        t = est.rango[1];
        emitir({ playing: false, fin: true, indice: eventoEn(est.seq, t) });
        return;
      }
      const i = eventoEn(est.seq, t);
      if (i !== est.indice) emitir({ indice: i });
    },
  };
}

export function useReproductor(rep) {
  return useSyncExternalStore(rep.suscribir, rep.estado);
}
