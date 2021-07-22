
import {processForm, SecureFormData} from './process-form';
import {
  DeploymentStage,
  LunaSecExpressAuthPlugin,
  LunaSecTokenAuthService,
  SecureResolver
} from '@lunasec/node-sdk';

import {Request, Router} from 'express'
import cors from "cors";
import {randomUUID} from "crypto";
const routes = Router();


const secureResolver = new SecureResolver({
  stage: DeploymentStage.DEV
});

const secureProcessForm = secureResolver.wrap(processForm);

export function createRoutes(tokenService: LunaSecTokenAuthService) {

  routes.use(cors({
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST']
  }));

  const authPlugin = new LunaSecExpressAuthPlugin({
    tokenService: tokenService,
    authContextCallback: (req: Request) => {
      const idToken = req.cookies['id_token'];

      if (idToken === undefined) {
        console.error('id_token is not set in request');
        return null;
      }

      // TODO (cthompson) validate the jwt and pull relevant claims from payload

      return {};
    }
  });

  authPlugin.register(routes);

  routes.get('/set-id-token', async function (_, res) {
    const id_token = await tokenService.authenticate({
      session_id: randomUUID()
    })
    res.cookie('id_token', id_token.toString())
    res.redirect('back')
  });

  routes.get('/', async (_req, res) => {
    res.end();
  });

  routes.post('/signup', async (req, res) => {
    const ssnToken: string = req.body.ssnToken;

    if (!ssnToken) {
      console.error("ssn token is not set");
      res.status(400)
      res.end()
      return;
    }

    const formData: SecureFormData = {
      ssnToken: ssnToken
    };

    const plaintext = await secureProcessForm(formData);
    if (plaintext === undefined) {
      console.error("error when calling process form")
      res.status(500)
      res.end()
      return;
    }

    console.log(plaintext);
    res.status(200)
    res.end()
  });

  routes.get('/grant', async (req, res) => {
    const tokenId = req.query.token;

    if (tokenId === undefined || typeof tokenId !== 'string') {
      console.error("token not defined in grant request, or is not a string");
      res.status(400);
      res.end();
      return;
    }

    // TODO (cthompson) sessionId is a value that should be set in the jwt, it is a value that the session for the backend and secure frame share
    const sessionId = "1234";

    try {
      const tokenGrant = await tokenService.authorize(sessionId, tokenId);
      res.json({
        "grant": tokenGrant // grant stringifies itself on serialization
      });
      res.end();
    } catch (e) {
      console.error("error while authorizing token grant: ", e);
      res.status(500);
      res.end();
      return;
    }
  })

  return routes;
}