import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Trilha } from '../database/entities/catalog.entities';
import { ListarTrilhasDto } from './dto/listar-trilhas.dto';




@Injectable()
export class TrilhasService {
    constructor(
  @InjectRepository(Trilha)
  private readonly trilhasRepository: Repository<Trilha>,
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



}
