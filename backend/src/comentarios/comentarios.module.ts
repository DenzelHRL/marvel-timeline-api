import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Comentario, Obra} from '../database/entities';
import {ComentariosController} from './comentarios.controller';
import {ComentariosService} from './comentarios.service';

@Module({
    imports: [TypeOrmModule.forFeature([Comentario, Obra])],
    controllers: [ComentariosController],
    providers: [ComentariosService],
    exports:[ComentariosService]
})
export class ComentariosModule{}