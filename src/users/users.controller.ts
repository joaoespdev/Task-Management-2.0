import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Importe o guard personalizado

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto.name, dto.email, dto.password);
  }

  @Post('login')
  async login(@Body() dto: CreateUserDto) {
    return this.usersService.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard) // Use o guard personalizado
  @Get()
  async findAll() {
    return this.usersService.listUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }

  //RETIRAR APÓS RESOLVER PROBLEMA TOKEN JWT INVALIDO 401 REQUEST
  @UseGuards(JwtAuthGuard)
  @Get('test-auth')
  testAuth(@Request() req) {
    return {
      message: 'Autenticação funcionando!',
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }

  //RETIRAR APÓS RESOLVER PROBLEMA TOKEN JWT INVALIDO 401 REQUEST
  @UseGuards(JwtAuthGuard)
  @Get('simple-test')
  simpleTest() {
    return { message: 'Esta rota funciona sem banco de dados!' };
  }
}
