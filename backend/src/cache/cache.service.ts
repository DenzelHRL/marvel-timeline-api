import {Injectable, Logger, OnModuleDestroy, OnModuleInit} from "@nestjs/common";
import Redis, {type Redis as RedisClient} from "ioredis";

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy{
    private readonly logger = new Logger(CacheService.name);
    private redisClient: RedisClient | null = null;
    private readonly ttlPadrao = Number(process.env.REDIS_TTL ?? 300);
    
    onModuleInit() {
        const host = process.env.REDIS_HOST ?? "localhost";
        const port = Number(process.env.REDIS_PORT ?? 6379);
        
        try{
            this.redisClient = new Redis ({
                host,
                port,
                maxRetriesPerRequest: 1,
                enableOfflineQueue: false,
                lazyConnect: true
            });

            this.redisClient.on("connect", () => {
                this.logger.log(`Redis conectado em ${host}:${port}`);
            });

            this.redisClient.on("error", (err: Error) => {
                this.logger.warn(`Redis indisponível (${err.message}). Consultas usarão a PostgreSQL diretamente.`);
            });
            
            this.redisClient.connect().catch(() => {
                this.logger.warn("Não foi possível conectar ao Redis ao iniciar. Operando sem cache.");
            });
        } catch (err: unknown){
            this.logger.warn(`Falha ao iniciar cliente Redis: ${(err as Error). message}`);
        }
    }

    async onModuleDestroy(){
        if(this.redisClient){
            await this.redisClient.quit().catch(() => {});
        }
    }

    //Busca item cache
    async obter<T>(chave: string): Promise<T | null>{
        if(!this.redisClient || this.redisClient.status !== "ready"){
            return null;
        }

        try{
            const valor = await this.redisClient.get(chave);
            if(!valor) return null;
            return JSON.parse(valor) as T;
        } catch(err: unknown){
            this.logger.warn(`Erro ao ler chave "${chave}" do Redis: ${(err as Error).message}`);
            return null; 
        }
    }

    //Salva item no cache com tempo de expliração
    async salvar(chave: string, valor: unknown, ttlSegundos?: number): Promise<void>{
        if(!this.redisClient || this.redisClient.status !== "ready"){
            return;
        }

        try{
            const ttl = ttlSegundos ?? this.ttlPadrao;
            const json = JSON.stringify(valor);
            await this.redisClient.set(chave, json, "EX", ttl);
        }catch(err: unknown){
            this.logger.warn(`Erro ao salvar chave "${chave}" no Redis: ${(err as Error). message}`);
        }
    }

    //Invalida um chave específica
    async invalidar(chave: string): Promise<void>{
        if(!this.redisClient || this.redisClient.status !== "ready"){
            return;
        }

        try{
            await this.redisClient.del(chave);
        }catch(err: unknown){
            this.logger.warn(`Erro ao invalidar chave "${chave}": ${(err as Error).message}`);
        }
    }

    //Invalida as chaves com prefixo específico
    async invalidarPorPadrao(padrao: string): Promise<void>{
        if(!this.redisClient || this.redisClient.status !== "ready"){
            return;
        }

        try{
            await new Promise<void>((resolve, reject) =>{
                const stream = this.redisClient!.scanStream({
                    match: padrao,
                    count: 100,
                });

                stream.on("data", async (chaves: string[]) => {
                    if(chaves.length > 0){
                        stream.pause();
                        const pipeline = this.redisClient?.pipeline();
                        chaves.forEach((k) => pipeline?.del(k));
                        await pipeline?.exec();
                        stream.resume();
                    }
                });

                stream.on('end', () => resolve());
                stream.on('error', (err: Error) => reject(err));
            });
        }catch(err: unknown){
            this.logger.warn(`Erro ao invalidar padrão "${padrao}": ${(err as Error).message}`);
        }
    }

    //Gerador de chaves a partir de rotas e parâmetros (helper)
    gerarChave(prefixo: string, params?: object): string {
        if(!params){
            return prefixo;
        }

        const objeto = params as Record<string, unknown>;
        const chaves = Object.keys(objeto);

        if(chaves.length === 0){
            return prefixo;
        }

        const ordenados = chaves
            .filter((k) => objeto[k] !== undefined && objeto[k] !== null)
            .sort()
            .map((k) => `${k}=${String(objeto[k])}`)
            .join("&");

        return `${prefixo}:${ordenados}`;
    }


}