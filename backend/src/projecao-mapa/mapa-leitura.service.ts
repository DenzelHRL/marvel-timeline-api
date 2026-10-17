import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CatalogoRevisaoService } from '../catalogo-revisao/catalogo-revisao.service';
import { Trilha } from '../database/entities/catalog.entities';
import { ListarEtapasDto } from '../trilhas/dto/listar-etapas.dto';
import {
  ItemMapaDto,
  MapaTrilhaRespostaDto,
} from '../trilhas/dto/mapa-trilha-resposta.dto';
import { BancoLeituraService } from './banco-leitura.service';

interface MapaRegistro {
  versao: string;
  publicada: boolean;
  itens: ItemMapaDto[];
}

@Injectable()
export class MapaLeituraService {
  private readonly logger = new Logger(MapaLeituraService.name);

  constructor(
    @InjectDataSource()
    private readonly principal: DataSource,
    private readonly bancoLeitura: BancoLeituraService,
    private readonly revisao: CatalogoRevisaoService,
  ) {}

  // Retorna undefined quando o handler deve consultar o banco principal.
  async consultarSeAtual(
    slug: string,
    filtros: ListarEtapasDto,
  ): Promise<MapaTrilhaRespostaDto | undefined> {
    const contexto = await this.principal.transaction(
      'REPEATABLE READ',
      async (manager) => {
        await manager.query('SET TRANSACTION READ ONLY');

        // Publicação e versão são verificadas na fonte oficial.
        const trilha = await manager
          .getRepository(Trilha)
          .findOne({
            where: {
              slug,
              status: 'PUBLICADA',
            },
          });

        if (!trilha) {
          throw new NotFoundException('Trilha não encontrada.');
        }

        return {
          trilhaId: trilha.id,
          versao: await this.revisao.atual(manager),
        };
      },
    );

    let mapa: MapaRegistro | undefined;

    try {
      const leitura = await this.bancoLeitura.obterConexao();

      const registros = await leitura.query<MapaRegistro[]>(
        `
          SELECT
            versao::text AS versao,
            publicada,
            itens
          FROM mapas_leitura
          WHERE trilha_id = $1
        `,
        [contexto.trilhaId],
      );

      mapa = registros[0];
    } catch {
      // Uma falha no segundo banco não interrompe a consulta original.
      this.logger.warn(
        'Projeção indisponível; consulta seguirá no banco principal.',
      );

      return undefined;
    }

    // Nunca utiliza uma projeção de outra versão ou não pública.
    if (
      !mapa ||
      !mapa.publicada ||
      mapa.versao !== contexto.versao
    ) {
      return undefined;
    }

    // Filtra antes de contar e paginar, preservando o contrato da API.
    const obraId = filtros.obraId?.toLowerCase();

    const itens = mapa.itens.filter((item) => {
      const prioridadeCorreta =
        !filtros.prioridade ||
        item.prioridade === filtros.prioridade;

      const obraCorreta =
        !obraId ||
        item.obraId.toLowerCase() === obraId;

      return prioridadeCorreta && obraCorreta;
    });

    const total = itens.length;
    const inicio = (filtros.pagina - 1) * filtros.limite;

    this.logger.debug(
      'Mapa atendido pela projeção no banco de leitura.',
    );

    return {
      dados: itens.slice(inicio, inicio + filtros.limite),
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      totalPaginas: Math.ceil(total / filtros.limite),
    };
  }
}