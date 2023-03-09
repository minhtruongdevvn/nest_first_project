import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { AppModule } from 'src/app.module';
import { AuthDto } from 'src/auth/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';
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
    describe('Get empty bookmark', () => {
      it('should return empty', async () => {
        await pactum
          .spec()
          .get('/bookmarks/me')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .expectBody([]);
      });
    });

    describe('Create bookmark', () => {
      const createDto: CreateBookmarkDto = {
        title: 'test bookmark title',
        description: 'test bookmark description',
        link: 'test bookmark link',
      };

      it('should throw if unauthorized', async () => {
        await pactum
          .spec()
          .post('/bookmarks')
          .withBody(createDto)
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should throw if validation failed create bookmarks', async () => {
        await pactum
          .spec()
          .post('/bookmarks')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .withBody({ ...createDto, link: '' })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should create bookmarks', async () => {
        await pactum
          .spec()
          .post('/bookmarks')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .withBody(createDto)
          .expectStatus(HttpStatus.CREATED)
          .stores('bookmarkId', 'id')
          .stores('bookmarkTitle', 'title');
      });
    });

    describe('Get bookmarks', () => {
      it('should throw if unauthorized', async () => {
        await pactum
          .spec()
          .get('/bookmarks/me')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should return user bookmarks', async () => {
        await pactum
          .spec()
          .get('/bookmarks/me')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(1);
      });
    });

    describe('Get bookmark by id', () => {
      it('should return empty if bookmark not found', async () => {
        await pactum
          .spec()
          .get('/bookmarks/99999')
          .expectStatus(HttpStatus.OK)
          .expectBody('');
      });

      it('should return bookmark of requested id', async () => {
        await pactum
          .spec()
          //.get('/bookmarks/$S{bookmarkId}')
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('$S{bookmarkId}')
          .expectBodyContains('$S{bookmarkTitle}');
      });
    });

    beforeAll(async () => {
      await pactum
        .spec()
        .post('/auth/signup')
        .withBody({
          email: 'test2@e.com',
          password: '123',
        })
        .expectStatus(201)
        .stores('user2At', 'access_token');
    });

    describe('Edit bookmark', () => {
      const editDto: EditBookmarkDto = {
        title: 'test edit bookmark title',
        link: 'test edit bookmark link',
      };

      it('should thow if user is not owner', async () => {
        await pactum
          .spec()
          .put('/bookmarks/$S{bookmarkId}')
          .withHeaders('Authorization', 'Bearer $S{user2At}')
          .withBody(editDto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should throw if bookmark not found', async () => {
        await pactum
          .spec()
          .put('/bookmarks/99999')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .withBody(editDto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should edit successfully', async () => {
        await pactum
          .spec()
          .put('/bookmarks/$S{bookmarkId}')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .withBody(editDto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(editDto.title)
          .expectBodyContains(editDto.link);
      });
    });

    describe('Delete bookmark', () => {
      it('should thow if user is not owner', async () => {
        await pactum
          .spec()
          .delete('/bookmarks/$S{bookmarkId}')
          .withHeaders('Authorization', 'Bearer $S{user2At}')
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should throw if bookmark not found', async () => {
        await pactum
          .spec()
          .delete('/bookmarks/99999')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should delete successfully', async () => {
        await pactum
          .spec()
          .delete('/bookmarks/$S{bookmarkId}')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .expectStatus(HttpStatus.OK);

        await pactum
          .spec()
          .get('/bookmarks/me')
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .expectStatus(HttpStatus.OK)
          .expectBody([]);
      });
    });
  });
});
