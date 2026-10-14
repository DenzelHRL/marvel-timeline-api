import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Serie } from '../database/entities/catalog.entities';
import { ListarSeriesDto } from './dto/listar-series.dto';
import { ListarSeriesRespostaDto, SerieRespostaDto } from './dto/serie-resposta.dto';

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Serie)
    private readonly seriesRepository: Repository<Serie>,
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
}
