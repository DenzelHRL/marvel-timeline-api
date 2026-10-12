import { Test, TestingModule } from '@nestjs/testing';
import { AcessoService } from './acesso.service';

describe('AcessoService', () => {
  let service: AcessoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AcessoService],
    }).compile();

    service = module.get<AcessoService>(AcessoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
