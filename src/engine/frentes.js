// Frentes planos con puertas a ras, como en la foto: marco de montantes y travesaños
// alrededor de cada hueco y la puerta metida en el hueco con 2 mm de luz.
// Un hueco puede llevar color (para distinguir la heladera o el gas) y abre (id del equipo que
// se muestra al tocar la puerta en el 3D).

// Frente en un plano perpendicular a z (frente del mueble trasero)
export function frenteZ(ctx, { grupo, zf, xa, xb, ya, yb, hx0, hx1, huecos, marco, tope }) {
  const t = ctx.t;
  const luz = 2;
  const par = (nombre, x0, x1, y0, y1) => {
    if (x1 - x0 > 0.5 && y1 - y0 > 0.5) {
      ctx.parte({ grupo, nombre, x: x0, sx: x1 - x0, y: y0, sy: y1 - y0, z: zf, sz: t });
    }
  };
  par(`${marco} - montante izquierdo`, xa, hx0, ya, yb);
  par(`${marco} - montante derecho`, hx1, xb, ya, yb);
  let y = ya;
  for (const h of [...huecos].sort((a, b) => a.y0 - b.y0)) {
    par(h.marcoBajo || `${marco} - travesaño`, hx0, hx1, y, h.y0);
    ctx.parte({
      grupo,
      nombre: h.nombre,
      x: hx0 + luz,
      sx: hx1 - hx0 - 2 * luz,
      y: h.y0 + luz,
      sy: h.y1 - h.y0 - 2 * luz,
      z: zf,
      sz: t,
      ...(h.color ? { color: h.color } : {}),
      ...(h.abre ? { abre: h.abre } : {}),
    });
    y = h.y1;
  }
  par(tope || `${marco} - travesaño`, hx0, hx1, y, yb);
}

// Frente en un plano perpendicular a x (frentes del mueble derecho)
export function frenteX(ctx, { grupo, xf, za, zb, ya, yb, hz0, hz1, huecos, marco }) {
  const t = ctx.t;
  const luz = 2;
  const par = (nombre, z0, z1, y0, y1) => {
    if (z1 - z0 > 0.5 && y1 - y0 > 0.5) {
      ctx.parte({ grupo, nombre, z: z0, sz: z1 - z0, y: y0, sy: y1 - y0, x: xf, sx: t });
    }
  };
  par(`${marco} - montante`, za, hz0, ya, yb);
  par(`${marco} - montante`, hz1, zb, ya, yb);
  let y = ya;
  for (const h of [...huecos].sort((a, b) => a.y0 - b.y0)) {
    par(h.marcoBajo || `${marco} - travesaño`, hz0, hz1, y, h.y0);
    ctx.parte({
      grupo,
      nombre: h.nombre,
      z: hz0 + luz,
      sz: hz1 - hz0 - 2 * luz,
      y: h.y0 + luz,
      sy: h.y1 - h.y0 - 2 * luz,
      x: xf,
      sx: t,
    });
    y = h.y1;
  }
  par(`${marco} - travesaño`, hz0, hz1, y, yb);
}
