import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  ILike,
  QueryFailedError,
} from 'typeorm';
import {
  Trilha,
  EtapaTrilha,
  Obra,
} from '../database/entities/catalog.entities';
import { CriarTrilhaDto } from './dto/criar-trilha.dto';
import { AtualizarTrilhaDto } from './dto/atualizar-trilha.dto';
import { AlterarStatusTrilhaDto } from './dto/alterar-status-trilha.dto';
import { CriarEtapaDto } from './dto/criar-etapa.dto';
import { ListarTrilhasDto } from './dto/listar-trilhas.dto';
import { ListarEtapasDto } from './dto/listar-etapas.dto';
import {CacheService} from '../cache/cache.service';
import {
  ItemMapaDto,
  MapaTrilhaRespostaDto,
} from './dto/mapa-trilha-resposta.dto';

@Injectable()
export class TrilhasService {
  constructor(
    @InjectRepository(Trilha)
    private readonly trilhasRepository: Repository<Trilha>,

    @InjectRepository(EtapaTrilha)
    private readonly etapasRepository: Repository<EtapaTrilha>,
  
    private readonly cacheService: CacheService
  ) {}

  async listarPublicadas(filtros: ListarTrilhasDto) {
    const chaveCache = this.cacheService.gerarChave("trilhas:publicadas", filtros);
    const emCache = await this.cacheService.obter(chaveCache);
    if(emCache) return emCache;

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

    const resposta = {
      dados,
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      totalPaginas: Math.ceil(total / filtros.limite),
    }

    await this.cacheService.salvar(chaveCache, resposta);
    return resposta;
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
    const chaveCache = this.cacheService.gerarChave(`trilhas:${slug}:etapas`, filtros);
    const emCache = await this.cacheService.obter(chaveCache);
    if(emCache) return emCache;

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

    const [dados, total] = await consulta
      .orderBy('etapa.posicao', 'ASC')
      .addOrderBy('etapa.id', 'ASC')
      .skip((filtros.pagina - 1) * filtros.limite)
      .take(filtros.limite)
      .getManyAndCount();


    const resposta = {
      dados,
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      totalPaginas: Math.ceil(total / filtros.limite),
    }

    await this.cacheService.salvar(chaveCache, resposta);
    return resposta;
  }

  async consultarMapa(
    slug: string,
    filtros: ListarEtapasDto,
  ): Promise<MapaTrilhaRespostaDto> {
    const chaveCache = this.cacheService.gerarChave(`trilhas:${slug}:mapa`, filtros);
    const emCache = await this.cacheService.obter<MapaTrilhaRespostaDto>(chaveCache);
    if (emCache) return emCache;

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


    const resposta = {
      dados,
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      totalPaginas: Math.ceil(total / filtros.limite),
    }

    await this.cacheService.salvar(chaveCache, resposta);
    return resposta;
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

  async criar(dto: CriarTrilhaDto): Promise<Trilha> {
    const existente = await this.trilhasRepository.findOne({
      where: { slug: dto.slug },
    });

    if (existente) {
      throw new ConflictException(
        'Já existe uma trilha com esse slug.',
      );
    }

    const trilha = this.trilhasRepository.create({
      nome: dto.nome,
      slug: dto.slug,
      descricao: dto.descricao,
      status: 'RASCUNHO',
    });

    try {
      await this.cacheService.invalidarPorPadrao('trilhas:*');
      return await this.trilhasRepository.save(trilha);
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as {
          code?: string;
        };

        if (driverError.code === '23505') {
          throw new ConflictException(
            'Já existe uma trilha com esse slug.',
          );
        }
      }

      throw error;
    }
  }

  async atualizar(
    id: string,
    dto: AtualizarTrilhaDto,
  ): Promise<Trilha> {
    const trilha = await this.trilhasRepository.findOne({
      where: { id },
    });

    if (!trilha) {
      throw new NotFoundException('Trilha não encontrada.');
    }

    if (dto.slug !== undefined && dto.slug !== trilha.slug) {
      const existente = await this.trilhasRepository.findOne({
        where: { slug: dto.slug },
      });

      if (existente) {
        throw new ConflictException(
          'Já existe uma trilha com esse slug.',
        );
      }
    }

    if (dto.nome !== undefined) {
      trilha.nome = dto.nome;
    }

    if (dto.slug !== undefined) {
      trilha.slug = dto.slug;
    }

    if (dto.descricao !== undefined) {
      trilha.descricao = dto.descricao;
    }

    try {
      await this.cacheService.invalidarPorPadrao('trilhas:*');
      return await this.trilhasRepository.save(trilha);
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as {
          code?: string;
        };

        if (driverError.code === '23505') {
          throw new ConflictException(
            'Já existe uma trilha com esse slug.',
          );
        }
      }

      throw error;
    }
  }

  async alterarStatus(
    id: string,
    dto: AlterarStatusTrilhaDto,
  ): Promise<Trilha> {
    return this.trilhasRepository.manager.transaction(
      async (manager) => {
        const trilhasRepository = manager.getRepository(Trilha);

        const trilha = await trilhasRepository.findOne({
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!trilha) {
          throw new NotFoundException('Trilha não encontrada.');
        }

        if (dto.status === 'PUBLICADA') {
          const etapasValidas = await manager
            .getRepository(EtapaTrilha)
            .createQueryBuilder('etapa')
            .innerJoin(Obra, 'obra', 'obra.id = etapa.obraId')
            .where('etapa.trilhaId = :trilhaId', {
              trilhaId: trilha.id,
            })
            .andWhere('obra.status = :status', {
              status: 'PUBLICADA',
            })
            .getCount();

          if (etapasValidas === 0) {
            throw new BadRequestException(
              'A trilha precisa ter ao menos uma etapa com obra publicada para ser publicada.',
            );
          }
        }

        trilha.status = dto.status;

        await this.cacheService.invalidarPorPadrao('trilhas:*');
        return trilhasRepository.save(trilha);
      },
    );
  }

  async criarEtapa(
    trilhaId: string,
    dto: CriarEtapaDto,
  ): Promise<EtapaTrilha> {
    return this.trilhasRepository.manager.transaction(
      async (manager) => {
        const trilhasRepository = manager.getRepository(Trilha);
        const etapasRepository = manager.getRepository(EtapaTrilha);
        const obrasRepository = manager.getRepository(Obra);

        const trilha = await trilhasRepository.findOne({
          where: { id: trilhaId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!trilha) {
          throw new NotFoundException('Trilha não encontrada.');
        }

        const obra = await obrasRepository.findOne({
          where: { id: dto.obraId },
          lock: { mode: 'pessimistic_read' },
        });

        if (!obra) {
          throw new NotFoundException('Obra não encontrada.');
        }

        if (
          trilha.status === 'PUBLICADA' &&
          obra.status !== 'PUBLICADA'
        ) {
          throw new BadRequestException(
            'Uma trilha publicada só pode receber obras publicadas.',
          );
        }

        const etapas = await etapasRepository.find({
          where: { trilhaId },
          order: { posicao: 'DESC' },
        });

        const obraJaVinculada = etapas.some(
          (etapa) => etapa.obraId === dto.obraId,
        );

        if (obraJaVinculada) {
          throw new ConflictException(
            'Essa obra já está vinculada à trilha.',
          );
        }

        const maiorPosicao = etapas[0]?.posicao ?? 0;

        if (maiorPosicao >= 2147483647) {
          throw new BadRequestException(
            'A trilha atingiu o limite permitido de posições.',
          );
        }

        if (dto.posicao > maiorPosicao + 1) {
          throw new BadRequestException(
            `A posição deve estar entre 1 e ${maiorPosicao + 1}.`,
          );
        }

        
        for (const etapa of etapas) {
          if (etapa.posicao >= dto.posicao) {
            await etapasRepository.update(etapa.id, {
              posicao: etapa.posicao + 1,
            });
          }
        }

        const novaEtapa = etapasRepository.create({
          trilhaId,
          obraId: dto.obraId,
          posicao: dto.posicao,
          prioridade: dto.prioridade,
          justificativa: dto.justificativa ?? null,
        });

        await this.cacheService.invalidarPorPadrao('trilhas:*');
        return etapasRepository.save(novaEtapa);
      },
    );
  }
}