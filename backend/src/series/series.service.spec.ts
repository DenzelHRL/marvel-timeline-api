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
});
