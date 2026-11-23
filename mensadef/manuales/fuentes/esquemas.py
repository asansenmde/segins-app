#!/usr/bin/env python3
"""Esquemas de SENDERO al estilo Visio (SVG) → ../capturas/esquema-*.svg
Después, render-esquemas.mjs los pasa a PNG para los manuales.
© 2026 Cte. Alfredo Sánchez Sender. Todos los derechos reservados.
"""
import html
import pathlib

SAL = pathlib.Path(__file__).parent.parent / 'capturas'
NAVY, VERDE, ORO, TINTA, GRIS = '#13294B', '#2E5A3A', '#B8922A', '#1F2A37', '#5A6270'
CALLES = {  # cabecera, fondo de la calle, relleno de las formas
    'usuario': ('#5A6270', '#F7F8FA', '#FFFFFF'),
    'sendero': (NAVY, '#F2F5FA', '#E3EAF5'),
    'mensadef': (VERDE, '#F3F8F4', '#E1EFE4'),
    'colabora': ('#8A6A12', '#FCF8EE', '#F7EDCF'),
    'portafirmas': ('#5B3F8C', '#F7F4FB', '#E9E1F5'),
}
F = 'font-family="Arial, Helvetica, sans-serif"'
esc = html.escape


class Esquema:
    def __init__(self, ancho, alto):
        self.w, self.h, self.capas, self.formas = ancho, alto, [], {}

    def add(self, s):
        self.capas.append(s)

    # ---------- calles (swimlanes) verticales ----------
    def calles(self, lista, arriba=10, cab=44):
        n = len(lista); x0, ancho = 10, (self.w - 20) / n
        self.cx = []
        for i, (clave, titulo) in enumerate(lista):
            c, fondo, _ = CALLES[clave]; x = x0 + i * ancho
            self.add(f'<rect x="{x}" y="{arriba}" width="{ancho}" height="{self.h - arriba - 10}" fill="{fondo}" stroke="#C5CCD6" stroke-width="1"/>')
            self.add(f'<rect x="{x}" y="{arriba}" width="{ancho}" height="{cab}" fill="{c}"/>')
            self.add(f'<text x="{x + ancho / 2}" y="{arriba + cab / 2 + 6}" text-anchor="middle" {F} font-size="17" font-weight="bold" fill="#FFFFFF">{esc(titulo)}</text>')
            self.cx.append(x + ancho / 2)
        self.clave_calle = [k for k, _ in lista]
        return self.cx

    # ---------- formas ----------
    def texto(self, cx, cy, lineas, color=TINTA, tam=14.5, neg=False):
        lh = tam + 4; y0 = cy - (len(lineas) - 1) * lh / 2 + tam * 0.36
        for i, l in enumerate(lineas):
            self.add(f'<text x="{cx}" y="{y0 + i * lh:.1f}" text-anchor="middle" {F} font-size="{tam}" '
                     f'{"font-weight=\"bold\" " if neg else ""}fill="{color}">{esc(l)}</text>')

    def forma(self, id, tipo, cx, cy, lineas, w=190, h=None, calle=None, relleno=None, borde=None, tam=14.5):
        cal = CALLES[calle] if calle else CALLES['sendero']
        rel = relleno or cal[2]; bor = borde or cal[0]
        if h is None:
            h = {'dec': 104, 'term': 56, 'db': 76}.get(tipo, max(56, 22 + 18.5 * len(lineas)))
        x, y = cx - w / 2, cy - h / 2
        if tipo == 'proc':
            self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{rel}" stroke="{bor}" stroke-width="1.6"/>')
        elif tipo == 'term':
            self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h / 2}" fill="{NAVY}" stroke="{NAVY}" stroke-width="1.6"/>')
        elif tipo == 'fin':
            self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h / 2}" fill="{VERDE}" stroke="{VERDE}" stroke-width="1.6"/>')
        elif tipo == 'mal':
            self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="#FBE9E9" stroke="#B23A3A" stroke-width="1.6"/>')
        elif tipo == 'dec':
            self.add(f'<polygon points="{cx},{y} {x + w},{cy} {cx},{y + h} {x},{cy}" fill="#FFF6D6" stroke="{ORO}" stroke-width="1.8"/>')
        elif tipo == 'db':
            e = 9
            self.add(f'<path d="M{x},{y + e} L{x},{y + h - e} A{w / 2},{e} 0 0 0 {x + w},{y + h - e} L{x + w},{y + e}" fill="{rel}" stroke="{bor}" stroke-width="1.6"/>')
            self.add(f'<ellipse cx="{cx}" cy="{y + e}" rx="{w / 2}" ry="{e}" fill="{rel}" stroke="{bor}" stroke-width="1.6"/>')
            cy = cy + e / 2
        elif tipo == 'doc':
            self.add(f'<path d="M{x},{y} L{x + w},{y} L{x + w},{y + h - 8} Q{x + w * 0.75},{y + h - 18} {x + w / 2},{y + h - 8} T{x},{y + h - 8} Z" fill="{rel}" stroke="{bor}" stroke-width="1.6"/>')
            cy = cy - 4
        elif tipo == 'nota':
            self.add(f'<path d="M{x},{y} L{x + w - 14},{y} L{x + w},{y + 14} L{x + w},{y + h} L{x},{y + h} Z" fill="#FFFBEA" stroke="#C9B26A" stroke-width="1.2"/>')
        blanco = tipo in ('term', 'fin')
        self.texto(cx, cy, lineas, '#FFFFFF' if blanco else TINTA, tam, neg=blanco)
        self.formas[id] = (cx, cy if tipo not in ('db', 'doc') else cy, w, h, tipo)
        self.formas[id] = (cx, (y + h / 2), w, h, tipo)

    def p(self, id, lado, d=0):
        """Punto de anclaje: lado t/b/l/r; d desplaza a lo largo del lado."""
        cx, cy, w, h, _ = self.formas[id]
        return {'t': (cx + d, cy - h / 2), 'b': (cx + d, cy + h / 2), 'l': (cx - w / 2, cy + d), 'r': (cx + w / 2, cy + d)}[lado]

    # ---------- conectores ortogonales ----------
    def flecha(self, puntos, etiqueta=None, en=None, discont=False, color='#3A4452', doble=False, saltos=(), punta=True):
        d = f'M{puntos[0][0]},{puntos[0][1]}'
        for (x1, y1), (x2, y2) in zip(puntos, puntos[1:]):
            for sx, sy in saltos:  # salto de línea (puente) al cruzar otra
                if y1 == y2 == sy and min(x1, x2) < sx < max(x1, x2):
                    s = 1 if x2 > x1 else -1
                    d += f' L{sx - 8 * s},{y1} A8,8 0 0 {1 if s > 0 else 0} {sx + 8 * s},{y1}'
                if x1 == x2 == sx and min(y1, y2) < sy < max(y1, y2):
                    s = 1 if y2 > y1 else -1
                    d += f' L{x1},{sy - 8 * s} A8,8 0 0 {0 if s > 0 else 1} {x1},{sy + 8 * s}'
            d += f' L{x2},{y2}'
        extra = ' stroke-dasharray="7 5"' if discont else ''
        ini = ' marker-start="url(#fi)"' if doble else ''
        fin = ' marker-end="url(#ff)"' if punta else ''
        self.add(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="1.7"{extra}{ini}{fin}/>')
        if not punta:  # se une a otra línea: punto de unión
            self.add(f'<circle cx="{puntos[-1][0]}" cy="{puntos[-1][1]}" r="3.5" fill="{color}"/>')
        if etiqueta:
            x, y = en
            lineas = etiqueta if isinstance(etiqueta, list) else [etiqueta]
            anchura = max(len(l) for l in lineas) * 6.9 + 10
            alto = 17 * len(lineas) + 4
            self.add(f'<rect x="{x - anchura / 2}" y="{y - alto / 2}" width="{anchura}" height="{alto}" rx="3" fill="#FFFFFF" fill-opacity="0.92"/>')
            self.texto(x, y, lineas, '#1F3F6E', 12.5, neg=True)

    def leyenda(self, x, y, items):
        for i, (tipo, txt) in enumerate(items):
            xx = x + i * 190
            if tipo == 'dec':
                self.add(f'<polygon points="{xx + 14},{y - 10} {xx + 28},{y} {xx + 14},{y + 10} {xx},{y}" fill="#FFF6D6" stroke="{ORO}" stroke-width="1.4"/>')
            elif tipo == 'db':
                self.add(f'<rect x="{xx}" y="{y - 9}" width="28" height="18" rx="5" fill="#F7EDCF" stroke="#8A6A12" stroke-width="1.4"/>')
            elif tipo == 'disc':
                self.add(f'<line x1="{xx}" y1="{y}" x2="{xx + 28}" y2="{y}" stroke="#3A4452" stroke-width="1.7" stroke-dasharray="7 5"/>')
            elif tipo == 'term':
                self.add(f'<rect x="{xx}" y="{y - 9}" width="28" height="18" rx="9" fill="{NAVY}"/>')
            else:
                self.add(f'<rect x="{xx}" y="{y - 9}" width="28" height="18" rx="3" fill="#E3EAF5" stroke="{NAVY}" stroke-width="1.4"/>')
            self.add(f'<text x="{xx + 36}" y="{y + 5}" {F} font-size="13" fill="{GRIS}">{esc(txt)}</text>')

    def guardar(self, nombre):
        defs = ('<defs><marker id="ff" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">'
                '<path d="M0,0 L10,5 L0,10 Z" fill="#3A4452"/></marker>'
                '<marker id="fi" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="8" markerHeight="8" orient="auto">'
                '<path d="M10,0 L0,5 L10,10 Z" fill="#3A4452"/></marker></defs>')
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}">'
               f'<rect width="100%" height="100%" fill="#FFFFFF"/>{defs}{"".join(self.capas)}</svg>')
        (SAL / f'esquema-{nombre}.svg').write_text(svg, encoding='utf-8')
        print('esquema', nombre)


LEY = [('term', 'Inicio / fin'), ('proc', 'Acción'), ('dec', 'Decisión'), ('db', 'Lista o datos'), ('disc', 'Vuelta o respuesta')]


# =====================================================================
# MANUAL DE USUARIO
# =====================================================================
def u1_entrar():
    e = Esquema(1000, 1130)
    L0, L1, L2, L3 = e.calles([('usuario', 'Usuario'), ('sendero', 'SENDERO'), ('mensadef', 'MENSADEF'), ('colabora', 'Colabora')])
    e.forma('a', 'term', L0, 125, ['Pulsar el favorito', 'SENDERO'], calle='usuario')
    e.forma('b', 'dec', L1, 125, ['¿Estoy en', 'MENSADEF?'])
    e.forma('c', 'proc', L2, 125, ['Lleva a la portada', 'de MENSADEF'], calle='mensadef')
    e.flecha([e.p('a', 'r'), e.p('b', 'l')])
    e.flecha([e.p('b', 'r'), e.p('c', 'l')], 'No', (500, 113))
    e.flecha([e.p('c', 't'), (L2, 66), (L0, 66), e.p('a', 't')], 'Pulsar otra vez', (L2 - 120, 66), discont=True)
    e.forma('d', 'proc', L3, 255, ['Página de acceso', 'comprueba tu cuenta'], calle='colabora')
    e.flecha([e.p('b', 'b'), (L1, 205), (L3, 205), e.p('d', 't')], 'Sí', (L1 + 16, 190))
    e.forma('e', 'db', L3, 360, ['Listas «SENDERO', 'Autorizados»'], calle='colabora')
    e.flecha([e.p('d', 'b'), e.p('e', 't')])
    e.forma('f', 'dec', L1, 440, ['¿Autorizado y', 'versión válida?'])
    e.flecha([e.p('d', 'l'), (L1, 255), e.p('f', 't')], 'Respuesta', (L2, 245))
    e.forma('g', 'proc', L0, 440, ['No autorizado:', '«Solicitar acceso»;', 'lo aprueba el Cte.', 'o el responsable'], calle='usuario', h=96)
    e.flecha([e.p('f', 'l'), e.p('g', 'r')])
    e.flecha([e.p('g', 't'), e.p('a', 'b')], ['Aprobado (correo):', 'volver a pulsar'], (L0, 280), discont=True)
    e.forma('j', 'proc', L3, 545, ['Página de instalación:', 'arrastrar el favorito', 'nuevo'], calle='colabora', h=80)
    e.flecha([e.p('f', 'r'), (L3, 440), e.p('j', 't')], ['Caducada u', 'obligatoria'], (L2, 426))
    e.flecha([e.p('j', 'r'), (985, 545), (985, 66), (L2, 66)], 'Volver a pulsar', (L3, 66), discont=True, punta=False)
    e.forma('k', 'dec', L1, 620, ['¿Sesión abierta', 'en el ámbito?'])
    e.flecha([e.p('f', 'b'), e.p('k', 't')], 'Sí', (L1 + 16, 510))
    e.forma('l', 'proc', L2, 620, ['Entrada automática', '(marco oculto)'], calle='mensadef')
    e.flecha([e.p('k', 'r'), e.p('l', 'l')], 'No', (500, 608))
    e.forma('m', 'dec', L2, 750, ['¿Entra en', '25 segundos?'])
    e.flecha([e.p('l', 'b'), e.p('m', 't')])
    e.forma('n', 'proc', L0, 750, ['«Entrar en mi ámbito»', 'e «Iniciar sesión»', '(ventana pequeña)'], calle='usuario', h=80)
    e.flecha([e.p('m', 'l'), e.p('n', 'r')], 'No', (L1 + 70, 738), saltos=[(L1, 750)])
    e.forma('o', 'proc', L1, 880, ['Lee tus células y', 'las bandejas de hoy'])
    e.flecha([e.p('k', 'b'), e.p('o', 't')], 'Sí', (L1 + 16, 690))
    e.flecha([e.p('m', 'b'), (L2, 880), e.p('o', 'r')], 'Sí', (L2 + 14, 830))
    e.flecha([e.p('n', 'b'), (L0, 880), e.p('o', 'l')])
    e.forma('p', 'db', L2, 990, ['API de MENSADEF', '(6 consultas a la vez)'], calle='mensadef')
    e.forma('q', 'proc', L1, 990, ['Lista por días', '(se ve según llega)'])
    e.flecha([e.p('o', 'b'), e.p('q', 't')])
    e.flecha([e.p('q', 'r'), e.p('p', 'l')], doble=True, discont=True)
    e.forma('r', 'fin', L0, 990, ['Trabajar con', 'los mensajes'], calle='usuario')
    e.flecha([e.p('q', 'l'), e.p('r', 'r')])
    e.leyenda(30, 1095, LEY)
    e.guardar('u1-entrar')


def u2_mensaje():
    e = Esquema(1000, 1110)
    L0, L1, L2, L3 = e.calles([('usuario', 'Usuario'), ('sendero', 'SENDERO'), ('mensadef', 'MENSADEF'), ('colabora', 'Colabora / Outlook')])
    e.forma('a', 'term', L0, 120, ['Pulsar un mensaje', 'de la lista'], calle='usuario')
    e.forma('b', 'proc', L1, 120, ['Abre la ficha: datos,', 'anexos y texto'])
    e.forma('c', 'proc', L2, 120, ['Da el cuerpo y lo', 'marca como leído'], calle='mensadef')
    e.flecha([e.p('a', 'r'), e.p('b', 'l')])
    e.flecha([e.p('b', 'r'), e.p('c', 'l')], doble=True)
    e.forma('d', 'dec', L0, 250, ['¿Qué quiero', 'hacer?'])
    e.flecha([e.p('a', 'b'), e.p('d', 't')])
    filas = [
        ('Revisar', ['«✓ Visto» (solo tuyo)', 'o poner bandera'], ['Guarda la bandera'], None, 70),
        ('Comentar', ['Comentario', '(pulsar dos veces)'], ['Guarda el comentario', 'con tu nombre'], None, 70),
        ('Seguimiento', ['«Tarea en META» o', '«Al PSIT» y confirmar', '«Sí, está guardado»'], ['Comentario de', 'constancia'], ['Abre META o el PSIT', 'con el alta rellena'], 96),
        ('Documentos', ['«Imprimir / PDF»,', '«Correo» o', '«Enviar con el PDF»'], None, ['Ventana de imprimir', 'o correo de Outlook'], 86),
        ('Antecedentes', ['«Su referencia»,', '«N.º referencia» o', '«En todo MENSADEF»'], ['Busca en todas las', 'células y fechas'], None, 86),
        ('Firma', ['«Pasar a rúbrica» o', '«Firmar en Rúbrica»'], ['Envía a rúbrica', '(ver la figura de firma)'], None, 70),
    ]
    y = 345
    tronco = (L0, y)
    for i, (et, s, m, c, h) in enumerate(filas):
        e.forma(f's{i}', 'proc', L1, y, s, h=h)
        e.flecha([(L0, y), e.p(f's{i}', 'l')], et, (L0 + 68, y - 14))
        if m and c:
            e.forma(f'c{i}', 'proc', L3, y - 22, c, calle='colabora', h=60)
            e.forma(f'm{i}', 'proc', L2, y + 42, m, calle='mensadef', h=56)
            e.flecha([e.p(f's{i}', 'r', -22), e.p(f'c{i}', 'l')])
            e.flecha([e.p(f's{i}', 'r', 30), e.p(f'm{i}', 'l', -12)])
        elif m:
            e.forma(f'm{i}', 'proc', L2, y, m, calle='mensadef', h=60)
            e.flecha([e.p(f's{i}', 'r'), e.p(f'm{i}', 'l')])
        elif c:
            e.forma(f'c{i}', 'proc', L3, y, c, calle='colabora', h=60)
            e.flecha([e.p(f's{i}', 'r'), e.p(f'c{i}', 'l')])
        ultimo = y
        y += 125 if h > 80 else 112
    e.add(f'<path d="M{L0},{e.p("d", "b")[1]} L{L0},{ultimo}" fill="none" stroke="#3A4452" stroke-width="1.7"/>')
    e.add(f'<circle cx="{L0}" cy="{ultimo}" r="3.5" fill="#3A4452"/>')
    e.forma('n1', 'nota', L1, 1020, ['Lo que cambia algo en', 'MENSADEF queda hecho allí;', 'lo que escribe pide confirmar'], w=215, h=72, tam=13)
    e.forma('n2', 'nota', L3, 1020, ['SENDERO no borra ni guarda', 'nada en Colabora: lo haces tú', 'en META o en el PSIT'], w=210, h=72, tam=13)
    e.leyenda(30, 1080, LEY[:3])
    e.guardar('u2-mensaje')


def u3_meta():
    e = Esquema(1000, 960)
    L0, L1, L2, L3 = e.calles([('usuario', 'Usuario'), ('sendero', 'SENDERO'), ('colabora', 'META / PSIT (Colabora)'), ('mensadef', 'MENSADEF')])
    e.forma('a', 'term', L0, 120, ['Pulsar «Tarea en META»', 'o «Al PSIT»'], calle='usuario', w=200)
    e.forma('b', 'dec', L1, 120, ['¿Tu organización', 'tiene la dirección?'], w=200)
    e.flecha([e.p('a', 'r'), e.p('b', 'l')])
    e.forma('c', 'proc', L0, 255, ['Escribir la dirección', 'de META o del PSIT', '(se guarda)'], calle='usuario', h=80)
    e.flecha([e.p('b', 'b'), (L1, 255), e.p('c', 'r')], 'No', (L1 + 16, 200))
    e.forma('d', 'proc', L1, 370, ['Abre la página con los', 'datos en #importar=', '(no salen por la red)'], h=80, w=200)
    e.flecha([e.p('b', 'r'), (L1 + 125, 120), (L1 + 125, 330), (L1 + 100, 330)], 'Sí', (L1 + 138, 190))
    e.flecha([e.p('c', 'b'), (L0, 370), e.p('d', 'l')])
    e.forma('f', 'proc', L2, 370, ['Alta rellena: asunto,', 'referencias, texto y', 'departamento = célula'], calle='colabora', h=80)
    e.flecha([e.p('d', 'r'), e.p('f', 'l')])
    e.forma('g', 'proc', L0, 500, ['Revisar y guardar', 'en META o el PSIT'], calle='usuario')
    e.flecha([e.p('f', 'b'), (L2, 500), e.p('g', 'r')], saltos=[(L1, 500)])
    e.forma('h', 'dec', L0, 630, ['¿Lo has', 'guardado?'])
    e.flecha([e.p('g', 'b'), e.p('h', 't')])
    e.forma('i', 'proc', L1, 630, ['Pone «➜ Tarea» o', '«★ PSIT» junto al', 'asunto'], h=80)
    e.flecha([e.p('h', 'r'), e.p('i', 'l')], 'Sí', (L0 + 120, 618))
    e.forma('j', 'proc', L3, 630, ['Comentario «Añadido', 'como tarea… por', 'NOMBRE» (lo ven todos)'], calle='mensadef', h=80)
    e.flecha([e.p('i', 'r'), e.p('j', 'l')], saltos=[(L2, 630)])
    e.forma('k', 'proc', L0, 770, ['No marca nada', '(queda «⏳ ¿Tarea?»', 'hasta decidir)'], calle='usuario', h=80)
    e.flecha([e.p('h', 'b'), e.p('k', 't')], 'No / después', (L0 + 50, 704))
    e.forma('q', 'proc', L1, 800, ['«✕ Quitar de META /', 'del PSIT» (2 clics)'])
    e.forma('r', 'proc', L3, 800, ['Comentario «Quitado', 'de… por NOMBRE»'], calle='mensadef')
    e.forma('s', 'proc', L2, 880, ['Borrar allí la entrada', '(«Abrir META / PSIT»)'], calle='colabora')
    e.flecha([e.p('i', 'b'), e.p('q', 't')], 'Si hay que quitarlo', (L1, 706), discont=True)
    e.flecha([e.p('q', 'r'), e.p('r', 'l')], saltos=[(L2, 800)])
    e.flecha([e.p('q', 'b'), (L1, 880), e.p('s', 'l')])
    e.leyenda(30, 935, LEY[:3] + [('disc', 'Vuelta o respuesta')])
    e.guardar('u3-meta')


def u4_firma():
    e = Esquema(1000, 1290)
    L0, L1, L2, L3 = e.calles([('usuario', 'Usuario'), ('sendero', 'SENDERO'), ('mensadef', 'MENSADEF'), ('portafirmas', 'Portafirmas / AutoFirma')])
    e.forma('a', 'term', L0, 140, ['Mensaje enviable', 'a rúbrica'], calle='usuario')
    e.forma('b', 'dec', L1, 140, ['¿Tiene puesta', 'la «Firma»?'])
    e.flecha([e.p('a', 'r'), e.p('b', 'l')])
    e.forma('c', 'proc', L2, 140, ['Aviso «⚠ falta la firma»:', 'poner quién firma', 'en MENSADEF'], calle='mensadef', h=80)
    e.flecha([e.p('b', 'r'), e.p('c', 'l')], 'No', (500, 128))
    e.flecha([e.p('c', 't'), (L2, 66), (L0, 66), e.p('a', 't')], 'Volver a intentarlo', (L1, 66), discont=True)
    e.forma('d', 'proc', L1, 255, ['«✍ Pasar a rúbrica»', '(pulsar dos veces)'])
    e.flecha([e.p('b', 'b'), e.p('d', 't')], 'Sí', (L1 + 16, 208))
    e.forma('e', 'proc', L2, 255, ['Recibe el envío', 'a portafirmas'], calle='mensadef')
    e.flecha([e.p('d', 'r'), e.p('e', 'l')])
    e.forma('f', 'dec', L2, 380, ['¿Lo acepta?'])
    e.flecha([e.p('e', 'b'), e.p('f', 't')])
    e.forma('g', 'mal', L1, 380, ['Muestra el motivo', 'que da MENSADEF'], calle='sendero')
    e.flecha([e.p('f', 'l'), e.p('g', 'r')], 'No', (500, 368))
    e.forma('h', 'proc', L1, 500, ['Marca «✍ Rúbrica» y', 'ofrece «✍ Firmar', 'en Rúbrica»'], h=80)
    e.flecha([e.p('f', 'b'), (L2, 500), e.p('h', 'r')], 'Sí', (L2 + 14, 452))
    e.forma('i', 'proc', L0, 500, ['Pulsar «✍ Firmar', 'en Rúbrica»'], calle='usuario')
    e.flecha([e.p('h', 'l'), e.p('i', 'r')])
    e.forma('j', 'proc', L3, 620, ['Abre la lista del', 'firmante en una', 'pestaña nueva'], calle='portafirmas', h=80)
    e.flecha([e.p('i', 'b'), (L0, 620), e.p('j', 'l')])
    e.forma('k', 'proc', L0, 740, ['Identificarse como', 'Firmante y pulsar', 'el favorito SENDERO'], calle='usuario', h=80)
    e.flecha([e.p('j', 'b'), (L3, 740), e.p('k', 'r')])
    e.forma('l', 'proc', L3, 860, ['Panel «Firmar con', 'SENDERO»: marca solo', 'esa petición'], calle='portafirmas', h=80)
    e.flecha([e.p('k', 'b'), (L0, 860), e.p('l', 'l')])
    e.forma('m', 'proc', L0, 980, ['«📄 Abrir el documento»,', 'leerlo y pulsar', '«He leído»'], calle='usuario', h=80, w=200)
    e.flecha([e.p('l', 'b'), (L3, 980), e.p('m', 'r')])
    e.forma('n', 'proc', L3, 1100, ['«✍ Firmar» →', 'AutoFirma pide', 'certificado y PIN'], calle='portafirmas', h=80)
    e.flecha([e.p('m', 'b'), (L0, 1100), e.p('n', 'l')])
    e.forma('o', 'fin', L1, 1180, ['Documento firmado'], w=200)
    e.flecha([e.p('n', 'b'), (L3, 1180), e.p('o', 'r')])
    e.forma('nt', 'nota', 500, 800, ['El Portafirmas exige abrir', 'el documento antes de', 'firmar: SENDERO no', 'se salta ese paso'], w=200, h=90, tam=13)
    e.leyenda(30, 1262, LEY[:3])
    e.guardar('u4-firma')


# =====================================================================
# MANUAL TÉCNICO
# =====================================================================
def caja(e, x, y, w, h, titulo, color, fondo):
    e.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{fondo}" stroke="{color}" stroke-width="1.8" stroke-dasharray="0"/>')
    e.add(f'<rect x="{x}" y="{y}" width="{w}" height="34" rx="10" fill="{color}"/><rect x="{x}" y="{y + 20}" width="{w}" height="14" fill="{color}"/>')
    e.add(f'<text x="{x + 14}" y="{y + 23}" {F} font-size="15" font-weight="bold" fill="#FFFFFF">{esc(titulo)}</text>')


def t1_arquitectura():
    e = Esquema(1000, 880)
    caja(e, 20, 20, 300, 790, 'Puesto del usuario (Edge / Chrome)', '#5A6270', '#F7F8FA')
    e.forma('fav', 'proc', 170, 95, ['Favorito «SENDERO»', '(javascript:, protegido)'], w=250, calle='usuario')
    e.forma('vis', 'proc', 170, 380, ['Visor SENDERO', 'en el origen', 'mensadef.mdef.es', '', 'Ficha, filtros, informes,', 'oficio y correo (mailto)', '', 'Clave del servicio en', 'sessionStorage (pestaña)'], w=250, h=440)
    e.flecha([e.p('fav', 'b'), e.p('vis', 't')], 'al pulsar', (170, 140))
    e.forma('ls', 'db', 170, 645, ['localStorage', 'visorMensadef.*'], w=230, calle='usuario')
    e.forma('af', 'proc', 170, 755, ['AutoFirma', '(aplicación local)'], w=250, calle='portafirmas')
    e.add('<line x1="170" y1="600" x2="170" y2="607" stroke="#3A4452" stroke-width="1.7" stroke-dasharray="4 3"/>')
    caja(e, 530, 20, 450, 140, 'mensadef.mdef.es (SharePoint)', VERDE, '#F3F8F4')
    e.forma('sp', 'proc', 755, 105, ['Ámbitos, portada, inicio de', 'sesión, bibliotecas'], w=400, h=60, calle='mensadef')
    caja(e, 530, 180, 450, 140, 'mensadefapi.mdef.es (API REST)', VERDE, '#F3F8F4')
    e.forma('api', 'proc', 755, 265, ['buzon/ · mensaje/ · etiqueta/', 'ambito/ · usuario/'], w=400, h=60, calle='mensadef')
    caja(e, 530, 340, 450, 330, 'colabora.mdef.es · /et/SUIGESUR/JSUIGE', '#8A6A12', '#FCF8EE')
    e.forma('acc', 'proc', 645, 440, ['SENDERO-acceso.html', '(copia protegida)'], w=200, calle='colabora')
    e.forma('lis', 'db', 865, 440, ['SENDERO Autorizados', 'SENDERO Solicitudes'], w=200, calle='colabora')
    e.flecha([e.p('acc', 'r'), e.p('lis', 'l')], doble=True)
    e.forma('mp', 'proc', 645, 540, ['META.html', 'puntos-situacion.html'], w=200, calle='colabora')
    e.forma('ins', 'doc', 865, 540, ['SENDERO.html', '(instalación)'], w=200, h=62, calle='colabora')
    e.forma('mail', 'proc', 755, 625, ['Avisos: SP.Utilities SendEmail (envío robusto)'], w=400, h=40, calle='colabora')
    caja(e, 530, 690, 450, 120, 'portafirmas.mdef.es', '#5B3F8C', '#F7F4FB')
    e.forma('pf', 'proc', 755, 765, ['ePortafirmas · lista del firmante', '+ panel «Firmar con SENDERO»'], w=400, h=56, calle='portafirmas')
    e.flecha([(295, 200), (420, 200), (420, 105), e.p('sp', 'l')], ['/_api/web, marcos', 'ocultos (sesión)'], (420, 150))
    e.flecha([(295, 265), e.p('api', 'l')], ['GET / POST / PUT', 'passcode + user'], (430, 238))
    e.flecha([(295, 440), e.p('acc', 'l')], ['iframe #comprobar', '↔ postMessage'], (430, 412), doble=True)
    e.flecha([(295, 540), e.p('mp', 'l')], ['#importar= / #quitar=', '(fragmento)'], (430, 512))
    e.flecha([(295, 585), (470, 585), (470, 765), e.p('pf', 'l')], ['pestaña', 'SENDEROFIRMA_…'], (470, 690))
    e.flecha([e.p('pf', 'b', -100), (655, 840), (170, 840), e.p('af', 'b')], 'conexión local (websocket)', (410, 840))
    e.leyenda(30, 866, [('proc', 'Componente'), ('db', 'Almacenamiento')])
    e.guardar('t1-arquitectura')


def t2_arranque():
    vidas = [('Usuario', 'usuario'), ('Visor SENDERO', 'sendero'), ('Página de acceso', 'colabora'), ('MENSADEF', 'mensadef'), ('mensadefapi', 'mensadef')]
    e = Esquema(1000, 1010)
    xs = [100, 300, 500, 700, 900]
    for (n, c), x in zip(vidas, xs):
        col = CALLES[c][0]
        e.add(f'<rect x="{x - 85}" y="20" width="170" height="44" rx="6" fill="{col}"/>')
        e.add(f'<text x="{x}" y="48" text-anchor="middle" {F} font-size="15" font-weight="bold" fill="#FFFFFF">{n}</text>')
        e.add(f'<line x1="{x}" y1="64" x2="{x}" y2="960" stroke="#9AA3AF" stroke-width="1.3" stroke-dasharray="6 5"/>')
    mens = [
        (0, 1, 'Pulsar el favorito'), (1, 1, 'Mira el dominio (Landing / Portafirmas)'),
        (1, 2, 'iframe #comprobar (versión, ámbito)'), (2, 2, 'Lee sus listas'),
        (2, 1, 'postMessage: ok, regla, versión, caducidad, UrlMeta, UrlPsit'),
        (1, 3, 'GET /ambito/X/_api/web (¿hay sesión?)'),
        (1, 3, 'Sin sesión: inicio de sesión en marco oculto'),
        (1, 3, 'Página del ámbito en marco oculto (hasta 45 s)'),
        (3, 1, 'Número de usuario, colección y consulta de la clave'),
        (1, 4, 'usuario/ValidateUser'), (4, 1, 'Cabeceras IdUsuario y User → passcode / user'),
        (1, 4, 'ambito/UsuarioCelulas'),
        (1, 4, 'buzon/ObtenerBuzonCelula × N (6 a la vez, 100 por página)'),
        (1, 0, 'Lista progresiva (como mucho cada segundo)'),
        (0, 1, 'Abrir un mensaje'),
        (1, 4, 'mensaje/ObtenerCuerpo + PUT BuzonCelulaMensajeLeido'),
    ]
    y = 100
    for i, (a, b, t) in enumerate(mens):
        if i == 6:
            e.add(f'<rect x="230" y="{y - 22}" width="560" height="112" fill="none" stroke="{ORO}" stroke-width="1.5"/>')
            e.add(f'<rect x="230" y="{y - 22}" width="58" height="20" fill="{ORO}"/><text x="238" y="{y - 7}" {F} font-size="12.5" font-weight="bold" fill="#FFFFFF">alt</text>')
            e.add(f'<text x="296" y="{y - 7}" {F} font-size="12.5" fill="{GRIS}">[desde la portada]</text>')
            y += 24
        if a == b:
            x = xs[a]
            e.add(f'<path d="M{x},{y} L{x + 50},{y} L{x + 50},{y + 22} L{x + 4},{y + 22}" fill="none" stroke="#3A4452" stroke-width="1.6" marker-end="url(#ff)"/>')
            e.add(f'<text x="{x + 58}" y="{y + 15}" {F} font-size="13" fill="{TINTA}">{i + 1}. {esc(t)}</text>')
            y += 52
            continue
        x1, x2 = xs[a], xs[b]
        resp = b < a and a != 0
        e.add(f'<line x1="{x1}" y1="{y}" x2="{x2 + (-6 if x2 > x1 else 6)}" y2="{y}" stroke="#3A4452" stroke-width="1.6"{" stroke-dasharray=\"7 5\"" if resp else ""} marker-end="url(#ff)"/>')
        mx = (x1 + x2) / 2 if abs(x2 - x1) > 250 else min(x1, x2) + 8
        anchor = 'middle' if abs(x2 - x1) > 250 else 'start'
        tt = f'{i + 1}. {t}'
        an = len(tt) * 6.6 + 8
        bx = mx - an / 2 if anchor == 'middle' else mx - 4
        e.add(f'<rect x="{bx}" y="{y - 21}" width="{an}" height="18" fill="#FFFFFF"/>')
        e.add(f'<text x="{mx}" y="{y - 7}" text-anchor="{anchor}" {F} font-size="13" fill="{TINTA}">{esc(tt)}</text>')
        y += 52
        if i == 7:
            y += 8
    e.leyenda(30, 985, [('proc', 'Petición'), ('disc', 'Respuesta')])
    e.guardar('t2-arranque')


def t3_acceso():
    e = Esquema(1000, 1060)
    C, D = 330, 760
    e.forma('a', 'term', C, 50, ['SENDERO pregunta', '(#comprobar)'], w=220)
    e.forma('b', 'dec', C, 165, ['¿Contesta el', 'marco oculto?'], w=210)
    e.flecha([e.p('a', 'b'), e.p('b', 't')])
    e.forma('b2', 'proc', D, 165, ['«🔐 Comprobar en Colabora»', '(ventana pequeña; si solo', 'contesta así, 7 días)'], w=280, h=80, calle='colabora')
    e.flecha([e.p('b', 'r'), e.p('b2', 'l')], 'No', (520, 153))
    e.flecha([e.p('b2', 'b'), (D, 245), (C, 245)], punta=False)
    e.forma('c', 'dec', C, 320, ['¿Versión ≥', '«Mínima»?'], w=210)
    e.flecha([e.p('b', 'b'), e.p('c', 't')], 'Sí', (C + 16, 236))
    e.forma('c2', 'mal', D, 320, ['«Esta versión de SENDERO', 'ya no se puede usar»', '→ página de instalación'], w=280, h=80)
    e.flecha([e.p('c', 'r'), e.p('c2', 'l')], 'No', (520, 308))
    e.forma('d', 'dec', C, 470, ['¿Bloqueo activo', 'de la cuenta?'], w=210)
    e.flecha([e.p('c', 'b'), e.p('d', 't')], 'Sí', (C + 16, 390))
    e.forma('d2', 'mal', D, 470, ['«Tu acceso a SENDERO', 'está retirado»'], w=280)
    e.flecha([e.p('d', 'r'), e.p('d2', 'l')], 'Sí', (520, 458))
    e.forma('f', 'dec', C, 620, ['¿Regla «Persona»', 'activa y vigente?'], w=210)
    e.flecha([e.p('d', 'b'), e.p('f', 't')], 'No', (C + 18, 540))
    e.forma('g', 'dec', C, 770, ['¿Regla «Ámbito»', 'activa y vigente?'], w=210)
    e.flecha([e.p('f', 'b'), e.p('g', 't')], 'No', (C + 18, 690))
    e.forma('g2', 'mal', 120, 900, ['No autorizado:', '«Solicitar acceso»'], w=200)
    e.flecha([e.p('g', 'l'), (120, 770), e.p('g2', 't')], 'No', (170, 758))
    e.forma('h', 'proc', D, 700, ['Autorizado: recibe', 'regla, versión vigente,', 'caducidad, META y PSIT'], w=280, h=80, relleno='#E1EFE4', borde=VERDE)
    e.flecha([e.p('f', 'r'), (600, 620), (600, 680), (D - 140, 680)], 'Sí', (560, 608))
    e.flecha([e.p('g', 'r'), (600, 770), (600, 720), (D - 140, 720)], 'Sí', (560, 758))
    e.forma('i', 'dec', D, 850, ['¿GENERADO + días', 'de caducidad?'], w=230)
    e.flecha([e.p('h', 'b'), e.p('i', 't')])
    e.forma('i2', 'mal', 450, 960, ['Caducada → página', 'de instalación'], w=200)
    e.flecha([e.p('i', 'l'), (450, 850), e.p('i2', 't')], 'Pasada', (500, 838))
    e.forma('j', 'fin', D, 990, ['Entra (aviso los 5 últimos', 'días; franja si hay nueva)'], w=280, h=60)
    e.flecha([e.p('i', 'b'), e.p('j', 't')], 'Vigente', (D + 34, 925))
    e.forma('nt', 'nota', 120, 380, ['Lo decide la página de', 'acceso en Colabora;', 'la caducidad la calcula', 'el propio favorito'], w=200, h=90, tam=13)
    e.leyenda(30, 1040, [('term', 'Inicio / entra'), ('dec', 'Decisión'), ('proc', 'Resultado')])
    e.guardar('t3-acceso')


def t4_publicar():
    e = Esquema(1000, 1140)
    L0, L1, L2 = e.calles([('sendero', 'Desarrollo (repositorio)'), ('colabora', 'Colabora (JSUIGE)'), ('usuario', 'Usuarios')])
    e.forma('a', 'term', L0, 115, ['Cambio en', 'visor-mensadef.html'], w=230)
    e.forma('b', 'proc', L0, 225, ['Subir VERSION', '(AAAA-MM-DD · n)'], w=230)
    e.flecha([e.p('a', 'b'), e.p('b', 't')])
    e.forma('c', 'proc', L0, 345, ['python3 generar-marcador.py', 'URL_ACCESO + GENERADO,', 'ofuscado y bloqueo *.mdef.es'], w=260, h=80)
    e.flecha([e.p('b', 'b'), e.p('c', 't')])
    e.forma('d', 'proc', L0, 470, ['sh mensadef/pruebas/todas.sh', '(28 pasadas, simulado)'], w=260)
    e.flecha([e.p('c', 'b'), e.p('d', 't')])
    e.forma('e', 'dec', L0, 600, ['¿«TODO BIEN»?'], w=210)
    e.flecha([e.p('d', 'b'), e.p('e', 't')])
    e.flecha([e.p('e', 'r'), (318, 600), (318, 115), e.p('a', 'r')], 'No: corregir', (318, 412), discont=True)
    e.forma('f', 'proc', L0, 730, ['README, PENDIENTES', 'y commit «MENSADEF: …»'], w=230)
    e.flecha([e.p('e', 'b'), e.p('f', 't')], 'Sí', (L0 + 16, 666))
    e.forma('g', 'doc', L1, 730, ['Subir SENDERO.html', '(página de instalación)'], w=240, h=66, calle='colabora')
    e.flecha([e.p('f', 'r'), e.p('g', 'l')])
    e.forma('h', 'proc', L1, 860, ['«Versión vigente»: anotar', 'versión y novedades;', 'caducidad; ¿obligatoria?'], w=260, h=80, calle='colabora')
    e.flecha([e.p('g', 'b'), e.p('h', 't')])
    e.forma('lis', 'db', L1, 990, ['SENDERO Autorizados', '(Versión, Mínima,', 'Caducidad)'], w=230, calle='colabora', h=90)
    e.flecha([e.p('h', 'b'), e.p('lis', 't')])
    e.forma('i', 'proc', L2, 860, ['«✉ Avisar por correo»', 'a los autorizados'], w=250, calle='usuario')
    e.flecha([e.p('h', 'r'), e.p('i', 'l')])
    e.forma('j', 'proc', L2, 990, ['Al abrir SENDERO: franja', '«hay una versión nueva»', 'o bloqueo si es obligatoria'], w=270, h=80, calle='usuario')
    e.flecha([e.p('lis', 'r'), e.p('j', 'l')], 'la lee', (L1 + 160, 966))
    e.flecha([e.p('i', 'b'), e.p('j', 't')])
    e.forma('k', 'fin', L2, 1085, ['Arrastrar el favorito nuevo', 'a la barra (página de instalación)'], w=300, h=60)
    e.flecha([e.p('j', 'b'), e.p('k', 't')])
    e.leyenda(30, 1118, LEY[:4])
    e.guardar('t4-publicar')


if __name__ == '__main__':
    for f in (u1_entrar, u2_mensaje, u3_meta, u4_firma, t1_arquitectura, t2_arranque, t3_acceso, t4_publicar):
        f()
