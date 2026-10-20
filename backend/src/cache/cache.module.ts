import {Global, Module} from "@nestjs/common";
import {CacheService} from "./cache.service";

//Global pode injetar o CacheService no construtor 
//sem ficar importando o CacheModule em outros módulos
@Global()
@Module({
    providers: [CacheService],
    exports: [CacheService]
})

export class CacheModule{}