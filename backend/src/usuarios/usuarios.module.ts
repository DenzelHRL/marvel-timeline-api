import {Module} from "@nestjs/common";
import {UsuariosController} from "./usuarios.controller";
import {UsuariosService} from "./usuarios.service";

@Module({
    controllers: [UsuariosController],
    providers: [UsuariosService],
    exports: [UsuariosService]
})

export class UsuariosModule {}