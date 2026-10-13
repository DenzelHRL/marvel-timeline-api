import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Comentario, Obra, Usuario} from '../database/entities';
import {ComentariosController} from './comentarios.controller';
import {ComentariosService} from './comentarios.service';

@Module({
    imports: [TypeOrmModule.forFeature([Comentario, Obra, Usuario])],
    controllers: [ComentariosController],
    providers: [ComentariosService],
    exports:[ComentariosService]
})
export class ComentariosModule{}