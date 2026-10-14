import { MigrationInterface, QueryRunner } from "typeorm";

// Fotografias das duas ordens. Não importar os seeds, que podem mudar no futuro.
const LONGA_ANTIGA = [
  "capitao-america-o-primeiro-vingador",
  "homem-de-ferro",
  "thor",
  "os-vingadores",
  "capitao-america-2-o-soldado-invernal",
  "guardioes-da-galaxia",
  "vingadores-era-de-ultron",
  "homem-formiga",
  "capitao-america-guerra-civil",
  "doutor-estranho",
  "homem-aranha-de-volta-ao-lar",
  "thor-ragnarok",
  "pantera-negra",
  "vingadores-guerra-infinita",
  "homem-formiga-e-a-vespa",
  "capita-marvel",
  "vingadores-ultimato",
  "wandavision-temporada-1",
  "falcao-e-o-soldado-invernal-temporada-1",
  "loki-temporada-1",
  "shang-chi-e-a-lenda-dos-dez-aneis",
  "homem-aranha-sem-volta-para-casa",
  "doutor-estranho-no-multiverso-da-loucura",
  "pantera-negra-wakanda-para-sempre",
  "homem-formiga-e-a-vespa-quantumania",
  "loki-temporada-2",
  "as-marvels",
  "x-men",
  "x-men-2",
  "deadpool-e-wolverine",
  "capitao-america-admiravel-mundo-novo",
  "thunderbolts",
  "quarteto-fantastico-primeiros-passos",
  "homem-aranha-um-novo-dia",
] as const;

const LONGA_NOVA = [
  "capitao-america-o-primeiro-vingador",
  "capita-marvel",
  "homem-de-ferro",
  "thor",
  "os-vingadores",
  "capitao-america-2-o-soldado-invernal",
  "guardioes-da-galaxia",
  "vingadores-era-de-ultron",
  "homem-formiga",
  "capitao-america-guerra-civil",
  "pantera-negra",
  "homem-aranha-de-volta-ao-lar",
  "doutor-estranho",
  "thor-ragnarok",
  "homem-formiga-e-a-vespa",
  "vingadores-guerra-infinita",
  "vingadores-ultimato",
  "loki-temporada-1",
  "loki-temporada-2",
  "wandavision-temporada-1",
  "shang-chi-e-a-lenda-dos-dez-aneis",
  "falcao-e-o-soldado-invernal-temporada-1",
  "homem-aranha-sem-volta-para-casa",
  "doutor-estranho-no-multiverso-da-loucura",
  "pantera-negra-wakanda-para-sempre",
  "homem-formiga-e-a-vespa-quantumania",
  "as-marvels",
  "x-men",
  "x-men-2",
  "deadpool-e-wolverine",
  "capitao-america-admiravel-mundo-novo",
  "thunderbolts",
  "homem-aranha-um-novo-dia",
  "quarteto-fantastico-primeiros-passos",
] as const;

const CURTA_ANTIGA = [
  "vingadores-guerra-infinita",
  "homem-formiga-e-a-vespa",
  "capita-marvel",
  "vingadores-ultimato",
  "wandavision-temporada-1",
  "falcao-e-o-soldado-invernal-temporada-1",
  "loki-temporada-1",
  "shang-chi-e-a-lenda-dos-dez-aneis",
  "homem-aranha-sem-volta-para-casa",
  "doutor-estranho-no-multiverso-da-loucura",
  "pantera-negra-wakanda-para-sempre",
  "homem-formiga-e-a-vespa-quantumania",
  "loki-temporada-2",
  "as-marvels",
  "x-men",
  "x-men-2",
  "deadpool-e-wolverine",
  "capitao-america-admiravel-mundo-novo",
  "thunderbolts",
  "quarteto-fantastico-primeiros-passos",
  "homem-aranha-um-novo-dia",
] as const;

const CURTA_NOVA = [
  "capita-marvel",
  "homem-formiga-e-a-vespa",
  "vingadores-guerra-infinita",
  "vingadores-ultimato",
  "loki-temporada-1",
  "loki-temporada-2",
  "wandavision-temporada-1",
  "shang-chi-e-a-lenda-dos-dez-aneis",
  "falcao-e-o-soldado-invernal-temporada-1",
  "homem-aranha-sem-volta-para-casa",
  "doutor-estranho-no-multiverso-da-loucura",
  "pantera-negra-wakanda-para-sempre",
  "homem-formiga-e-a-vespa-quantumania",
  "as-marvels",
  "x-men",
  "x-men-2",
  "deadpool-e-wolverine",
  "capitao-america-admiravel-mundo-novo",
  "thunderbolts",
  "homem-aranha-um-novo-dia",
  "quarteto-fantastico-primeiros-passos",
] as const;

const TRILHAS = [
  {
    slug: "longa",
    antiga: LONGA_ANTIGA,
    nova: LONGA_NOVA,
    descricaoAntiga: "Seleção que começa com o primeiro Capitão América.",
    descricaoNova:
      "Seleção ampliada em ordem dos acontecimentos, desde o primeiro Capitão América, com blocos de outras linhas do tempo.",
  },
  {
    slug: "curta",
    antiga: CURTA_ANTIGA,
    nova: CURTA_NOVA,
    descricaoAntiga: "Seleção iniciada em Guerra Infinita.",
    descricaoNova:
      "Seleção reduzida em ordem dos acontecimentos, com Capitã Marvel como contexto inicial e blocos de outras linhas do tempo.",
  },
] as const;

export class ChronologicalTrails20261014060000 implements MigrationInterface {
  name = "ChronologicalTrails20261014060000";

  async up(runner: QueryRunner): Promise<void> {
    await this.reordenar(runner, false);
  }

  async down(runner: QueryRunner): Promise<void> {
    await this.reordenar(runner, true);
  }

  private async reordenar(
    runner: QueryRunner,
    desfazer: boolean,
  ): Promise<void> {
    // A transação da migration impede posições intermediárias de ficarem salvas.
    // O lock também impede inserções concorrentes durante a troca de posições.
    await runner.query("LOCK TABLE etapas_trilha IN SHARE ROW EXCLUSIVE MODE");
    for (const trilha of TRILHAS) {
      const rows = (await runner.query(
        `SELECT e.id, o.slug, e.posicao FROM etapas_trilha e
         JOIN trilhas t ON t.id = e.trilha_id
         JOIN obras o ON o.id = e.obra_id
         WHERE t.slug = $1 ORDER BY e.posicao FOR UPDATE OF e`,
        [trilha.slug],
      )) as { id: string; slug: string; posicao: number }[];
      // Banco recém-migrado ainda não tem seeds; receberá a nova ordem ao popular.
      if (rows.length) {
        const ordem = desfazer ? trilha.antiga : trilha.nova;
        const ids = new Map(rows.map((row) => [row.slug, row.id]));
        if (
          rows.length !== ordem.length ||
          ordem.some((slug) => !ids.has(slug))
        ) {
          throw new Error(
            `Trilha ${trilha.slug} tem etapas personalizadas. Revise a ordem antes de aplicar esta migration; nenhuma etapa será excluída.`,
          );
        }
        const offset = Math.max(...rows.map((row) => row.posicao));
        if (offset + rows.length > 2147483647) {
          throw new Error(
            `Posições da trilha ${trilha.slug} excedem o limite permitido.`,
          );
        }
        // Faixa temporária positiva evita colisão em UNIQUE (trilha_id, posicao).
        for (let i = 0; i < rows.length; i++) {
          await runner.query(
            "UPDATE etapas_trilha SET posicao = $1 WHERE id = $2",
            [offset + i + 1, rows[i].id],
          );
        }
        for (let i = 0; i < ordem.length; i++) {
          await runner.query(
            "UPDATE etapas_trilha SET posicao = $1 WHERE id = $2",
            [i + 1, ids.get(ordem[i])],
          );
        }
      }
      await runner.query(
        `UPDATE trilhas SET descricao = $1
         WHERE slug = $2 AND descricao = $3`,
        [
          desfazer ? trilha.descricaoAntiga : trilha.descricaoNova,
          trilha.slug,
          desfazer ? trilha.descricaoNova : trilha.descricaoAntiga,
        ],
      );
    }
  }
}
