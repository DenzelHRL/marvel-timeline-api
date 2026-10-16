import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ObrasService } from './obras.service';
import {
  EtapaTrilha,
  Obra,
  Serie,
  Trilha,
} from '../database/entities/catalog.entities';

describe('ObrasService', () => {
  let service: ObrasService;

  const mockObra: Obra = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    slug: 'vingadores-guerra-infinita',
    titulo: 'Vingadores: Guerra Infinita',
    tipo: 'FILME',
    anoLancamento: 2018,
    serieId: null,
    numeroTemporada: null,
    resumoSemSpoiler: 'Os Vingadores enfrentam Thanos.',
    resumoComSpoiler: 'Thanos estala os dedos e metade do universo desaparece.',
    imagemUrl: 'https://exemplo.com/poster.jpg',
    status: 'PUBLICADA',
    criadoEm: new Date('2026-01-01T00:00:00Z'),
    atualizadoEm: new Date('2026-01-01T00:00:00Z'),
  };

  const mockSerie: Serie = {
    id: 's1s2s3s4-e5f6-7890-abcd-ef1234567890',
    slug: 'loki',
    titulo: 'Loki',
    descricao: 'Serie sobre Loki',
    imagemUrl: null,
    status: 'PUBLICADA',
    criadoEm: new Date('2026-01-01T00:00:00Z'),
    atualizadoEm: new Date('2026-01-01T00:00:00Z'),
  };

  const mockTrilha: Trilha = {
    id: 't1t2t3t4-e5f6-7890-abcd-ef1234567890',
    slug: 'curta',
    nome: 'Trilha Curta',
    descricao: 'Trilha curta de filmes',
    status: 'PUBLICADA',
    criadoEm: new Date('2026-01-01T00:00:00Z'),
    atualizadoEm: new Date('2026-01-01T00:00:00Z'),
  };

  const mockRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSeriesRepo = {
    findOne: jest.fn(),
  };

  const mockTrilhasRepo = {
    findOne: jest.fn(),
  };

  const mockEtapasRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObrasService,
        {
          provide: getRepositoryToken(Obra),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Serie),
          useValue: mockSeriesRepo,
        },
        {
          provide: getRepositoryToken(Trilha),
          useValue: mockTrilhasRepo,
        },
        {
          provide: getRepositoryToken(EtapaTrilha),
          useValue: mockEtapasRepo,
        },
      ],
    }).compile();

    service = module.get<ObrasService>(ObrasService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('listarPublicadas', () => {
    it('deve retornar lista paginada e esconder spoilers por padrao (Regra R03)', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockObra], 1]);

      const resultado = await service.listarPublicadas({
        pagina: 1,
        limite: 20,
      });

      expect(resultado.dados[0].resumoComSpoiler).toBeNull();
      expect(resultado.total).toBe(1);
      expect(resultado.totalPaginas).toBe(1);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { status: 'PUBLICADA' },
        order: { anoLancamento: 'ASC', titulo: 'ASC' },
        take: 20,
        skip: 0,
      });
    });

    it('deve aplicar filtros de tipo e ano de lancamento', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockObra], 1]);

      await service.listarPublicadas({
        tipo: 'FILME',
        anoLancamento: 2018,
        pagina: 1,
        limite: 10,
      });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'PUBLICADA',
            tipo: 'FILME',
            anoLancamento: 2018,
          },
          take: 10,
          skip: 0,
        }),
      );
    });
  });

  describe('consultarPorSlug', () => {
    it('deve retornar obra sem spoiler se incluirSpoilers nao for passado (Regra R03)', async () => {
      const obraClone = { ...mockObra };
      mockRepository.findOne.mockResolvedValue(obraClone);

      const resultado = await service.consultarPorSlug('vingadores-guerra-infinita');

      expect(resultado.resumoComSpoiler).toBeNull();
      expect(resultado.resumoSemSpoiler).toBe(mockObra.resumoSemSpoiler);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          slug: 'vingadores-guerra-infinita',
          status: 'PUBLICADA',
        },
      });
    });

    it('deve retornar obra com spoiler se incluirSpoilers for true (Regra R03)', async () => {
      const obraClone = { ...mockObra };
      mockRepository.findOne.mockResolvedValue(obraClone);

      const resultado = await service.consultarPorSlug('vingadores-guerra-infinita', {
        incluirSpoilers: true,
      });

      expect(resultado.resumoComSpoiler).toBe(mockObra.resumoComSpoiler);
    });

    it('deve lancar NotFoundException se a obra nao for encontrada', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.consultarPorSlug('obra-fantasma'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('criar', () => {
    it('deve criar um filme com status RASCUNHO com sucesso (Regra R04)', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockObra);
      mockRepository.save.mockResolvedValue(mockObra);

      const resultado = await service.criar({
        titulo: 'Vingadores: Guerra Infinita',
        slug: 'vingadores-guerra-infinita',
        tipo: 'FILME',
        anoLancamento: 2018,
        resumoSemSpoiler: 'Os Vingadores enfrentam Thanos.',
      });

      expect(resultado).toEqual(mockObra);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'FILME',
          serieId: null,
          numeroTemporada: null,
          status: 'RASCUNHO',
        }),
      );
    });

    it('deve rejeitar filme que possui serieId ou numeroTemporada (Regra R04)', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.criar({
          titulo: 'Filme Invalido',
          slug: 'filme-invalido',
          tipo: 'FILME',
          anoLancamento: 2020,
          serieId: mockSerie.id,
          resumoSemSpoiler: 'Resumo',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve criar uma temporada vinculada a serie existente (Regra R04)', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockSeriesRepo.findOne.mockResolvedValue(mockSerie);
      const temporadaCriada = {
        ...mockObra,
        tipo: 'TEMPORADA' as const,
        serieId: mockSerie.id,
        numeroTemporada: 1,
      };
      mockRepository.create.mockReturnValue(temporadaCriada);
      mockRepository.save.mockResolvedValue(temporadaCriada);

      const resultado = await service.criar({
        titulo: 'Loki - Temporada 1',
        slug: 'loki-temporada-1',
        tipo: 'TEMPORADA',
        anoLancamento: 2021,
        serieId: mockSerie.id,
        numeroTemporada: 1,
        resumoSemSpoiler: 'Loki na AVT.',
      });

      expect(resultado.tipo).toBe('TEMPORADA');
      expect(resultado.serieId).toBe(mockSerie.id);
    });

    it('deve rejeitar temporada sem serieId ou sem numeroTemporada (Regra R04)', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.criar({
          titulo: 'Temporada Sem Serie',
          slug: 'temporada-sem-serie',
          tipo: 'TEMPORADA',
          anoLancamento: 2021,
          resumoSemSpoiler: 'Resumo',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar temporada com numero repetido para a mesma serie (Regra R04)', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockObra);
      mockSeriesRepo.findOne.mockResolvedValue(mockSerie);

      await expect(
        service.criar({
          titulo: 'Loki - Temporada 1 Repetida',
          slug: 'loki-temporada-1-rep',
          tipo: 'TEMPORADA',
          anoLancamento: 2021,
          serieId: mockSerie.id,
          numeroTemporada: 1,
          resumoSemSpoiler: 'Resumo',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve rejeitar obra com slug ja existente', async () => {
      mockRepository.findOne.mockResolvedValue(mockObra);

      await expect(
        service.criar({
          titulo: 'Obra Repetida',
          slug: 'vingadores-guerra-infinita',
          tipo: 'FILME',
          anoLancamento: 2018,
          resumoSemSpoiler: 'Resumo',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar metadados da obra com sucesso (Regra R04)', async () => {
      const obraExistente = { ...mockObra };
      mockRepository.findOne.mockResolvedValue(obraExistente);
      mockRepository.save.mockImplementation(async (o) => o);

      const resultado = await service.atualizar(mockObra.id, {
        titulo: 'Vingadores: Guerra Infinita (Versao Imax)',
      });

      expect(resultado.titulo).toBe('Vingadores: Guerra Infinita (Versao Imax)');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('deve lancar NotFoundException se a obra nao existir', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.atualizar('id-inexistente', { titulo: 'Novo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lancar ConflictException se o novo slug ja estiver em uso', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce({ ...mockObra, slug: 'slug-antigo' })
        .mockResolvedValueOnce({ ...mockObra, id: 'outro-id', slug: 'novo-slug' });

      await expect(
        service.atualizar(mockObra.id, { slug: 'novo-slug' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('alterarStatus', () => {
    it('deve alterar status com sucesso', async () => {
      const obra = { ...mockObra, status: 'RASCUNHO' as const };
      mockRepository.findOne.mockResolvedValue(obra);
      mockRepository.save.mockImplementation(async (o) => o);

      const resultado = await service.alterarStatus(mockObra.id, {
        status: 'PUBLICADA',
      });

      expect(resultado.status).toBe('PUBLICADA');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('deve bloquear publicacao de temporada se a serie nao estiver PUBLICADA (Regra R02)', async () => {
      const temporada = {
        ...mockObra,
        tipo: 'TEMPORADA' as const,
        serieId: mockSerie.id,
        status: 'RASCUNHO' as const,
      };
      mockRepository.findOne.mockResolvedValue(temporada);
      mockSeriesRepo.findOne.mockResolvedValue({
        ...mockSerie,
        status: 'RASCUNHO',
      });

      await expect(
        service.alterarStatus(temporada.id, { status: 'PUBLICADA' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve bloquear arquivamento se a obra pertencer a trilha PUBLICADA (Regra R02)', async () => {
      mockRepository.findOne.mockResolvedValue(mockObra);
      mockEtapasRepo.find.mockResolvedValue([
        { trilhaId: mockTrilha.id, obraId: mockObra.id },
      ]);
      mockTrilhasRepo.findOne.mockResolvedValue(mockTrilha);

      await expect(
        service.alterarStatus(mockObra.id, { status: 'ARQUIVADA' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve permitir arquivar obra se nao pertencer a trilhas publicadas (Regra R02)', async () => {
      const obra = { ...mockObra, status: 'PUBLICADA' as const };
      mockRepository.findOne.mockResolvedValue(obra);
      mockEtapasRepo.find.mockResolvedValue([]);
      mockRepository.save.mockImplementation(async (o) => o);

      const resultado = await service.alterarStatus(mockObra.id, {
        status: 'ARQUIVADA',
      });

      expect(resultado.status).toBe('ARQUIVADA');
    });

    it('deve lancar NotFoundException se a obra nao existir', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.alterarStatus('id-inexistente', { status: 'PUBLICADA' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
