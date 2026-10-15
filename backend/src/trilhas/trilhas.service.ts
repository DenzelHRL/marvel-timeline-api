import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Trilha, EtapaTrilha, Obra } from '../database/entities/catalog.entities';
import { ListarTrilhasDto } from './dto/listar-trilhas.dto';
import { ListarEtapasDto } from './dto/listar-etapas.dto';
import { ItemMapaDto, MapaTrilhaRespostaDto } from './dto/mapa-trilha-resposta.dto';



@Injectable()
export class TrilhasService {
    constructor(
  @InjectRepository(Trilha)
  private readonly trilhasRepository: Repository<Trilha>,

  @InjectRepository(EtapaTrilha)
  private readonly etapasRepository: Repository<EtapaTrilha>,
) {}

async listarPublicadas(filtros: ListarTrilhasDto){
    const where: FindOptionsWhere<Trilha> = {
    status: 'PUBLICADA',
  };

  if (filtros.nome) {
    where.nome = ILike(`%${filtros.nome}%`);
  }

  if (filtros.slug) {
    where.slug = filtros.slug;
  }

  const [dados, total] = await this.trilhasRepository.findAndCount({
  where,
  order: { nome: 'ASC', id: 'ASC' },
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

async buscarPublicadaPorSlug(slug: string) {
  const trilha = await this.trilhasRepository.findOne({
    where: {
      slug,
      status: 'PUBLICADA',
    },
  });

  if (!trilha) {
    throw new NotFoundException('Trilha não encontrada.');
  }

  return trilha;
}

async listarEtapas(slug: string, filtros: ListarEtapasDto) {
  const trilha = await this.buscarPublicadaPorSlug(slug);

  const consulta = this.etapasRepository
    .createQueryBuilder('etapa')
    .innerJoin(
      Obra,
      'obra',
      'obra.id = etapa.obraId',
    )
    .where('etapa.trilhaId = :trilhaId', {
      trilhaId: trilha.id,
    })
    .andWhere('obra.status = :status', {
      status: 'PUBLICADA',
    });

  if (filtros.prioridade) {
    consulta.andWhere('etapa.prioridade = :prioridade', {
      prioridade: filtros.prioridade,
    });
  }

  if (filtros.obraId) {
    consulta.andWhere('etapa.obraId = :obraId', {
      obraId: filtros.obraId,
    });
  }

  const [dados, total] = await consulta
    .orderBy('etapa.posicao', 'ASC')
    .addOrderBy('etapa.id', 'ASC')
    .skip((filtros.pagina - 1) * filtros.limite)
    .take(filtros.limite)
    .getManyAndCount();

  return {
    dados,
    total,
    pagina: filtros.pagina,
    limite: filtros.limite,
    totalPaginas: Math.ceil(total / filtros.limite),
  };
}

async consultarMapa(
  slug: string,
  filtros: ListarEtapasDto,
): Promise<MapaTrilhaRespostaDto> {
  const trilha = await this.buscarPublicadaPorSlug(slug);

  const consulta = this.etapasRepository
    .createQueryBuilder('etapa')
    .innerJoin(Obra, 'obra', 'obra.id = etapa.obraId')
    .where('etapa.trilhaId = :trilhaId', {
      trilhaId: trilha.id,
    })
    .andWhere('obra.status = :status', {
      status: 'PUBLICADA',
    });

  if (filtros.prioridade) {
    consulta.andWhere('etapa.prioridade = :prioridade', {
      prioridade: filtros.prioridade,
    });
  }

  if (filtros.obraId) {
    consulta.andWhere('etapa.obraId = :obraId', {
      obraId: filtros.obraId,
    });
  }

  const total = await consulta.getCount();

  const dados = await consulta
    .select('etapa.id', 'id')
    .addSelect('etapa.trilhaId', 'trilhaId')
    .addSelect('etapa.obraId', 'obraId')
    .addSelect('etapa.posicao', 'posicao')
    .addSelect('etapa.prioridade', 'prioridade')
    .addSelect('etapa.justificativa', 'justificativa')
    .addSelect('obra.slug', 'obraSlug')
    .addSelect('obra.titulo', 'titulo')
    .addSelect('obra.imagemUrl', 'imagemUrl')
    .addSelect('obra.resumoSemSpoiler', 'resumoSemSpoiler')
    .orderBy('etapa.posicao', 'ASC')
    .addOrderBy('etapa.id', 'ASC')
    .offset((filtros.pagina - 1) * filtros.limite)
    .limit(filtros.limite)
    .getRawMany<ItemMapaDto>();

  return {
    dados,
    total,
    pagina: filtros.pagina,
    limite: filtros.limite,
    totalPaginas: Math.ceil(total / filtros.limite),
  };
}

async consultarObraNaTrilha(slug: string, obraSlug: string) {
  const trilha = await this.buscarPublicadaPorSlug(slug);

  const consulta = this.etapasRepository
    .createQueryBuilder('etapa')
    .innerJoin(Obra, 'obra', 'obra.id = etapa.obraId')
    .where('etapa.trilhaId = :trilhaId', {
      trilhaId: trilha.id,
    })
    .andWhere('obra.status = :status', {
      status: 'PUBLICADA',
    })
    .select('etapa.id', 'id')
    .addSelect('etapa.trilhaId', 'trilhaId')
    .addSelect('etapa.obraId', 'obraId')
    .addSelect('etapa.posicao', 'posicao')
    .addSelect('etapa.prioridade', 'prioridade')
    .addSelect('etapa.justificativa', 'justificativa')
    .addSelect('obra.slug', 'obraSlug')
    .addSelect('obra.titulo', 'titulo')
    .addSelect('obra.imagemUrl', 'imagemUrl')
    .addSelect('obra.resumoSemSpoiler', 'resumoSemSpoiler');

  const atual = await consulta
    .clone()
    .andWhere('obra.slug = :obraSlug', { obraSlug })
    .getRawOne<ItemMapaDto>();

  if (!atual) {
    throw new NotFoundException(
      'Obra não encontrada nesta trilha publicada.',
    );
  }

  const [anterior, proxima] = await Promise.all([
    consulta
      .clone()
      .andWhere('etapa.posicao < :posicao', {
        posicao: atual.posicao,
      })
      .orderBy('etapa.posicao', 'DESC')
      .limit(1)
      .getRawOne<ItemMapaDto>(),

    consulta
      .clone()
      .andWhere('etapa.posicao > :posicao', {
        posicao: atual.posicao,
      })
      .orderBy('etapa.posicao', 'ASC')
      .limit(1)
      .getRawOne<ItemMapaDto>(),
  ]);

  return {
    atual,
    anterior: anterior ?? null,
    proxima: proxima ?? null,
  };
}



}
