# crear_qr_lotes.py
# Genera N códigos QR a partir de pallet_id, item_id, name y cantidad.
# El contenido de cada QR es un JSON con 4 keys:
#   - pallet_id
#   - item_id
#   - name
#   - item_id_full = f"{pallet_id}_{item_id}_{consecutivo}"
#
# Puedes pasar los datos por CLI o por un archivo JSON con --config.
# Estructura del JSON de config:
# {
#   "pallet_id": "PAL001",
#   "item_id": "ITM123",
#   "name": "Caja de tornillos",
#   "cantidad": 25,
#   "outdir": "qrs"            # opcional
# }

import os
import json
import argparse
from typing import Optional, Dict, Any
import qrcode

def cargar_config(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    requeridos = ["pallet_id", "item_id", "name", "cantidad"]
    faltantes = [k for k in requeridos if k not in data]
    if faltantes:
        raise ValueError(f"El JSON de config debe incluir: {', '.join(requeridos)}. Faltan: {faltantes}")
    # outdir opcional
    data.setdefault("outdir", "qrs")
    return data

def generar_qrs(pallet_id: str, item_id: str, name: str, cantidad: int, outdir: str = "qrs") -> None:
    if cantidad <= 0:
        raise ValueError("cantidad debe ser un entero positivo")

    os.makedirs(outdir, exist_ok=True)

    # Configuración de robustez del QR (ajústala si necesitas)
    qr_cfg = dict(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )

    # Ancho para zero-padding (para orden lexicográfico correcto: 001, 002, ...)
    width = len(str(cantidad))

    manifest = []  # guardamos un índice de lo generado

    for i in range(1, cantidad + 1):
        consecutivo = f"{i:0{width}d}"  # '001', '002', ...
        item_id_full = f"{pallet_id}_{item_id}_{consecutivo}"

        payload = {
            "pallet_id": pallet_id,
            "item_id": item_id,
            "name": name,
            "item_id_full": item_id_full,  # 4ª key: combinación solicitada
        }

        qr = qrcode.QRCode(**qr_cfg)
        qr.add_data(json.dumps(payload, ensure_ascii=False))
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        filename = os.path.join(outdir, f"qr_{item_id_full}.png")
        img.save(filename)

        manifest.append({"index": i, "item_id_full": item_id_full, "file": filename})

    # Guardamos un índice de referencia (opcional)
    with open(os.path.join(outdir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"✅ {cantidad} QR(s) generados en: {os.path.abspath(outdir)}")
    print(f"🧾 Índice: {os.path.abspath(os.path.join(outdir, 'manifest.json'))}")

def main():
    parser = argparse.ArgumentParser(description="Generar QRs secuenciales desde pallet_id, item_id, name y cantidad.")
    parser.add_argument("--pallet-id", help="ID del pallet (string)")
    parser.add_argument("--item-id", help="ID del item (string)")
    parser.add_argument("--name", help="Nombre legible del item")
    parser.add_argument("--cantidad", type=int, help="Número de QRs a generar")
    parser.add_argument("--outdir", default="qrs", help="Carpeta de salida (default: qrs)")
    parser.add_argument("--config", help="Ruta a JSON con pallet_id, item_id, name, cantidad (y opcional outdir)")

    args = parser.parse_args()

    if args.config:
        cfg = cargar_config(args.config)
        generar_qrs(
            pallet_id=cfg["pallet_id"],
            item_id=cfg["item_id"],
            name=cfg["name"],
            cantidad=int(cfg["cantidad"]),
            outdir=cfg.get("outdir", "qrs"),
        )
    else:
        # Validación si no hubo --config
        faltantes = [k for k, v in {
            "--pallet-id": args.pallet_id,
            "--item-id": args.item_id,
            "--name": args.name,
            "--cantidad": args.cantidad
        }.items() if v is None]
        if faltantes:
            parser.error(f"Faltan argumentos: {', '.join(faltantes)}. "
                         f"Alternativamente usa --config ruta/al.json")
        generar_qrs(
            pallet_id=args.pallet_id,
            item_id=args.item_id,
            name=args.name,
            cantidad=int(args.cantidad),
            outdir=args.outdir,
        )

if __name__ == "__main__":
    main()
