import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ObrasService } from './obras.service';
import { Obra } from '../database/entities/catalog.entities';

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

  const mockRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
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
});
