import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SeriesService } from './series.service';
import { Obra, Serie } from '../database/entities/catalog.entities';

describe('SeriesService', () => {
  let service: SeriesService;

  const mockSerie: Serie = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    slug: 'loki',
    titulo: 'Loki',
    descricao: 'Série sobre o Deus da Trapaça.',
    imagemUrl: 'https://exemplo.com/loki.jpg',
    status: 'PUBLICADA',
    criadoEm: new Date('2026-01-01T00:00:00Z'),
    atualizadoEm: new Date('2026-01-01T00:00:00Z'),
  };

  const mockTemporada: Obra = {
    id: 'e58bc10b-58cc-4372-a567-0e02b2c3d999',
    slug: 'loki-temporada-1',
    titulo: 'Loki — Temporada 1',
    tipo: 'TEMPORADA',
    anoLancamento: 2021,
    serieId: mockSerie.id,
    numeroTemporada: 1,
    resumoSemSpoiler: 'Loki na AVT.',
    resumoComSpoiler: null,
    imagemUrl: null,
    status: 'PUBLICADA',
    criadoEm: new Date('2026-01-01T00:00:00Z'),
    atualizadoEm: new Date('2026-01-01T00:00:00Z'),
  };

  const mockRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
  };

  const mockObrasRepo = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeriesService,
        {
          provide: getRepositoryToken(Serie),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Obra),
          useValue: mockObrasRepo,
        },
      ],
    }).compile();

    service = module.get<SeriesService>(SeriesService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('listarPublicadas', () => {
    it('deve retornar lista paginada com metadados corretos', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockSerie], 1]);

      const resultado = await service.listarPublicadas({
        pagina: 1,
        limite: 20,
      });

      expect(resultado).toEqual({
        dados: [mockSerie],
        total: 1,
        pagina: 1,
        limite: 20,
        totalPaginas: 1,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledTimes(1);
    });

    it('deve filtrar por título e slug quando fornecidos', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockSerie], 1]);

      await service.listarPublicadas({
        titulo: 'Loki',
        slug: 'loki',
        pagina: 1,
        limite: 10,
      });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
        }),
      );
    });
  });

  describe('consultarPorSlug', () => {
    it('deve retornar a série quando encontrada e publicada', async () => {
      mockRepository.findOne.mockResolvedValue(mockSerie);

      const resultado = await service.consultarPorSlug('loki');

      expect(resultado).toEqual(mockSerie);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          slug: 'loki',
          status: 'PUBLICADA',
        },
      });
    });

    it('deve lançar NotFoundException se a série não for encontrada', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.consultarPorSlug('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listarTemporadas', () => {
    it('deve retornar temporadas de uma serie publicada', async () => {
      mockRepository.findOne.mockResolvedValue(mockSerie);
      mockObrasRepo.findAndCount.mockResolvedValue([[mockTemporada], 1]);

      const resultado = await service.listarTemporadas('loki', {
        pagina: 1,
        limite: 20,
      });

      expect(resultado).toEqual({
        dados: [mockTemporada],
        total: 1,
        pagina: 1,
        limite: 20,
        totalPaginas: 1,
      });
      expect(mockObrasRepo.findAndCount).toHaveBeenCalledWith({
        where: {
          serieId: mockSerie.id,
          tipo: 'TEMPORADA',
          status: 'PUBLICADA',
        },
        order: { numeroTemporada: 'ASC' },
        take: 20,
        skip: 0,
      });
    });

    it('deve aplicar filtros de numero da temporada e ano de lancamento', async () => {
      mockRepository.findOne.mockResolvedValue(mockSerie);
      mockObrasRepo.findAndCount.mockResolvedValue([[mockTemporada], 1]);

      await service.listarTemporadas('loki', {
        numeroTemporada: 1,
        anoLancamento: 2021,
        pagina: 1,
        limite: 10,
      });

      expect(mockObrasRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            numeroTemporada: 1,
            anoLancamento: 2021,
          }),
          take: 10,
          skip: 0,
        }),
      );
    });

    it('deve retornar erro se a serie nao for encontrada', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.listarTemporadas('serie-inexistente', { pagina: 1, limite: 20 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
