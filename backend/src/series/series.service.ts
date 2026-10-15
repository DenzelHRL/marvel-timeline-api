import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Obra, Serie } from '../database/entities/catalog.entities';
import { ListarSeriesDto } from './dto/listar-series.dto';
import { ListarSeriesRespostaDto, SerieRespostaDto } from './dto/serie-resposta.dto';
import {
  ListarTemporadasSerieDto,
  ListarTemporadasSerieRespostaDto,
} from './dto/listar-temporadas-serie.dto';
import { CriarSerieDto } from './dto/criar-serie.dto';
import { AtualizarSerieDto } from './dto/atualizar-serie.dto';
import { AlterarStatusSerieDto } from './dto/alterar-status-serie.dto';

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Serie)
    private readonly seriesRepository: Repository<Serie>,
    @InjectRepository(Obra)
    private readonly obrasRepo: Repository<Obra>,
  ) {}

  async listarPublicadas(filtros: ListarSeriesDto): Promise<ListarSeriesRespostaDto> {
    const where: FindOptionsWhere<Serie> = {
      status: 'PUBLICADA',
    };

    if (filtros.titulo) {
      where.titulo = ILike(`%${filtros.titulo}%`);
    }

    if (filtros.slug) {
      where.slug = filtros.slug;
    }

    const [dados, total] = await this.seriesRepository.findAndCount({
      where,
      order: { titulo: 'ASC', id: 'ASC' },
      take: filtros.limite,
      skip: (filtros.pagina - 1) * filtros.limite,
    });

    return {
      dados,
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      totalPaginas: Math.ceil(total / filtros.limite),
    };
  }

  async consultarPorSlug(slug: string): Promise<SerieRespostaDto> {
    const serie = await this.seriesRepository.findOne({
      where: {
        slug,
        status: 'PUBLICADA',
      },
    });

    if (!serie) {
      throw new NotFoundException('Série não encontrada.');
    }

    return serie;
  }

  async listarTemporadas(
    slug: string,
    query: ListarTemporadasSerieDto,
  ): Promise<ListarTemporadasSerieRespostaDto> {
    const serie = await this.seriesRepository.findOne({
      where: {
        slug,
        status: 'PUBLICADA',
      },
    });

    if (!serie) {
      throw new NotFoundException('Série não encontrada.');
    }

    const where: FindOptionsWhere<Obra> = {
      serieId: serie.id,
      tipo: 'TEMPORADA',
      status: 'PUBLICADA',
    };

    if (query.numeroTemporada) {
      where.numeroTemporada = query.numeroTemporada;
    }

    if (query.anoLancamento) {
      where.anoLancamento = query.anoLancamento;
    }

    const [dados, total] = await this.obrasRepo.findAndCount({
      where,
      order: { numeroTemporada: 'ASC' },
      take: query.limite,
      skip: (query.pagina - 1) * query.limite,
    });

    return {
      dados,
      total,
      pagina: query.pagina,
      limite: query.limite,
      totalPaginas: Math.ceil(total / query.limite),
    };
  }

  async criar(dto: CriarSerieDto): Promise<Serie> {
    const existe = await this.seriesRepository.findOne({
      where: { slug: dto.slug },
    });

    if (existe) {
      throw new ConflictException('Ja existe uma serie cadastrada com esse slug.');
    }

    const serie = this.seriesRepository.create({
      titulo: dto.titulo,
      slug: dto.slug,
      descricao: dto.descricao,
      imagemUrl: dto.imagemUrl ?? null,
      status: 'RASCUNHO',
    });

    return this.seriesRepository.save(serie);
  }

  async atualizar(id: string, dto: AtualizarSerieDto): Promise<Serie> {
    const serie = await this.seriesRepository.findOne({
      where: { id },
    });

    if (!serie) {
      throw new NotFoundException('Série não encontrada.');
    }

    if (dto.slug && dto.slug !== serie.slug) {
      const slugEmUso = await this.seriesRepository.findOne({
        where: { slug: dto.slug },
      });

      if (slugEmUso) {
        throw new ConflictException('Slug já está em uso por outra série.');
      }
      serie.slug = dto.slug;
    }

    if (dto.titulo !== undefined) {
      serie.titulo = dto.titulo;
    }

    if (dto.descricao !== undefined) {
      serie.descricao = dto.descricao;
    }

    if (dto.imagemUrl !== undefined) {
      serie.imagemUrl = dto.imagemUrl;
    }

    return this.seriesRepository.save(serie);
  }

  async alterarStatus(id: string, dto: AlterarStatusSerieDto): Promise<Serie> {
    const serie = await this.seriesRepository.findOne({
      where: { id },
    });

    if (!serie) {
      throw new NotFoundException('Série não encontrada.');
    }

    // Regra R02: se for arquivar a serie, nao pode ter temporadas publicadas
    if (dto.status === 'ARQUIVADA') {
      const temporadasAtivas = await this.obrasRepo.count({
        where: {
          serieId: id,
          tipo: 'TEMPORADA',
          status: 'PUBLICADA',
        },
      });

      if (temporadasAtivas > 0) {
        throw new BadRequestException(
          'Nao e possivel arquivar uma serie com temporadas publicadas.',
        );
      }
    }

    serie.status = dto.status;
    return this.seriesRepository.save(serie);
  }
}
