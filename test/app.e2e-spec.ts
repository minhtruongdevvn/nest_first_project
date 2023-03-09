import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { AppModule } from 'src/app.module';
import { AuthDto } from 'src/auth/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EditUserDto } from 'src/user/dto/edit-user.dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test@e.com',
      password: '123',
    };
    describe('Sign up', () => {
      it('should throw if required field is missing', async () => {
        await pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: dto.password })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should sign up', async () => {
        await pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('Sign in', () => {
      it('should throw if required field is missing', async () => {
        await pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: dto.email })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should throw if incorrect password', async () => {
        await pactum
          .spec()
          .post('/auth/signin')
          .withBody({ ...dto, password: '456' })
          .expectStatus(401);
      });

      it('should sign in', async () => {
        await pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });
  describe('User', () => {
    describe('Get me', () => {
      it('should throw if no auth provided', async () => {
        await pactum
          .spec()
          .get('/users/me')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should get current user', async () => {
        await pactum
          .spec()
          .get('/users/me')
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .expectStatus(HttpStatus.OK);
      });
    });

    describe('Edit me', () => {
      it('should throw if not authorized', async () => {
        await pactum
          .spec()
          .put('/users/me')
          .withBody({ email: 'testeedit@e.com' })
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should edit successfully', async () => {
        const editedUser: EditUserDto = {
          email: 'testeedit@e.com',
          firstName: 'Truong',
          lastName: 'Le',
        };

        await pactum
          .spec()
          .put('/users/me')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .withBody({ ...editedUser })
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(editedUser.email)
          .expectBodyContains(editedUser.firstName)
          .expectBodyContains(editedUser.lastName);

        // await pactum
        //   .spec()
        //   .get('/users/me')
        //   .withHeaders({ Authorization: `Bearer $S{userAt}` })
        //   .expectStatus(HttpStatus.OK);
      });
    });
  });
  describe('Bookmarks', () => {
    describe('Create bookmark', () => {});
    describe('Get bookmarks', () => {});
    describe('Get bookmark by id', () => {});
    describe('Edit bookmark', () => {});
    describe('Delete bookmark', () => {});
  });
});
