#!/usr/bin/env python3
"""Actualiza el índice de los manuales (.docx) y saca su PDF con LibreOffice.

Uso: python3 convertir.py ../SENDERO-manual-de-usuario.docx [otro.docx ...]
Necesita LibreOffice (soffice) y su módulo de Python (uno).
© 2026 Cte. Alfredo Sánchez Sender.
"""
import os, subprocess, sys, time, pathlib
import uno
from com.sun.star.beans import PropertyValue


def prop(n, v):
    p = PropertyValue(); p.Name = n; p.Value = v; return p


puerto = 2099
perfil = pathlib.Path('/tmp/lo-manuales-perfil').as_uri()
proc = subprocess.Popen(['soffice', '--headless', '--invisible', '--norestore', '-env:UserInstallation=' + perfil,
                         '--accept=socket,host=127.0.0.1,port=%d;urp;' % puerto], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    local = uno.getComponentContext()
    resolver = local.ServiceManager.createInstanceWithContext('com.sun.star.bridge.UnoUrlResolver', local)
    for _ in range(60):
        try:
            ctx = resolver.resolve('uno:socket,host=127.0.0.1,port=%d;urp;StarOffice.ComponentContext' % puerto); break
        except Exception:
            time.sleep(1)
    escritorio = ctx.ServiceManager.createInstanceWithContext('com.sun.star.frame.Desktop', ctx)
    for a in sys.argv[1:]:
        ruta = pathlib.Path(a).resolve()
        doc = escritorio.loadComponentFromURL(ruta.as_uri(), '_blank', 0, (prop('Hidden', True),))
        indices = doc.getDocumentIndexes()
        for i in range(indices.getCount()):
            indices.getByIndex(i).update()
        doc.refresh()
        for i in range(indices.getCount()):  # segunda pasada: los números de página ya incluyen el índice
            indices.getByIndex(i).update()
        doc.storeToURL(ruta.as_uri(), (prop('FilterName', 'MS Word 2007 XML'),))
        doc.storeToURL(ruta.with_suffix('.pdf').as_uri(), (prop('FilterName', 'writer_pdf_Export'),))
        doc.close(True)
        print('índice actualizado y PDF:', ruta.with_suffix('.pdf').name)
finally:
    proc.terminate()
