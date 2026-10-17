import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import {
  EtapaTrilha,
  Obra,
  Serie,
  TipoObra,
  Trilha,
} from '../database/entities/catalog.entities';
import { ListarObrasDto } from './dto/listar-obras.dto';
import { ListarObrasAdminDto } from './dto/listar-obras-admin.dto';
import { ConsultarObraDto } from './dto/consultar-obra.dto';
import { ListarObrasRespostaDto, ObraRespostaDto } from './dto/obra-resposta.dto';
import { CriarObraDto } from './dto/criar-obra.dto';
import { AtualizarObraDto } from './dto/atualizar-obra.dto';
import { AlterarStatusObraDto } from './dto/alterar-status-obra.dto';

@Injectable()
export class ObrasService {
  constructor(
    @InjectRepository(Obra)
    private readonly obrasRepo: Repository<Obra>,
    @InjectRepository(Serie)
    private readonly seriesRepo: Repository<Serie>,
    @InjectRepository(Trilha)
    private readonly trilhasRepo: Repository<Trilha>,
    @InjectRepository(EtapaTrilha)
    private readonly etapasRepo: Repository<EtapaTrilha>,
  ) {}

  async listarPublicadas(filtros: ListarObrasDto): Promise<ListarObrasRespostaDto> {
    const where: FindOptionsWhere<Obra> = {
      status: 'PUBLICADA',
    };

    if (filtros.tipo) {
      where.tipo = filtros.tipo;
    }

    if (filtros.anoLancamento) {
      where.anoLancamento = filtros.anoLancamento;
    }

    const [obras, total] = await this.obrasRepo.findAndCount({
      where,
      order: { anoLancamento: 'ASC', titulo: 'ASC' },
      take: filtros.limite,
      skip: (filtros.pagina - 1) * filtros.limite,
    });

    // Regra R03: leitura publica padrao nao exibe resumo com spoiler
    const dados = obras.map((obra) => ({
      ...obra,
      resumoComSpoiler: null,
    }));

    return {
      dados,
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      totalPaginas: Math.ceil(total / filtros.limite),
    };
  }

  async consultarPorSlug(
    slug: string,
    query?: ConsultarObraDto,
  ): Promise<ObraRespostaDto> {
    const obra = await this.obrasRepo.findOne({
      where: {
        slug,
        status: 'PUBLICADA',
      },
    });

    if (!obra) {
      throw new NotFoundException('Obra não encontrada.');
    }

    // Regra R03: só exibe resumo com spoiler se explicitamente solicitado
    if (!query?.incluirSpoilers) {
      obra.resumoComSpoiler = null;
    }

    return obra;
  }

  // Regra R04: valida coerencia de tipo e serie/temporada
  private async validarCoerenciaObra(
    tipo: TipoObra,
    serieId?: string | null,
    numeroTemporada?: number | null,
    obraIdIgnorar?: string,
  ): Promise<void> {
    if (tipo === 'FILME') {
      if (serieId) {
        throw new BadRequestException('Filme nao pode ter serie associada.');
      }
      if (numeroTemporada) {
        throw new BadRequestException('Filme nao pode ter numero de temporada.');
      }
    } else if (tipo === 'TEMPORADA') {
      if (!serieId) {
        throw new BadRequestException('Temporada precisa estar associada a uma serie.');
      }
      if (!numeroTemporada) {
        throw new BadRequestException('Temporada precisa ter o numero da temporada.');
      }

      const serie = await this.seriesRepo.findOne({ where: { id: serieId } });
      if (!serie) {
        throw new NotFoundException('Serie informada nao foi encontrada.');
      }

      const temporadaExistente = await this.obrasRepo.findOne({
        where: { serieId, numeroTemporada },
      });

      if (temporadaExistente && temporadaExistente.id !== obraIdIgnorar) {
        throw new ConflictException(
          'Ja existe uma temporada com esse numero para esta serie.',
        );
      }
    }
  }

  async criar(dto: CriarObraDto): Promise<Obra> {
    const slugExiste = await this.obrasRepo.findOne({ where: { slug: dto.slug } });
    if (slugExiste) {
      throw new ConflictException('Ja existe uma obra com esse slug.');
    }

    // Valida Regra R04
    await this.validarCoerenciaObra(
      dto.tipo,
      dto.serieId,
      dto.numeroTemporada,
    );

    const obra = this.obrasRepo.create({
      titulo: dto.titulo,
      slug: dto.slug,
      tipo: dto.tipo,
      anoLancamento: dto.anoLancamento,
      serieId: dto.tipo === 'TEMPORADA' ? dto.serieId : null,
      numeroTemporada: dto.tipo === 'TEMPORADA' ? dto.numeroTemporada : null,
      resumoSemSpoiler: dto.resumoSemSpoiler,
      resumoComSpoiler: dto.resumoComSpoiler ?? null,
      imagemUrl: dto.imagemUrl ?? null,
      status: 'RASCUNHO',
    });

    return this.obrasRepo.save(obra);
  }

  async atualizar(id: string, dto: AtualizarObraDto): Promise<Obra> {
    const obra = await this.obrasRepo.findOne({ where: { id } });
    if (!obra) {
      throw new NotFoundException('Obra não encontrada.');
    }

    if (dto.slug && dto.slug !== obra.slug) {
      const slugEmUso = await this.obrasRepo.findOne({ where: { slug: dto.slug } });
      if (slugEmUso) {
        throw new ConflictException('Slug já está em uso por outra obra.');
      }
      obra.slug = dto.slug;
    }

    const novoTipo = dto.tipo ?? obra.tipo;
    const novoSerieId =
      dto.serieId !== undefined ? dto.serieId : obra.serieId;
    const novoNumero =
      dto.numeroTemporada !== undefined ? dto.numeroTemporada : obra.numeroTemporada;

    // Valida Regra R04
    await this.validarCoerenciaObra(novoTipo, novoSerieId, novoNumero, id);

    if (dto.titulo !== undefined) obra.titulo = dto.titulo;
    if (dto.tipo !== undefined) obra.tipo = dto.tipo;
    if (dto.anoLancamento !== undefined) obra.anoLancamento = dto.anoLancamento;
    if (dto.serieId !== undefined) obra.serieId = dto.serieId;
    if (dto.numeroTemporada !== undefined) obra.numeroTemporada = dto.numeroTemporada;
    if (dto.resumoSemSpoiler !== undefined) obra.resumoSemSpoiler = dto.resumoSemSpoiler;
    if (dto.resumoComSpoiler !== undefined) obra.resumoComSpoiler = dto.resumoComSpoiler;
    if (dto.imagemUrl !== undefined) obra.imagemUrl = dto.imagemUrl;

    return this.obrasRepo.save(obra);
  }

  async alterarStatus(id: string, dto: AlterarStatusObraDto): Promise<Obra> {
    const obra = await this.obrasRepo.findOne({ where: { id } });
    if (!obra) {
      throw new NotFoundException('Obra não encontrada.');
    }

    // Regra R02: para publicar uma temporada, a serie precisa estar PUBLICADA
    if (dto.status === 'PUBLICADA' && obra.tipo === 'TEMPORADA' && obra.serieId) {
      const serie = await this.seriesRepo.findOne({ where: { id: obra.serieId } });
      if (!serie || serie.status !== 'PUBLICADA') {
        throw new BadRequestException(
          'Nao e possivel publicar temporada de uma serie que nao esta publicada.',
        );
      }
    }

    // Regra R02: para arquivar uma obra, ela nao pode estar em trilhas publicadas
    if (dto.status === 'ARQUIVADA') {
      const etapas = await this.etapasRepo.find({ where: { obraId: id } });
      if (etapas.length > 0) {
        const trilhaIds = etapas.map((e) => e.trilhaId);
        const trilhaPublicada = await this.trilhasRepo.findOne({
          where: {
            id: In(trilhaIds),
            status: 'PUBLICADA',
          },
        });
        if (trilhaPublicada) {
          throw new BadRequestException(
            'Nao e possivel arquivar obra que pertence a uma trilha publicada.',
          );
        }
      }
    }

    obra.status = dto.status;
    return this.obrasRepo.save(obra);
  }

  // Endpoints administrativos (#76 e #77)
  async listarAdmin(
    filtros: ListarObrasAdminDto,
  ): Promise<ListarObrasRespostaDto> {
    const where: FindOptionsWhere<Obra> = {};

    if (filtros.tipo) {
      where.tipo = filtros.tipo;
    }

    if (filtros.status) {
      where.status = filtros.status;
    }

    const [obras, total] = await this.obrasRepo.findAndCount({
      where,
      order: { anoLancamento: 'ASC', titulo: 'ASC' },
      take: filtros.limite,
      skip: (filtros.pagina - 1) * filtros.limite,
    });

    // Rota administrativa: inclui todos os campos sem ocultar spoiler para permitir edicao
    return {
      dados: obras,
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      totalPaginas: Math.ceil(total / filtros.limite),
    };
  }

  async consultarPorIdAdmin(id: string): Promise<ObraRespostaDto> {
    const obra = await this.obrasRepo.findOne({ where: { id } });
    if (!obra) {
      throw new NotFoundException('Obra não encontrada.');
    }
    return obra;
  }
}
