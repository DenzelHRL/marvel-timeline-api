import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Obra } from '../database/entities/catalog.entities';
import { ListarObrasDto } from './dto/listar-obras.dto';
import { ConsultarObraDto } from './dto/consultar-obra.dto';
import { ListarObrasRespostaDto, ObraRespostaDto } from './dto/obra-resposta.dto';

@Injectable()
export class ObrasService {
  constructor(
    @InjectRepository(Obra)
    private readonly obrasRepo: Repository<Obra>,
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
}
