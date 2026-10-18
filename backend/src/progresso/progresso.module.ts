import {Module} from "@nestjs/common";
import {ProgressoController} from "./progresso.controller";
import {ProgressoService} from "./progresso.service";

@Module({
    controllers: [ProgressoController],
    providers: [ProgressoService],
    exports: [ProgressoService]
})

export class ProgressoModule{}