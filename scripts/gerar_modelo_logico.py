"""Gera o modelo lógico das migrations SQL em SVG e PNG.

Executar na raiz do repositório: python scripts/gerar_modelo_logico.py
Requer matplotlib e Pillow. A lista de tabelas/campos/tipos vem das migrations;
a organização visual e os grupos são definidos abaixo.
"""

from pathlib import Path
import re

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Rectangle
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = sorted((ROOT / "backend/src/database/migrations").glob("*.ts"))
OUT = ROOT / "docs"

W, H = 4750, 3250
CARD_W = 950
ROW_H = 39
CARD_HEAD = 64
COL_X = [100, 1275, 2450, 3625]
ROW_Y = [370, 1070, 1770, 2470]

# Ordem para reduzir cruzamentos. Os pares significam (coluna, linha).
LAYOUT = {
    "usuarios": (0, 0),
    "identidades_externas": (1, 0),
    "perfis": (0, 1),
    "usuario_perfis": (1, 1),
    "permissoes": (0, 2),
    "perfil_permissoes": (1, 2),
    "progresso": (0, 3),
    "comentarios": (1, 3),
    "series": (2, 0),
    "obras": (3, 0),
    "trilhas": (2, 1),
    "etapas_trilha": (3, 1),
    "personagens": (2, 2),
    "participacoes": (3, 2),
    "acontecimentos": (2, 3),
    "acontecimento_personagens": (3, 3),
}

COLORS = {
    "access": ("#8b5cf6", "#f5f0ff"),
    "catalog": ("#2563eb", "#eff6ff"),
    "story": ("#0f766e", "#effcf9"),
    "interaction": ("#ea580c", "#fff7ed"),
}


def family(table):
    if table in {"progresso", "comentarios"}:
        return "interaction"
    if table in {"series", "obras", "trilhas", "etapas_trilha"}:
        return "catalog"
    if table in {
        "personagens", "participacoes", "acontecimentos", "acontecimento_personagens"
    }:
        return "story"
    return "access"


def migration_schema():
    sql = "\n".join(p.read_text(encoding="utf-8") for p in MIGRATIONS)
    tables = {}
    links = []
    blocks = re.findall(r"CREATE TABLE ([a-z_]+) \(\n(.*?)\n      \)", sql, re.S)
    for name, body in blocks:
        composite = re.findall(r"\bPRIMARY KEY \(([^)]+)\)", body)
        pk_fields = {
            field.strip()
            for group in composite
            for field in group.split(",")
        }
        fields = []
        for line in body.splitlines():
            match = re.match(
                r"^        ([a-z_]+) (uuid|varchar\(\d+\)|text|boolean|integer|smallint|timestamptz)(.*)$",
                line,
            )
            if not match:
                continue
            column, data_type, rest = match.groups()
            parent = re.search(r"REFERENCES ([a-z_]+)\(([a-z_]+)\)", rest)
            pk = "PRIMARY KEY" in rest or column in pk_fields
            markers = []
            if pk:
                markers.append("PK")
            if parent:
                markers.append("FK")
                links.append((name, column, parent.group(1), parent.group(2)))
            fields.append((column, data_type, "/".join(markers)))
        tables[name] = fields

    assert set(tables) == set(LAYOUT), (set(tables) - set(LAYOUT), set(LAYOUT) - set(tables))
    for child, column, parent, target in links:
        assert parent in tables
        assert column in {f[0] for f in tables[child]}
        assert target in {f[0] for f in tables[parent]}
    assert len(tables) == 16 and len(links) == 17, (len(tables), len(links))
    return tables, links


def card_bounds(name, fields):
    col, row = LAYOUT[name]
    return COL_X[col], ROW_Y[row], CARD_W, CARD_HEAD + ROW_H * len(fields)


def connection(ax, a, b, color, lane=0, cross_section=False):
    """Relação ilustrativa 1:N; o campo FK na tabela filha é a fonte exata."""
    x1, y1, w1, h1 = a
    x2, y2, w2, h2 = b
    c1 = (x1 + w1 / 2, y1 + h1 / 2)
    c2 = (x2 + w2 / 2, y2 + h2 / 2)
    if abs(c1[0] - c2[0]) > abs(c1[1] - c2[1]):
        start = (x1 + (w1 if c2[0] > c1[0] else 0), c1[1] + lane)
        end = (x2 + (0 if c2[0] > c1[0] else w2), c2[1] + lane)
    else:
        start = (c1[0] + lane, y1 + (h1 if c2[1] > c1[1] else 0))
        end = (c2[0] + lane, y2 + (0 if c2[1] > c1[1] else h2))
    patch = FancyArrowPatch(
        start,
        end,
        arrowstyle="-",
        connectionstyle="arc3,rad=0.07",
        lw=1.7 if cross_section else 2.2,
        color=color,
        alpha=0.25 if cross_section else 0.48,
        zorder=1,
    )
    ax.add_patch(patch)
    ax.scatter([start[0]], [start[1]], s=22, c=color, zorder=2, alpha=0.7)
    ax.scatter([end[0]], [end[1]], s=22, facecolors="white", edgecolors=color,
               linewidths=1.5, zorder=2, alpha=0.8)


def draw_card(ax, table, fields):
    x, y, w, h = card_bounds(table, fields)
    edge, tint = COLORS[family(table)]
    ax.add_patch(FancyBboxPatch(
        (x, y), w, h, boxstyle="round,pad=0,rounding_size=13",
        fc="white", ec=edge, lw=2.8, zorder=3
    ))
    ax.add_patch(Rectangle((x, y), w, CARD_HEAD, color=tint, zorder=3))
    ax.plot([x, x+w], [y+CARD_HEAD, y+CARD_HEAD], color=edge, lw=2.1, zorder=4)
    ax.text(x+24, y+42, table, fontsize=23, weight="bold", color=edge, va="center", zorder=5)
    for i, (col, data_type, keys) in enumerate(fields):
        cy = y + CARD_HEAD + ROW_H * (i + 0.5)
        if i % 2:
            ax.add_patch(Rectangle((x+1, y+CARD_HEAD+i*ROW_H), w-2, ROW_H,
                                   color="#f8fafc", ec="none", zorder=3.1))
        ax.text(x+22, cy, col, fontsize=16.5, color="#172554", va="center", zorder=5)
        ax.text(x+590, cy, data_type, fontsize=15.5, color="#475569", va="center", zorder=5)
        if keys:
            ax.text(x+w-24, cy, keys, fontsize=14.5, weight="bold", color=edge,
                    ha="right", va="center", zorder=5)


def main():
    tables, links = migration_schema()
    fig, ax = plt.subplots(figsize=(W/100, H/100), dpi=100)
    fig.subplots_adjust(left=0, right=1, bottom=0, top=1)
    fig.patch.set_facecolor("#fafbff")
    ax.set_facecolor("#fafbff")
    ax.set_xlim(0, W)
    ax.set_ylim(H, 0)
    ax.axis("off")

    ax.text(110, 94, "MARVEL TIMELINE  /  MODELO LÓGICO", fontsize=35,
            weight="bold", color="#161b3d", va="center")
    ax.text(110, 153, "16 tabelas • PostgreSQL + TypeORM • baseado nas migrations do PR #2",
            fontsize=20, color="#475569", va="center")

    section_titles = [
        (100, "ACESSO E PERMISSÕES", "access"),
        (2450, "CATÁLOGO, TRILHAS E NARRATIVA", "catalog"),
    ]
    for x, name, fam in section_titles:
        ax.text(x, 291, name, fontsize=23, color=COLORS[fam][0], weight="bold")

    for i, (child, _column, parent, _target) in enumerate(links):
        connection(ax, card_bounds(child, tables[child]), card_bounds(parent, tables[parent]),
                   COLORS[family(child)][0], lane=(i % 5 - 2) * 14,
                   cross_section=family(child) != family(parent))

    for table, fields in tables.items():
        draw_card(ax, table, fields)

    ax.text(100, 3190,
            "PK = chave primária  •  FK = chave estrangeira (N:1 para a tabela referenciada)  •  "
            "linhas representam as 17 FKs; "
            "restrições e índices: veja as migrations",
            fontsize=17.5, color="#475569", va="center")
    OUT.mkdir(exist_ok=True)
    for ext in ("svg", "png"):
        fig.savefig(OUT / f"modelo-logico.{ext}", format=ext, dpi=100,
                    bbox_inches=None, facecolor=fig.get_facecolor())
    png = OUT / "modelo-logico.png"
    Image.open(png).convert("RGB").quantize(
        colors=128, method=Image.Quantize.FASTOCTREE
    ).save(png, optimize=True)
    plt.close(fig)
    print(f"Gerado: 16 tabelas, {len(links)} FKs -> docs/modelo-logico.svg/.png")


if __name__ == "__main__":
    main()
